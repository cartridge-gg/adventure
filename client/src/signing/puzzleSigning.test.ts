/**
 * Test suite for puzzle signing utilities
 *
 * Run with: ts-node puzzleSigning.test.ts
 */

import {
  addressFromSolution,
  signatureFromSolution,
  formatSignatureForContract,
} from './puzzleSigning';
import { ec, hash, num } from 'starknet';

/**
 * Helper: Creates a typed data hash of the player's address
 * (Duplicated from puzzleSigning.ts for test isolation)
 */
function createMessageHash(playerAddress: string): string {
  const addressFelt = num.toBigInt(playerAddress);
  const messageHash = hash.computePoseidonHashOnElements([addressFelt]);
  return num.toHex(messageHash);
}

/**
 * Test utility: Verifies a signature
 */
function verifySignature(
  signature: { r: string; s: string },
  playerAddress: string,
  solutionAddress: string
): boolean {
  const messageHash = createMessageHash(playerAddress);
  const sigArray = [signature.r, signature.s];
  return ec.starkCurve.verify(
    sigArray as any,
    messageHash,
    solutionAddress
  );
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testAddressDerivation() {
  console.log("\n=== Test: Address Derivation ===");

  // Test that same solution always produces same address
  const solution1 = "Testing Hard Cases";
  const addr1 = addressFromSolution(solution1);
  const addr2 = addressFromSolution(solution1);

  assert(addr1 === addr2, "Same solution should produce same address");
  console.log(`✓ Deterministic address: ${addr1}`);

  // Test normalization (trimming and lowercase)
  const solution2 = "  TESTING HARD CASES  ";
  const addr3 = addressFromSolution(solution2);

  assert(addr1 === addr3, "Normalized solutions should produce same address");
  console.log("✓ Solution normalization works correctly");

  // Test that different solutions produce different addresses
  const solution3 = "Different Solution";
  const addr4 = addressFromSolution(solution3);

  assert(addr1 !== addr4, "Different solutions should produce different addresses");
  console.log("✓ Different solutions produce different addresses");
}

function testSignatureGeneration() {
  console.log("\n=== Test: Signature Generation ===");

  const solution = "Testing Hard Cases";
  const playerAddress = "0x197970E48082CD46f277ABDb8afe492bCCd78300";

  const sig = signatureFromSolution(solution, playerAddress);

  assert(!!sig.r && sig.r.startsWith('0x'), "Signature r component should be hex");
  assert(!!sig.s && sig.s.startsWith('0x'), "Signature s component should be hex");
  console.log(`✓ Generated signature: r=${sig.r.slice(0, 10)}..., s=${sig.s.slice(0, 10)}...`);

  // Test that same inputs produce same signature
  const sig2 = signatureFromSolution(solution, playerAddress);
  assert(sig.r === sig2.r && sig.s === sig2.s, "Same inputs should produce same signature");
  console.log("✓ Signature generation is deterministic");

  // Test that different player addresses produce different signatures
  const playerAddress2 = "0x0000000000000000000000000000000000000001";
  const sig3 = signatureFromSolution(solution, playerAddress2);
  assert(sig.r !== sig3.r || sig.s !== sig3.s, "Different player addresses should produce different signatures");
  console.log("✓ Different player addresses produce different signatures");
}

function testSignatureVerification() {
  console.log("\n=== Test: Signature Verification ===");

  const solution = "Testing Hard Cases";
  const playerAddress = "0x197970E48082CD46f277ABDb8afe492bCCd78300";
  const solutionAddress = addressFromSolution(solution);

  const sig = signatureFromSolution(solution, playerAddress);

  // Test valid signature
  const isValid = verifySignature(sig, playerAddress, solutionAddress);
  assert(isValid, "Valid signature should verify correctly");
  console.log("✓ Valid signature verifies successfully");

  // Test invalid signature (wrong player address)
  const wrongPlayerAddress = "0x0000000000000000000000000000000000000001";
  const isInvalid = verifySignature(sig, wrongPlayerAddress, solutionAddress);
  assert(!isInvalid, "Signature with wrong player address should fail verification");
  console.log("✓ Invalid signature (wrong player) fails verification");

  // Test wrong solution address
  const wrongSolution = "Wrong Solution";
  const wrongSolutionAddress = addressFromSolution(wrongSolution);
  const isInvalid2 = verifySignature(sig, playerAddress, wrongSolutionAddress);
  assert(!isInvalid2, "Signature with wrong solution address should fail verification");
  console.log("✓ Invalid signature (wrong solution) fails verification");
}

function testReplayProtection() {
  console.log("\n=== Test: Replay Protection ===");

  const solution = "DevConnect2025";

  // Alice completes the puzzle
  const aliceAddress = "0x1111111111111111111111111111111111111111";
  const aliceSignature = signatureFromSolution(solution, aliceAddress);
  const solutionAddress = addressFromSolution(solution);

  // Alice's signature should be valid for Alice
  const aliceValid = verifySignature(aliceSignature, aliceAddress, solutionAddress);
  assert(aliceValid, "Alice's signature should be valid for Alice");
  console.log("✓ Alice's signature is valid for Alice's address");

  // Bob tries to use Alice's signature (replay attack)
  const bobAddress = "0x2222222222222222222222222222222222222222";
  const replayAttempt = verifySignature(aliceSignature, bobAddress, solutionAddress);
  assert(!replayAttempt, "Alice's signature should NOT be valid for Bob's address");
  console.log("✓ Replay attack prevented: Alice's signature doesn't work for Bob");

  // Bob must solve the puzzle himself
  const bobSignature = signatureFromSolution(solution, bobAddress);
  const bobValid = verifySignature(bobSignature, bobAddress, solutionAddress);
  assert(bobValid, "Bob's signature should be valid for Bob");
  console.log("✓ Bob can complete the puzzle with his own signature");
}

function testContractFormatting() {
  console.log("\n=== Test: Contract Format ===");

  const solution = "Testing Hard Cases";
  const playerAddress = "0x197970E48082CD46f277ABDb8afe492bCCd78300";

  const sig = signatureFromSolution(solution, playerAddress);
  const formatted = formatSignatureForContract(sig);

  assert(Array.isArray(formatted), "Contract format should be an array");
  assert(formatted.length === 2, "Contract format should have 2 elements [r, s]");
  assert(formatted[0] === sig.r, "First element should be r");
  assert(formatted[1] === sig.s, "Second element should be s");
  console.log(`✓ Contract format correct: [${formatted[0].slice(0, 10)}..., ${formatted[1].slice(0, 10)}...]`);
}

function testSpecExamples() {
  console.log("\n=== Test: Spec Examples ===");

  // Example from spec puzzles.json
  const specCodewords = [
    "DEVCONNECT",
    "STARKNET",
    "CARTRIDGE"
  ];

  for (const codeword of specCodewords) {
    const solutionAddr = addressFromSolution(codeword);
    console.log(`Codeword "${codeword}" -> Address: ${solutionAddr}`);

    // Simulate a player solving this puzzle
    const playerAddr = "0x123456789abcdef123456789abcdef123456789a";
    const sig = signatureFromSolution(codeword, playerAddr);
    const valid = verifySignature(sig, playerAddr, solutionAddr);

    assert(valid, `Signature for "${codeword}" should verify`);
  }

  console.log("✓ All spec example codewords work correctly");
}

// Run all tests
function runAllTests() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   FOCG Adventure Puzzle Signing Tests        ║");
  console.log("╚════════════════════════════════════════════════╝");

  try {
    testAddressDerivation();
    testSignatureGeneration();
    testSignatureVerification();
    testReplayProtection();
    testContractFormatting();
    testSpecExamples();

    console.log("\n✅ All tests passed!\n");
    return true;
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    return false;
  }
}

// Run tests if this file is executed directly
// Note: This is disabled for browser environments
// if (require.main === module) {
//   const success = runAllTests();
//   process.exit(success ? 0 : 1);
// }

export { runAllTests };
