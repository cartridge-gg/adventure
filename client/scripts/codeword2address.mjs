#!/usr/bin/env node
/**
 * Compute solution address from codeword
 *
 * This script derives the Starknet public key (solution address) from a puzzle codeword.
 * Used during deployment to set the correct solution_address for puzzle levels.
 *
 * Usage: node codeword2address.mjs "CODEWORD"
 */

import { ec, hash, num } from 'starknet';

function privateKeyFromSolution(solution) {
  const normalized = solution.trim().toLowerCase();

  // Use TextEncoder for UTF-8 encoding
  const encoder = new TextEncoder();
  const solutionBytes = encoder.encode(normalized);

  // Convert bytes to felt array
  const feltArray = [];
  for (let i = 0; i < solutionBytes.length; i++) {
    feltArray.push(solutionBytes[i].toString());
  }

  // Compute Poseidon hash of solution bytes
  const privateKeyBigInt = hash.computePoseidonHashOnElements(feltArray);

  return num.toHex(privateKeyBigInt);
}

function addressFromSolution(solution) {
  const privateKey = privateKeyFromSolution(solution);
  const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);

  // The public key is the solution address
  return num.toHex(starkKeyPub);
}

// Main execution
const codeword = process.argv[2];

if (!codeword) {
  console.error('Usage: node codeword2address.mjs "CODEWORD"');
  process.exit(1);
}

try {
  const solutionAddress = addressFromSolution(codeword);
  console.log(solutionAddress);
} catch (error) {
  console.error('Error computing solution address:', error.message);
  process.exit(1);
}
