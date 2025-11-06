// Mock contracts for testing

use starknet::ContractAddress;

// ============================================================================
// Mock Verifier - for testing level verification
// ============================================================================

#[starknet::interface]
pub trait IMockVerifier<TContractState> {
    fn verify(self: @TContractState, player: ContractAddress, proof_data: Span<felt252>) -> bool;
}

#[starknet::contract]
pub mod MockVerifier {
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        should_pass: bool,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, should_pass: bool) {
        self.should_pass.write(should_pass);
    }

    #[abi(embed_v0)]
    impl MockVerifierImpl of super::IMockVerifier<ContractState> {
        fn verify(self: @ContractState, player: ContractAddress, proof_data: Span<felt252>) -> bool {
            self.should_pass.read()
        }
    }
}

// ============================================================================
// Mock ERC721 - for testing game NFT ownership
// ============================================================================

// Minimal ERC721 contract for testing game NFT ownership validation
// Implements the minimal IERC721 interface needed for actions.cairo

#[starknet::interface]
pub trait IMockERC721<TContractState> {
    fn mint(ref self: TContractState, to: ContractAddress);
}

#[starknet::contract]
pub mod MockERC721 {
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use openzeppelin::token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use openzeppelin::introspection::src5::SRC5Component;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 Mixin
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        next_token_id: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let name = "Test Game NFT";
        let symbol = "TEST";
        let base_uri = "";

        self.erc721.initializer(name, symbol, base_uri);
        self.next_token_id.write(1);
    }

    #[abi(embed_v0)]
    impl MockERC721Impl of super::IMockERC721<ContractState> {
        fn mint(ref self: ContractState, to: ContractAddress) {
            let token_id = self.next_token_id.read();
            self.erc721.mint(to, token_id);
            self.next_token_id.write(token_id + 1);
        }
    }
}
