// ============================================================================
// Denshokan Interface - Game Token Data Queries
// ============================================================================
//
// This interface matches the Denshokan standard for querying game state.
// All FOCG games implementing Denshokan will expose these methods.
//
// See: contracts/DENSHOKAN.md for full specification

#[starknet::interface]
pub trait IMinigameTokenData<T> {
    /// Returns the current score/progress for a game token
    ///
    /// # Arguments
    /// * `token_id` - The game token ID
    ///
    /// # Returns
    /// * `u32` - The score/progress value
    fn score(self: @T, token_id: u64) -> u32;

    /// Returns whether the game has ended
    ///
    /// # Arguments
    /// * `token_id` - The game token ID
    ///
    /// # Returns
    /// * `bool` - true if game is over, false otherwise
    fn game_over(self: @T, token_id: u64) -> bool;
}
