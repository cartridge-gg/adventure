// ============================================================================
// MinimumScoreVerifier - Stub Verifier for Game Levels
// ============================================================================
//
// This is a placeholder verifier that always returns true for testing.
// In production, this would be replaced with game-specific logic that:
// - Reads score from game's Dojo world
// - Checks achievements or completion status
// - Verifies NFT ownership
// etc.

use super::interface::ILevelVerifier;

#[starknet::contract]
pub mod MinimumScoreVerifier {
    use super::ILevelVerifier;
    use starknet::ContractAddress;
    use starknet::storage::StoragePointerWriteAccess;

    #[storage]
    struct Storage {
        // Future: game world address, minimum score threshold, etc.
        threshold: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, threshold: u256) {
        self.threshold.write(threshold);
    }

    #[abi(embed_v0)]
    impl VerifierImpl of ILevelVerifier<ContractState> {
        fn verify(self: @ContractState, player: ContractAddress, proof_data: Span<felt252>) -> bool {
            // STUB: Always return true for now
            // TODO: Implement actual game-specific verification
            //
            // Example implementation:
            // 1. Read proof_data to get game_id or other identifiers
            // 2. Query game's Dojo world for player's score/status
            // 3. Compare against threshold
            // 4. Return result

            true
        }
    }
}
