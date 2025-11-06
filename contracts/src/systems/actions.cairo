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
    fn complete_level(ref self: T, token_id: u256, level_number: u8, proof_data: Span<felt252>);

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

        fn complete_level(ref self: ContractState, token_id: u256, level_number: u8, proof_data: Span<felt252>) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            // 1. Get NFT contract and verify ownership
            let config: AdventureConfig = world.read_model(CONFIG_KEY);
            let nft_erc721 = IERC721Dispatcher { contract_address: config.nft_contract };
            let owner = nft_erc721.owner_of(token_id);
            assert(owner == caller, 'Not token owner');

            // 2. Get level configuration
            let level_config: LevelConfig = world.read_model(level_number);
            assert(level_config.active, 'Level not active');
            assert(level_number >= 1 && level_number <= config.total_levels, 'Invalid level');

            // 3. Check sequential progression (must complete level N-1 first)
            let nft = IAdventureMapDispatcher { contract_address: config.nft_contract };
            let progress = nft.get_progress(token_id);

            if level_number > 1 {
                // Check if previous level is complete
                let prev_level_mask: u256 = self.compute_level_mask(level_number - 1);
                assert((progress & prev_level_mask) != 0, 'Must complete previous level');
            }

            // 4. Check if already complete (idempotency)
            let level_mask: u256 = self.compute_level_mask(level_number);
            if (progress & level_mask) != 0 {
                return; // Already complete, no-op
            }

            // 5. Verify based on level type
            if level_config.level_type == 'challenge' {
                self.verify_challenge_level(caller, level_config.game_contract, level_config.minimum_score, proof_data);
            } else if level_config.level_type == 'puzzle' {
                self.verify_puzzle_level(caller, level_config.solution_address, proof_data);
            } else {
                core::panic_with_felt252('Invalid level type');
            }

            // 6. Mark level complete in NFT contract
            nft.complete_level(token_id, level_number);

            // 7. Emit event
            world.emit_event(@LevelCompleted {
                token_id,
                player: caller,
                level_number,
                level_type: level_config.level_type
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

        // ====================================================================
        // Verification Logic
        // ====================================================================

        fn verify_challenge_level(
            self: @ContractState,
            player: ContractAddress,
            game_contract: ContractAddress,
            minimum_score: u32,
            proof_data: Span<felt252>
        ) {
            // proof_data format: [game_token_id_low, game_token_id_high]
            // The game_token_id is the NFT token ID from the game's Denshokan contract
            assert(proof_data.len() >= 2, 'Invalid proof data format');

            // Reconstruct game_token_id from proof_data
            let game_token_id_low: u64 = (*proof_data.at(0)).try_into().expect('Invalid token_id_low');
            let game_token_id_high: u64 = (*proof_data.at(1)).try_into().expect('Invalid token_id_high');

            // For now, we'll use the low part as the token_id (assuming it fits in u64)
            // TODO: Support full u256 token IDs if needed
            let game_token_id: u64 = game_token_id_low;

            // Query the game contract via Denshokan interface
            let game = IMinigameTokenDataDispatcher { contract_address: game_contract };

            // Check that the game is over (completed)
            let is_game_over = game.game_over(game_token_id);
            assert(is_game_over, 'Game not completed');

            // Check that the score meets the minimum requirement
            let score = game.score(game_token_id);
            assert(score >= minimum_score, 'Score too low');

            // TODO: Verify that the player owns the game token
            // This requires checking the game's ERC721 ownership
            // For now, we trust that the player is providing their own game_token_id
        }

        fn verify_puzzle_level(
            self: @ContractState,
            player: ContractAddress,
            solution_address: ContractAddress,
            proof_data: Span<felt252>
        ) {
            // TODO: Implement secp256k1 signature verification
            // For now, stub with basic check
            //
            // Expected proof_data format: [r_low, r_high, s_low, s_high]
            // 1. Reconstruct message hash (hash of player address)
            // 2. Recover signer from signature
            // 3. Verify recovered address matches solution_address

            assert(proof_data.len() >= 4, 'Invalid signature format');

            // STUB: Always pass for now
            // TODO: Implement actual signature verification in next phase
            // See IMPL.md section 4.2 for full implementation details
        }
    }

    // Empty initialization function - required by Dojo framework
    fn dojo_init(ref self: ContractState) {
        // No initialization needed - configuration is done via admin functions
    }
}
