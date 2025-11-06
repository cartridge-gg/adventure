// ============================================================================
// ILevelVerifier - Interface for Game Level Verification
// ============================================================================
//
// This trait defines the interface that all game verifiers must implement.
// Each game can have its own custom verification logic (e.g., score threshold,
// achievement unlock, NFT ownership, etc.)

use starknet::ContractAddress;

#[starknet::interface]
pub trait ILevelVerifier<T> {
    /// Verify that a player has completed the game challenge
    ///
    /// # Arguments
    /// * `player` - The player's address
    /// * `proof_data` - Game-specific proof data (format varies by verifier)
    ///
    /// # Returns
    /// * `bool` - true if verification passes, false otherwise
    fn verify(self: @T, player: ContractAddress, proof_data: Span<felt252>) -> bool;
}
