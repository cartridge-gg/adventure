/**
 * Puzzle Signing Utilities for FOCG Adventure (Starknet)
 *
 * Adapted from THC (Treasure Hunt Creator) framework for Starknet.
 * Implements cryptographic replay protection for puzzle codeword verification.
 *
 * Core mechanism:
 * 1. Codeword -> Starknet private key (via hash)
 * 2. Sign player's address with codeword-derived key
 * 3. Contract verifies signature matches expected solution address
 *
 * This prevents players from copying solutions by observing transactions.
 */

import { ec, hash, num } from 'starknet';

/**
 * Derives a Starknet private key from a codeword solution
 * (Internal function - not exported)
 *
 * @param solution - The plaintext codeword (will be normalized: trimmed and lowercased)
 * @returns Private key as a hex string
 */
function privateKeyFromSolution(solution: string): string {
  const normalized = solution.trim().toLowerCase();

  // Use TextEncoder for browser compatibility (instead of Buffer)
  const encoder = new TextEncoder();
  const solutionBytes = encoder.encode(normalized);

  // Use Poseidon hash (Starknet native) to derive private key from solution
  // We hash the byte array as felts
  const feltArray = [];
  for (let i = 0; i < solutionBytes.length; i++) {
    feltArray.push(solutionBytes[i].toString());
  }

  // Compute Poseidon hash of solution bytes
  const privateKeyBigInt = hash.computePoseidonHashOnElements(feltArray);

  return num.toHex(privateKeyBigInt);
}

/**
 * Derives a Starknet address from a codeword solution
 *
 * @param solution - The plaintext codeword
 * @returns Starknet address (0x-prefixed hex string)
 */
export function addressFromSolution(solution: string): string {
  const privateKey = privateKeyFromSolution(solution);
  const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);

  // For a simple account, the address is derived from the public key
  // In production, this should match the actual account deployment
  // For this use case, we're using the public key as the "solution address"
  return num.toHex(starkKeyPub);
}

/**
 * Creates a typed data hash of the player's address (SNIP-12 compatible)
 *
 * @param playerAddress - The player's Starknet address
 * @returns Message hash ready for signing
 */
function createMessageHash(playerAddress: string): string {
  // Simple message hash: hash of the player's address
  // In a more complex system, you might use full SNIP-12 typed data
  const addressFelt = num.toBigInt(playerAddress);
  const messageHash = hash.computePoseidonHashOnElements([addressFelt]);
  return num.toHex(messageHash);
}

/**
 * Generates a signature for puzzle completion using the solution-derived key
 *
 * @param solution - The plaintext codeword
 * @param playerAddress - The player's Starknet address (who is submitting the solution)
 * @returns Signature components [r, s] as hex strings
 */
export function signatureFromSolution(
  solution: string,
  playerAddress: string
): { r: string; s: string } {
  const privateKey = privateKeyFromSolution(solution);
  const messageHash = createMessageHash(playerAddress);

  // Sign the message hash with the solution-derived private key
  const signature = ec.starkCurve.sign(messageHash, privateKey);

  return {
    r: num.toHex(signature.r),
    s: num.toHex(signature.s),
  };
}

/**
 * Formats signature for contract call
 *
 * @param signature - Signature components {r, s}
 * @returns Array of felts suitable for Span<felt252> parameter
 */
export function formatSignatureForContract(signature: { r: string; s: string }): string[] {
  return [signature.r, signature.s];
}

