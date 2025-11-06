// ============================================================================
// FOCG Adventure Actions Contract (Dojo)
// ============================================================================
//
// Main game logic contract for FOCG Adventure.
// Handles minting, level verification (both challenge and puzzle types),
// and sequential progression enforcement.

use starknet::ContractAddress;

#[starknet::interface]
pub trait IAdventureActions<T> {
    // ========================================================================
    // Player Actions
    // ========================================================================
    fn mint(ref self: T, username: felt252);
    fn complete_challenge_level(ref self: T, map_id: u256, level_number: u8, game_id: u64);
    fn complete_puzzle_level(ref self: T, map_id: u256, level_number: u8, signature: Span<felt252>);

    // ========================================================================
    // View Functions
    // ========================================================================
    fn get_player_token_id(self: @T, player: ContractAddress) -> u256;
    fn get_level_status(self: @T, token_id: u256, level_number: u8) -> bool;
    fn get_progress(self: @T, token_id: u256) -> u256;
    fn get_level_config(self: @T, level_number: u8) -> (felt252, bool, ContractAddress, u32, ContractAddress); // (type, active, game_contract, minimum_score, solution_address)

    // ========================================================================
    // Admin Functions
    // ========================================================================
    fn set_nft_contract(ref self: T, nft_contract: ContractAddress, total_levels: u8);
    fn set_level_config(
        ref self: T,
        level_number: u8,
        level_type: felt252,
        game_contract: ContractAddress,
        minimum_score: u32,
        solution_address: ContractAddress,
        active: bool
    );
}

#[dojo::contract]
pub mod actions {
    use starknet::{ContractAddress, get_caller_address};
    use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use dojo::world::WorldStorage;
    use dojo::model::ModelStorage;
    use dojo::event::EventStorage;

    use super::IAdventureActions;
    use focg_adventure::models::{AdventureConfig, PlayerToken, LevelConfig};
    use focg_adventure::token::map::{IAdventureMapDispatcher, IAdventureMapDispatcherTrait};
    use focg_adventure::verifiers::interface::{IMinigameTokenDataDispatcher, IMinigameTokenDataDispatcherTrait};

    const CONFIG_KEY: u32 = 0;

    // ========================================================================
    // Events
    // ========================================================================

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct MapMinted {
        #[key]
        pub player: ContractAddress,
        pub token_id: u256,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct LevelCompleted {
        #[key]
        pub token_id: u256,
        pub player: ContractAddress,
        pub level_number: u8,
        pub level_type: felt252,
    }

    // ========================================================================
    // Implementation
    // ========================================================================

    #[abi(embed_v0)]
    impl ActionsImpl of IAdventureActions<ContractState> {
        fn mint(ref self: ContractState, username: felt252) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let config: AdventureConfig = world.read_model(CONFIG_KEY);
            let nft_erc721 = IERC721Dispatcher { contract_address: config.nft_contract };

            // Check if caller already has an Adventure Map NFT
            let balance = nft_erc721.balance_of(caller);
            assert(balance == 0, 'Already owns an Adventure Map');

            // Mint the Adventure Map NFT to the caller and get token_id
            let nft = IAdventureMapDispatcher { contract_address: config.nft_contract };
            let token_id = nft.mint(caller, username);

            // Store player token mapping in Dojo model
            let player_token = PlayerToken { player: caller, token_id };
            world.write_model(@player_token);

            // Emit Dojo event
            world.emit_event(@MapMinted { player: caller, token_id });
        }

        fn complete_challenge_level(ref self: ContractState, map_id: u256, level_number: u8, game_id: u64) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            // 1. Get NFT contract and verify ownership
            let config: AdventureConfig = world.read_model(CONFIG_KEY);
            let nft_erc721 = IERC721Dispatcher { contract_address: config.nft_contract };
            let owner = nft_erc721.owner_of(map_id);
            assert(owner == caller, 'Not token owner');

            // 2. Get level configuration
            let level_config: LevelConfig = world.read_model(level_number);
            assert(level_config.active, 'Level not active');
            assert(level_config.level_type == 'challenge', 'Not a challenge level');
            assert(level_number >= 1 && level_number <= config.total_levels, 'Invalid level');

            // 3. Check sequential progression (must complete level N-1 first)
            let nft = IAdventureMapDispatcher { contract_address: config.nft_contract };
            let progress = nft.get_progress(map_id);

            if level_number > 1 {
                let prev_level_mask: u256 = self.compute_level_mask(level_number - 1);
                assert((progress & prev_level_mask) != 0, 'Must complete previous level');
            }

            // 4. Check if already complete (idempotency)
            let level_mask: u256 = self.compute_level_mask(level_number);
            if (progress & level_mask) != 0 {
                return; // Already complete, no-op
            }

            // 5. Verify via Denshokan interface
            let game = IMinigameTokenDataDispatcher { contract_address: level_config.game_contract };
            let is_game_over = game.game_over(game_id);
            assert(is_game_over, 'Game not completed');

            let score = game.score(game_id);
            assert(score >= level_config.minimum_score, 'Score too low');

            // 6. Mark level complete in NFT contract
            nft.complete_level(map_id, level_number);

            // 7. Emit event
            world.emit_event(@LevelCompleted {
                token_id: map_id,
                player: caller,
                level_number,
                level_type: 'challenge'
            });
        }

        fn complete_puzzle_level(ref self: ContractState, map_id: u256, level_number: u8, signature: Span<felt252>) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            // 1. Get NFT contract and verify ownership
            let config: AdventureConfig = world.read_model(CONFIG_KEY);
            let nft_erc721 = IERC721Dispatcher { contract_address: config.nft_contract };
            let owner = nft_erc721.owner_of(map_id);
            assert(owner == caller, 'Not token owner');

            // 2. Get level configuration
            let level_config: LevelConfig = world.read_model(level_number);
            assert(level_config.active, 'Level not active');
            assert(level_config.level_type == 'puzzle', 'Not a puzzle level');
            assert(level_number >= 1 && level_number <= config.total_levels, 'Invalid level');

            // 3. Check sequential progression (must complete level N-1 first)
            let nft = IAdventureMapDispatcher { contract_address: config.nft_contract };
            let progress = nft.get_progress(map_id);

            if level_number > 1 {
                let prev_level_mask: u256 = self.compute_level_mask(level_number - 1);
                assert((progress & prev_level_mask) != 0, 'Must complete previous level');
            }

            // 4. Check if already complete (idempotency)
            let level_mask: u256 = self.compute_level_mask(level_number);
            if (progress & level_mask) != 0 {
                return; // Already complete, no-op
            }

            // 5. Verify signature (codeword-based)
            assert(signature.len() >= 4, 'Invalid signature format');
            // TODO: Implement secp256k1 signature verification
            // Expected signature format: [r_low, r_high, s_low, s_high]
            // 1. Reconstruct message hash (hash of player address)
            // 2. Recover signer from signature
            // 3. Verify recovered address matches solution_address

            // 6. Mark level complete in NFT contract
            nft.complete_level(map_id, level_number);

            // 7. Emit event
            world.emit_event(@LevelCompleted {
                token_id: map_id,
                player: caller,
                level_number,
                level_type: 'puzzle'
            });
        }

        // ====================================================================
        // View Functions
        // ====================================================================

        fn get_player_token_id(self: @ContractState, player: ContractAddress) -> u256 {
            let world = self.world_default();
            let player_token: PlayerToken = world.read_model(player);
            player_token.token_id
        }

        fn get_level_status(self: @ContractState, token_id: u256, level_number: u8) -> bool {
            let world = self.world_default();
            let config: AdventureConfig = world.read_model(CONFIG_KEY);
            let nft = IAdventureMapDispatcher { contract_address: config.nft_contract };
            let progress = nft.get_progress(token_id);

            let level_mask: u256 = self.compute_level_mask(level_number);
            (progress & level_mask) != 0
        }

        fn get_progress(self: @ContractState, token_id: u256) -> u256 {
            let world = self.world_default();
            let config: AdventureConfig = world.read_model(CONFIG_KEY);
            let nft = IAdventureMapDispatcher { contract_address: config.nft_contract };
            nft.get_progress(token_id)
        }

        fn get_level_config(self: @ContractState, level_number: u8) -> (felt252, bool, ContractAddress, u32, ContractAddress) {
            let world = self.world_default();
            let level_config: LevelConfig = world.read_model(level_number);
            (level_config.level_type, level_config.active, level_config.game_contract, level_config.minimum_score, level_config.solution_address)
        }

        // ====================================================================
        // Admin Functions
        // ====================================================================

        fn set_nft_contract(ref self: ContractState, nft_contract: ContractAddress, total_levels: u8) {
            let mut world = self.world_default();
            let config = AdventureConfig { game_id: CONFIG_KEY, nft_contract, total_levels };
            world.write_model(@config);
        }

        fn set_level_config(
            ref self: ContractState,
            level_number: u8,
            level_type: felt252,
            game_contract: ContractAddress,
            minimum_score: u32,
            solution_address: ContractAddress,
            active: bool
        ) {
            let mut world = self.world_default();
            let config = LevelConfig {
                level_number,
                level_type,
                active,
                game_contract,
                minimum_score,
                solution_address
            };
            world.write_model(@config);
        }
    }

    // ========================================================================
    // Internal Functions
    // ========================================================================

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"focg_adventure")
        }

        // Compute the bitmap mask for a given level number
        fn compute_level_mask(self: @ContractState, level_number: u8) -> u256 {
            let mask: u256 = 1_u256;
            let level_u256: u256 = level_number.into();
            mask * Self::pow2(level_u256)
        }

        // Helper function to compute 2^n
        fn pow2(n: u256) -> u256 {
            if n == 0 {
                return 1_u256;
            }
            let mut result: u256 = 1_u256;
            let mut i: u256 = 0;
            loop {
                if i >= n {
                    break;
                }
                result = result * 2_u256;
                i += 1;
            };
            result
        }

    }

    // Empty initialization function - required by Dojo framework
    fn dojo_init(ref self: ContractState) {
        // No initialization needed - configuration is done via admin functions
    }
}
