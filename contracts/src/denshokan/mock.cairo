// Mock contracts for testing

// ============================================================================
// MockGame - Mock Denshokan Game for testing
// ============================================================================
//
// Implements IMinigameTokenData interface for testing challenge level verification

use focg_adventure::denshokan::interface::IMinigameTokenData;

#[starknet::interface]
pub trait IMockGameAdmin<TContractState> {
    fn set_game_over(ref self: TContractState, token_id: u64, is_over: bool);
}

#[starknet::contract]
pub mod MockGame {
    use super::{IMinigameTokenData, IMockGameAdmin};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

    #[storage]
    struct Storage {
        game_over: Map<u64, bool>,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        // No initialization needed
    }

    #[abi(embed_v0)]
    impl MockGameAdminImpl of IMockGameAdmin<ContractState> {
        fn set_game_over(ref self: ContractState, token_id: u64, is_over: bool) {
            self.game_over.write(token_id, is_over);
        }
    }

    #[abi(embed_v0)]
    impl MinigameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: u64) -> u32 {
            0
        }

        fn game_over(self: @ContractState, token_id: u64) -> bool {
            self.game_over.read(token_id)
        }
    }
}
