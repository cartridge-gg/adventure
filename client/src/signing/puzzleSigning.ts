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

import { ec, hash, CallData, num, Account, RpcProvider, constants } from 'starknet';

/**
 * Derives a Starknet private key from a codeword solution
 *
 * @param solution - The plaintext codeword (will be normalized: trimmed and lowercased)
 * @returns Private key as a hex string
 */
export function privateKeyFromSolution(solution: string): string {
  const normalized = solution.trim().toLowerCase();
  const solutionBytes = Buffer.from(normalized, 'utf-8');

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
 * Verifies a signature (for testing purposes)
 *
 * @param signature - The signature components [r, s]
 * @param playerAddress - The player's address that was signed
 * @param solutionAddress - The expected solution address
 * @returns True if signature is valid
 */
export function verifySignature(
  signature: { r: string; s: string },
  playerAddress: string,
  solutionAddress: string
): boolean {
  const messageHash = createMessageHash(playerAddress);

  // The solution address should be the public key that signed the message
  return ec.starkCurve.verify(
    signature,
    messageHash,
    solutionAddress
  );
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

/**
 * Example usage and testing utility
 */
export function testPuzzleSigning() {
  const codeword = "Testing Hard Cases";
  const playerAddress = "0x197970E48082CD46f277ABDb8afe492bCCd78300";

  console.log("\n=== Puzzle Signing Test ===\n");

  // Step 1: Derive solution address from codeword
  const solutionAddress = addressFromSolution(codeword);
  console.log(`Codeword: "${codeword}"`);
  console.log(`Solution Address: ${solutionAddress}`);

  // Step 2: Player signs their address with solution-derived key
  const signature = signatureFromSolution(codeword, playerAddress);
  console.log(`\nPlayer Address: ${playerAddress}`);
  console.log(`Signature r: ${signature.r}`);
  console.log(`Signature s: ${signature.s}`);

  // Step 3: Verify signature
  const isValid = verifySignature(signature, playerAddress, solutionAddress);
  console.log(`\nSignature Valid: ${isValid}`);

  // Step 4: Show contract call format
  const contractParams = formatSignatureForContract(signature);
  console.log(`\nContract Call Format: [${contractParams.join(', ')}]`);

  console.log("\n=== Test Complete ===\n");
}

// Export all functions
export default {
  privateKeyFromSolution,
  addressFromSolution,
  signatureFromSolution,
  verifySignature,
  formatSignatureForContract,
  testPuzzleSigning,
};
