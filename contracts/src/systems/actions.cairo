// Dojo contract for The Ronin's Pact quest game logic
// This contract stores game configuration and validates trial completion
// Player progress is stored in the NFT contract (pact.cairo)

use starknet::ContractAddress;

// Quest actions interface
#[starknet::interface]
pub trait IActions<T> {
    // Player actions
    fn mint(ref self: T, username: felt252);
    fn complete_waza(ref self: T, token_id: u256, game_address: ContractAddress);
    fn complete_chi(ref self: T, token_id: u256, questions: Array<u32>, answers: Array<felt252>);
    fn complete_shin(ref self: T, token_id: u256, vow: ByteArray);

    // View functions (for querying models without Torii)
    fn get_player_token_id(self: @T, player: ContractAddress) -> u256;
    fn get_time_lock(self: @T) -> u64;

    // Admin functions
    fn set_pact(ref self: T, pact: ContractAddress, time_lock: u64);
    fn set_game(ref self: T, contract_address: ContractAddress, active: bool);
    fn set_quiz(ref self: T, answers: Array<felt252>);
}

#[dojo::contract]
pub mod actions {
    use core::keccak::compute_keccak_byte_array;
    use starknet::{ContractAddress, get_caller_address};
    use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use dojo::world::WorldStorage;
    use dojo::model::ModelStorage;
    use dojo::event::EventStorage;

    use super::IActions;
    use ronin_quest::models::{RoninPact, RoninGame, RoninAnswers, PlayerToken};
    use ronin_quest::token::pact::{IRoninPactDispatcher, IRoninPactDispatcherTrait};

    const CONFIG_KEY: u32 = 0;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PactMinted {
        #[key]
        pub player: ContractAddress,
        pub token_id: u256,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct WazaCompleted {
        #[key]
        pub token_id: u256,
        pub player: ContractAddress,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct ChiCompleted {
        #[key]
        pub token_id: u256,
        pub player: ContractAddress,
    }

    #[derive(Drop, Serde)]
    #[dojo::event]
    pub struct ShinCompleted {
        #[key]
        pub token_id: u256,
        pub player: ContractAddress,
        pub vow: ByteArray,
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn mint(ref self: ContractState, username: felt252) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let pact_config: RoninPact = world.read_model(CONFIG_KEY);
            let pact_erc721 = IERC721Dispatcher { contract_address: pact_config.pact };

            // Check if caller already has a pact NFT
            let balance = pact_erc721.balance_of(caller);
            assert(balance == 0, 'Already owns a pact NFT');

            // Mint the pact NFT to the caller and get token_id
            let pact_nft = IRoninPactDispatcher { contract_address: pact_config.pact };
            let token_id = pact_nft.mint(caller, username);

            // Store player token mapping in Dojo model
            let player_token = PlayerToken { player: caller, token_id };
            world.write_model(@player_token);

            // Emit Dojo event
            world.emit_event(@PactMinted { player: caller, token_id });
        }

        fn complete_waza(ref self: ContractState, token_id: u256, game_address: ContractAddress) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let pact_config: RoninPact = world.read_model(CONFIG_KEY);
            let game_config: RoninGame = world.read_model(game_address);
            assert(game_config.active, 'Game not whitelisted');

            let pact_erc721 = IERC721Dispatcher { contract_address: pact_config.pact };
            let owner = pact_erc721.owner_of(token_id);
            assert(owner == caller, 'Not token owner');

            // Check if caller owns an NFT from the specified game
            let game_erc721 = IERC721Dispatcher { contract_address: game_address };
            let balance = game_erc721.balance_of(caller);
            assert(balance >= 1, 'No game tokens owned!');

            let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
            nft.complete_waza(token_id);

            world.emit_event(@WazaCompleted { token_id, player: caller });
        }

        fn complete_chi(ref self: ContractState, token_id: u256, questions: Array<u32>, answers: Array<felt252>) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            // Verify answer count matches question count
            assert(questions.len() == answers.len(), 'Question/answer mismatch');

            let pact_config: RoninPact = world.read_model(CONFIG_KEY);
            let answers_config: RoninAnswers = world.read_model(CONFIG_KEY);

            let pact_erc721 = IERC721Dispatcher { contract_address: pact_config.pact };
            let owner = pact_erc721.owner_of(token_id);
            assert(owner == caller, 'Not token owner');

            let mut correct: u256 = 0;
            for i in 0..questions.len() {
                let question_idx = *questions.at(i);
                let answer_hash = *answers.at(i);
                let expected_hash = *answers_config.answers.at(question_idx);

                if answer_hash == expected_hash {
                    correct += 1;
                }
            };

            assert(correct >= 3, 'Incorrect answers!');

            let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
            nft.complete_chi(token_id);

            world.emit_event(@ChiCompleted { token_id, player: caller });
        }

        fn complete_shin(ref self: ContractState, token_id: u256, vow: ByteArray) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            // Verify vow is not empty
            assert(vow.len() > 0, 'Vow cannot be empty');

            let pact_config: RoninPact = world.read_model(CONFIG_KEY);

            // Verify caller owns the token
            let pact_erc721 = IERC721Dispatcher { contract_address: pact_config.pact };
            let owner = pact_erc721.owner_of(token_id);
            assert(owner == caller, 'Not token owner');

            // Get mint timestamp from NFT contract and time lock from config model
            let nft = IRoninPactDispatcher { contract_address: pact_config.pact };
            let mint_timestamp = nft.get_timestamp(token_id);
            let current_time = starknet::get_block_timestamp();

            assert(current_time - mint_timestamp >= pact_config.time_lock, 'Time lock not elapsed!');

            // Complete the trial and store the hash
            let mut vow_hash: u256 = compute_keccak_byte_array(@vow);
            nft.complete_shin(token_id, vow_hash);

            // Emit completion event
            world.emit_event(@ShinCompleted { token_id, player: caller, vow });
        }

        // View functions
        fn get_player_token_id(self: @ContractState, player: ContractAddress) -> u256 {
            let world = self.world_default();
            let player_token: PlayerToken = world.read_model(player);
            player_token.token_id
        }

        fn get_time_lock(self: @ContractState) -> u64 {
            let world = self.world_default();
            let pact_config: RoninPact = world.read_model(CONFIG_KEY);
            pact_config.time_lock
        }

        // Admin functions
        // Note: Authorization is handled by Dojo's permission system (owners in dojo_<profile>.toml)
        fn set_pact(ref self: ContractState, pact: ContractAddress, time_lock: u64) {
            let mut world = self.world_default();
            let config = RoninPact { game_id: 0, pact, time_lock };
            world.write_model(@config);
        }

        fn set_game(ref self: ContractState, contract_address: ContractAddress, active: bool) {
            let mut world = self.world_default();
            let config = RoninGame { contract_address, active };
            world.write_model(@config);
        }

        fn set_quiz(ref self: ContractState, answers: Array<felt252>) {
            let mut world = self.world_default();
            let config = RoninAnswers { game_id: 0, answers };
            world.write_model(@config);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"ronin_quest")
        }
    }

    // Empty initialization function - required by Dojo framework
    // Authorization is handled by Dojo's permission system, not custom ownership
    fn dojo_init(ref self: ContractState) {
        // No initialization needed - configuration is done via admin functions
        // with permissions managed by Dojo's auth system
    }
}
