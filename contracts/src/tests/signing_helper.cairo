// Test utilities for puzzle signature generation and verification
// Mirrors the TypeScript implementation in utils/puzzleSigning.ts
//
// This module provides test-only functions for generating valid puzzle signatures
// that can be verified by the contract's verify_puzzle_signature function.

use starknet::ContractAddress;
use core::poseidon::poseidon_hash_span;
use core::ecdsa::check_ecdsa_signature;
use core::traits::Into;

/// Derives a private key from a codeword solution
/// Mirrors: privateKeyFromSolution() in TypeScript
///
/// Note: This is a simplified version for testing. The production TypeScript
/// implementation should use the same hash function for consistency.
pub fn private_key_from_solution(solution: ByteArray) -> felt252 {
    // Convert solution to lowercase and trim (simplified in Cairo)
    // In real implementation, this should match the TypeScript normalization exactly

    // Hash the solution bytes using Poseidon
    // We'll convert the ByteArray to felt252s for hashing
    let mut felts = array![];

    // Simple conversion: treat the entire solution as a single felt
    // This is a simplification - production should match TS implementation exactly
    let solution_felt: felt252 = solution.into();
    felts.append(solution_felt);

    poseidon_hash_span(felts.span())
}

/// Derives a public key (address) from a codeword solution
/// Mirrors: addressFromSolution() in TypeScript
///
/// Note: In production, this should use ec.starkCurve.getStarkKey()
/// For testing, we'll use a simplified approach
pub fn address_from_solution(solution: ByteArray) -> felt252 {
    let private_key = private_key_from_solution(solution);

    // In real implementation, derive public key from private key using elliptic curve
    // For testing purposes, we'll use a hash as a placeholder
    // This means tests will need to use matching logic
    let mut data = array![private_key];
    poseidon_hash_span(data.span())
}

/// Creates a message hash from a player's address
/// This is what the player signs with the solution-derived key
pub fn create_message_hash(player_address: ContractAddress) -> felt252 {
    let mut message_data = array![player_address.into()];
    poseidon_hash_span(message_data.span())
}

/// Generate a test signature for puzzle completion
///
/// IMPORTANT: This is a TEST HELPER ONLY
/// In production, signatures are generated client-side using the TypeScript utilities
///
/// Returns: (r, s) signature components as felt252
///
/// Note: This is a mock implementation for testing. Real signatures require:
/// 1. Proper ECDSA key derivation from private key
/// 2. Proper ECDSA signing of message hash
/// 3. Matching the exact algorithm in TypeScript utils
pub fn generate_test_signature(
    solution: ByteArray,
    player_address: ContractAddress
) -> (felt252, felt252) {
    let private_key = private_key_from_solution(solution);
    let message_hash = create_message_hash(player_address);

    // Mock signature generation
    // In real implementation, use: ecdsa::sign(message_hash, private_key)
    // For testing, we'll create deterministic "signatures"
    let mut r_data = array![message_hash, private_key];
    let r = poseidon_hash_span(r_data.span());

    let mut s_data = array![private_key, message_hash];
    let s = poseidon_hash_span(s_data.span());

    (r, s)
}

// ============================================================================
// Test-only verification function (mirrors contract logic)
// ============================================================================

/// Verify a puzzle signature (test helper)
/// This mirrors the contract's verify_puzzle_signature logic for testing
pub fn verify_test_signature(
    player_address: ContractAddress,
    signature_r: felt252,
    signature_s: felt252,
    solution_address: felt252
) -> bool {
    let message_hash = create_message_hash(player_address);

    // Note: check_ecdsa_signature expects a public key, not an address
    // In real implementation, solution_address should be the public key
    // For testing, we'll use a simplified mock verification

    // Mock verification: check if signature components are correct
    let mut r_data = array![message_hash, solution_address];
    let expected_r = poseidon_hash_span(r_data.span());

    let mut s_data = array![solution_address, message_hash];
    let expected_s = poseidon_hash_span(s_data.span());

    signature_r == expected_r && signature_s == expected_s
}

// ============================================================================
// Test Constants and Examples
// ============================================================================

// Test codewords from spec/puzzles.json
pub fn test_codeword_level_2() -> ByteArray {
    "DEVCONNECT"
}

pub fn test_codeword_level_4() -> ByteArray {
    "STARKNET"
}

pub fn test_codeword_level_6() -> ByteArray {
    "CARTRIDGE"
}

// ============================================================================
// Usage Example in Tests
// ============================================================================

// Example test usage:
//
// // Setup: Configure puzzle level with solution address
// let solution = "DEVCONNECT";
// let solution_address = address_from_solution(solution);
// actions.set_puzzle(2, solution_address.try_into().unwrap());
//
// // Player attempts to complete puzzle
// let player_addr = player();
// let (r, s) = generate_test_signature(solution, player_addr);
// let signature = array![r, s].span();
// actions.complete_puzzle_level(token_id, 2, signature);
//
// // Verify completion
// let progress = actions.get_progress(token_id);
// assert((progress & (1 << 2)) != 0, 'Level not complete');
