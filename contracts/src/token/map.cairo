// ============================================================================
// Adventure Map NFT Contract
// ============================================================================
//
// Standard ERC721 NFT contract for FOCG Adventure.
// Stores player progress via bitmap (supports up to 256 levels).
// Dynamic SVG metadata updates as levels are completed.

use starknet::ContractAddress;

#[starknet::interface]
pub trait IAdventureMap<TContractState> {
    // ========================================================================
    // ERC721 Standard Functions
    // ========================================================================
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

    // ========================================================================
    // Custom Functions
    // ========================================================================

    // Minting (only callable by authorized minter - the Actions contract)
    fn mint(ref self: TContractState, recipient: ContractAddress, username: felt252) -> u256;

    // Level completion (only callable by authorized minter - the Actions contract)
    fn complete_level(ref self: TContractState, token_id: u256, level_number: u8);

    // View functions
    fn get_progress(self: @TContractState, token_id: u256) -> u64; // Returns bitmap
    fn get_username(self: @TContractState, token_id: u256) -> felt252;
    fn get_timestamp(self: @TContractState, token_id: u256) -> u64;

    // Admin functions
    fn set_minter(ref self: TContractState, minter: ContractAddress);
    fn get_minter(self: @TContractState) -> ContractAddress;
    fn set_total_levels(ref self: TContractState, total: u8);
    fn get_total_levels(self: @TContractState) -> u8;
}

#[starknet::contract]
pub mod AdventureMap {
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess
    };
    use focg_adventure::token::svg;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 implementations (not embedded in ABI, for internal use only)
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    impl ERC721MetadataImpl = ERC721Component::ERC721MetadataImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,

        owner: ContractAddress,
        minter: ContractAddress,
        token_count: u256,

        // Per-token data
        mint_timestamps: Map<u256, u64>,
        usernames: Map<u256, felt252>,
        progress_bitmaps: Map<u256, u64>,

        // Configuration
        total_levels: u8,
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
    fn constructor(ref self: ContractState, owner: ContractAddress, total_levels: u8) {
        self.erc721.initializer("FOCG Adventure Map", "FOCG", "");
        self.owner.write(owner);
        self.minter.write(owner);
        self.token_count.write(0);
        self.total_levels.write(total_levels);
    }

    #[abi(embed_v0)]
    impl AdventureMapImpl of super::IAdventureMap<ContractState> {
        // ====================================================================
        // ERC721 Standard Functions
        // ====================================================================

        fn name(self: @ContractState) -> ByteArray {
            self.erc721.name()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc721.symbol()
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            let progress = self.get_progress(token_id);
            let username = self.get_username(token_id);
            let total_levels = self.total_levels.read();
            svg::generate_adventure_map_svg(progress, username, total_levels, token_id)
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

        // ====================================================================
        // Custom Functions
        // ====================================================================

        fn mint(ref self: ContractState, recipient: ContractAddress, username: felt252) -> u256 {
            self.assert_minter();

            // Get next token ID
            let token_id = self.token_count.read();
            self.token_count.write(token_id + 1);

            // Mint the token to recipient and initialize progress
            self.erc721.mint(recipient, token_id);
            self.progress_bitmaps.write(token_id, 0);  // No levels complete yet

            // Store mint timestamp and username
            let mint_timestamp = starknet::get_block_timestamp();
            self.mint_timestamps.write(token_id, mint_timestamp);
            self.usernames.write(token_id, username);

            token_id
        }

        fn complete_level(ref self: ContractState, token_id: u256, level_number: u8) {
            self.assert_minter();  // Only Actions contract can call

            // Read current progress
            let progress = self.progress_bitmaps.read(token_id);

            // Set bit for this level (using 1-indexed levels)
            // Level N maps to bit N
            let mask: u64 = 1_u64;
            let level_u64: u64 = level_number.into();
            let shifted_mask = mask * InternalImpl::pow2(level_u64);

            let new_progress = progress | shifted_mask;

            // Write updated progress
            self.progress_bitmaps.write(token_id, new_progress);
        }

        fn get_progress(self: @ContractState, token_id: u256) -> u64 {
            self.progress_bitmaps.read(token_id)
        }

        fn get_username(self: @ContractState, token_id: u256) -> felt252 {
            self.usernames.read(token_id)
        }

        fn get_timestamp(self: @ContractState, token_id: u256) -> u64 {
            self.mint_timestamps.read(token_id)
        }

        fn set_minter(ref self: ContractState, minter: ContractAddress) {
            self.assert_owner();
            self.minter.write(minter);
        }

        fn get_minter(self: @ContractState) -> ContractAddress {
            self.minter.read()
        }

        fn set_total_levels(ref self: ContractState, total: u8) {
            self.assert_owner();
            self.total_levels.write(total);
        }

        fn get_total_levels(self: @ContractState) -> u8 {
            self.total_levels.read()
        }
    }

    // ========================================================================
    // Internal Functions
    // ========================================================================

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_owner(self: @ContractState) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Caller is not owner');
        }

        fn assert_minter(self: @ContractState) {
            let caller = get_caller_address();
            let minter = self.minter.read();
            assert(caller == minter, 'Caller is not minter');
        }

        // Helper function to compute 2^n for bitmap shifting
        fn pow2(n: u64) -> u64 {
            if n == 0 {
                return 1_u64;
            }
            let mut result: u64 = 1_u64;
            let mut i: u64 = 0;
            loop {
                if i >= n {
                    break;
                }
                result = result * 2_u64;
                i += 1;
            };
            result
        }
    }
}
