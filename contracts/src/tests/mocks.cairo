// Mock contracts for testing

use starknet::ContractAddress;

// ============================================================================
// MockGame - Mock Denshokan Game for testing
// ============================================================================
//
// Implements IMinigameTokenData interface for testing challenge level verification

use focg_adventure::verifiers::interface::IMinigameTokenData;

#[starknet::interface]
pub trait IMockGameAdmin<TContractState> {
    fn set_score(ref self: TContractState, token_id: u64, score: u32);
    fn set_game_over(ref self: TContractState, token_id: u64, is_over: bool);
}

#[starknet::contract]
pub mod MockGame {
    use super::{IMinigameTokenData, IMockGameAdmin};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

    #[storage]
    struct Storage {
        scores: Map<u64, u32>,
        game_over: Map<u64, bool>,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        // No initialization needed
    }

    #[abi(embed_v0)]
    impl MockGameAdminImpl of IMockGameAdmin<ContractState> {
        fn set_score(ref self: ContractState, token_id: u64, score: u32) {
            self.scores.write(token_id, score);
        }

        fn set_game_over(ref self: ContractState, token_id: u64, is_over: bool) {
            self.game_over.write(token_id, is_over);
        }
    }

    #[abi(embed_v0)]
    impl MinigameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: u64) -> u32 {
            self.scores.read(token_id)
        }

        fn game_over(self: @ContractState, token_id: u64) -> bool {
            self.game_over.read(token_id)
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
