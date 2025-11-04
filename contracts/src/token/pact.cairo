// Standard ERC721 NFT contract for The Ronin's Pact
// This contract stores player progress only
// Game logic and configuration are handled by treasure_hunt.cairo

use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct TrialProgress {
    pub waza_complete: bool,
    pub chi_complete: bool,
    pub shin_complete: bool,
}

#[starknet::interface]
pub trait IRoninPact<TContractState> {
    // ERC721 functions (from OpenZeppelin)
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn token_uri(self: @TContractState, token_id: u256) -> ByteArray;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
    fn transfer_from(
        ref self: TContractState, from: ContractAddress, to: ContractAddress, token_id: u256
    );
    fn safe_transfer_from(
        ref self: TContractState,
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    );
    fn approve(ref self: TContractState, to: ContractAddress, token_id: u256);
    fn set_approval_for_all(ref self: TContractState, operator: ContractAddress, approved: bool);
    fn get_approved(self: @TContractState, token_id: u256) -> ContractAddress;
    fn is_approved_for_all(
        self: @TContractState, owner: ContractAddress, operator: ContractAddress
    ) -> bool;

    // Custom functions
    fn mint(ref self: TContractState, recipient: ContractAddress, username: felt252) -> u256;
    fn get_progress(self: @TContractState, token_id: u256) -> TrialProgress;
    fn get_timestamp(self: @TContractState, token_id: u256) -> u64;
    fn get_username(self: @TContractState, token_id: u256) -> felt252;
    fn get_vow_hash(self: @TContractState, token_id: u256) -> u256;

    // Trial completion functions (only callable by authorized minter contract)
    fn complete_waza(ref self: TContractState, token_id: u256);
    fn complete_chi(ref self: TContractState, token_id: u256);
    fn complete_shin(ref self: TContractState, token_id: u256, vow_hash: u256);

    // Admin functions
    fn set_minter(ref self: TContractState, minter: ContractAddress);
    fn get_minter(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod RoninPact {
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess
    };
    use super::TrialProgress;
    use ronin_quest::token::svg;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 implementations (not embedded in ABI, for internal use only)
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    impl ERC721MetadataImpl = ERC721Component::ERC721MetadataImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    // Bit flags for trial progress
    const WAZA_BIT: u8 = 0x04; // 0b100
    const CHI_BIT: u8 = 0x02;  // 0b010
    const SHIN_BIT: u8 = 0x01; // 0b001

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        owner: ContractAddress,
        minter: ContractAddress,
        token_count: u256,
        mint_timestamps: Map<u256, u64>,
        minter_usernames: Map<u256, felt252>,
        token_progress: Map<u256, u8>,
        vow_hashes: Map<u256, u256>,
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
        self.erc721.initializer("The Ronin's Pact", "RONIN", "");
        self.owner.write(owner);
        self.minter.write(owner);
        self.token_count.write(0);
    }

    #[abi(embed_v0)]
    impl RoninPactImpl of super::IRoninPact<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.erc721.name()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc721.symbol()
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            let progress = self.get_progress(token_id);
            let username = self.get_username(token_id);
            svg::generate_svg(progress, username)
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.erc721.balance_of(account)
        }

        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            self.erc721.owner_of(token_id)
        }

        fn transfer_from(
            ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256
        ) {
            self.erc721.transfer_from(from, to, token_id);
        }

        fn safe_transfer_from(
            ref self: ContractState,
            from: ContractAddress,
            to: ContractAddress,
            token_id: u256,
            data: Span<felt252>
        ) {
            self.erc721.safe_transfer_from(from, to, token_id, data);
        }

        fn approve(ref self: ContractState, to: ContractAddress, token_id: u256) {
            self.erc721.approve(to, token_id);
        }

        fn set_approval_for_all(
            ref self: ContractState, operator: ContractAddress, approved: bool
        ) {
            self.erc721.set_approval_for_all(operator, approved);
        }

        fn get_approved(self: @ContractState, token_id: u256) -> ContractAddress {
            self.erc721.get_approved(token_id)
        }

        fn is_approved_for_all(
            self: @ContractState, owner: ContractAddress, operator: ContractAddress
        ) -> bool {
            self.erc721.is_approved_for_all(owner, operator)
        }

        fn mint(ref self: ContractState, recipient: ContractAddress, username: felt252) -> u256 {
            self.assert_minter();

            // Get next token ID
            let token_id = self.token_count.read();
            self.token_count.write(token_id + 1);

            // Mint the token to recipient and initialize progress
            self.erc721.mint(recipient, token_id);
            self.token_progress.write(token_id, 0);

            // Store mint timestamp and username
            let mint_timestamp = starknet::get_block_timestamp();
            self.mint_timestamps.write(token_id, mint_timestamp);
            self.minter_usernames.write(token_id, username);

            token_id
        }

        fn get_progress(self: @ContractState, token_id: u256) -> TrialProgress {
            let progress = self.token_progress.read(token_id);

            TrialProgress {
                waza_complete: (progress & WAZA_BIT) != 0,
                chi_complete: (progress & CHI_BIT) != 0,
                shin_complete: (progress & SHIN_BIT) != 0,
            }
        }

        fn get_timestamp(self: @ContractState, token_id: u256) -> u64 {
            self.mint_timestamps.read(token_id)
        }

        fn get_username(self: @ContractState, token_id: u256) -> felt252 {
            self.minter_usernames.read(token_id)
        }

        fn get_vow_hash(self: @ContractState, token_id: u256) -> u256 {
            self.vow_hashes.read(token_id)
        }

        fn complete_waza(ref self: ContractState, token_id: u256) {
            self.complete_challenge(token_id, WAZA_BIT);
        }

        fn complete_chi(ref self: ContractState, token_id: u256) {
            self.complete_challenge(token_id, CHI_BIT);
        }

        fn complete_shin(ref self: ContractState, token_id: u256, vow_hash: u256) {
            self.vow_hashes.write(token_id, vow_hash);
            self.complete_challenge(token_id, SHIN_BIT);
        }

        fn set_minter(ref self: ContractState, minter: ContractAddress) {
            self.assert_only_owner();
            self.minter.write(minter);
        }

        fn get_minter(self: @ContractState) -> ContractAddress {
            self.minter.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner');
        }

        fn assert_minter(self: @ContractState) {
            let caller = get_caller_address();
            let minter = self.minter.read();
            assert(caller == minter, 'Only minter');
        }

        fn complete_challenge(ref self: ContractState, token_id: u256, challenge_bit: u8) {
            self.assert_minter();

            let progress = self.token_progress.read(token_id);
            self.token_progress.write(token_id, progress | challenge_bit);
        }
    }
}
