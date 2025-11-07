// Mock contracts for testing

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
    fn complete_game(ref self: TContractState, token_id: u64, score: u32);
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

        fn complete_game(ref self: ContractState, token_id: u64, score: u32) {
            self.scores.write(token_id, score);
            self.game_over.write(token_id, true);
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
