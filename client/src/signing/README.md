# Adventure Puzzle Signing Utilities

TypeScript utilities for cryptographic replay protection in puzzle completion.

Adapted from the [Treasure Hunt Creator (THC)](https://github.com/social-dist0rtion-protocol/thc) framework for Starknet.

## Overview

This module implements a cryptographic mechanism that allows players to prove they know a secret codeword without revealing it on-chain, while preventing replay attacks (copying solutions from other players' transactions).

## How It Works

### Core Mechanism

1. **Codeword → Private Key**: A plaintext codeword (e.g., "DEVCONNECT") is hashed using Poseidon to derive a Starknet private key
2. **Private Key → Public Key/Address**: The derived private key generates a deterministic Starknet address (the "solution address")
3. **Player Signs Their Address**: The player signs their own wallet address using the codeword-derived private key
4. **Contract Verifies**: The smart contract verifies the signature matches the expected solution address

### Replay Protection

This prevents replay attacks because:
- Alice solves the puzzle and signs `hash(0xAlice)` with the codeword-derived key
- Bob sees Alice's transaction but cannot use her signature
- Bob's address is `0xBob`, so Alice's signature on `hash(0xAlice)` won't verify for `hash(0xBob)`
- Bob must independently discover the codeword to generate his own valid signature

## Usage

### Installation

```bash
cd utils
npm install
```

### Basic Usage

```typescript
import { addressFromSolution, signatureFromSolution } from './puzzleSigning';

// Step 1: Derive the solution address from codeword (do this once during setup)
const codeword = "DEVCONNECT";
const solutionAddress = addressFromSolution(codeword);
console.log(`Store this in contract config: ${solutionAddress}`);

// Step 2: Player submits codeword (client-side)
const playerAddress = "0x1234..."; // Player's wallet address
const signature = signatureFromSolution(codeword, playerAddress);

// Step 3: Call contract with signature
await contract.complete_puzzle_level(
  mapId,
  levelNumber,
  [signature.r, signature.s]
);
```

### Testing

```bash
npm test
# or
ts-node puzzleSigning.test.ts
```

## API Reference

### `addressFromSolution(solution: string): string`

Derives a deterministic Starknet address from a codeword.

- **Parameters:**
  - `solution`: The plaintext codeword (will be normalized: trimmed and lowercased)
- **Returns:** Starknet address (0x-prefixed hex string)
- **Use case:** Generate the "solution address" to store in contract configuration

**Example:**
```typescript
const addr = addressFromSolution("DEVCONNECT");
// addr: "0x..."
```

### `signatureFromSolution(solution: string, playerAddress: string): { r: string, s: string }`

Generates a signature proving the player knows the codeword.

- **Parameters:**
  - `solution`: The plaintext codeword
  - `playerAddress`: The player's Starknet wallet address
- **Returns:** Signature components `{r, s}` as hex strings
- **Use case:** Generate signature for contract submission

**Example:**
```typescript
const sig = signatureFromSolution("DEVCONNECT", "0x123...");
// sig: { r: "0x...", s: "0x..." }
```

### `verifySignature(signature: {r: string, s: string}, playerAddress: string, solutionAddress: string): boolean`

Verifies a signature (for testing/debugging purposes).

- **Parameters:**
  - `signature`: Signature components `{r, s}`
  - `playerAddress`: The player's address that was signed
  - `solutionAddress`: The expected solution address
- **Returns:** `true` if signature is valid
- **Use case:** Client-side validation before submitting to contract

**Example:**
```typescript
const isValid = verifySignature(sig, playerAddress, solutionAddress);
// isValid: true
```

### `formatSignatureForContract(signature: {r: string, s: string}): string[]`

Formats signature for Cairo contract call.

- **Parameters:**
  - `signature`: Signature components `{r, s}`
- **Returns:** Array `[r, s]` suitable for `Span<felt252>` parameter
- **Use case:** Prepare signature for contract call

**Example:**
```typescript
const params = formatSignatureForContract(sig);
// params: ["0x...", "0x..."]
```

## Contract Integration

The Cairo contract should implement signature verification as follows:

```cairo
fn complete_puzzle_level(
    ref self: ContractState,
    map_id: u256,
    level_number: u8,
    signature: Span<felt252>
) {
    let caller = get_caller_address();
    let level_config: LevelConfig = world.read_model(level_number);

    // Extract signature components
    assert(signature.len() == 2, 'Invalid signature format');
    let r = *signature.at(0);
    let s = *signature.at(1);

    // Reconstruct message hash (player's address)
    let message_hash = poseidon::poseidon_hash_single(caller.into());

    // Verify signature using Starknet signature verification
    let is_valid = check_ecdsa_signature(
        message_hash,
        level_config.solution_address.into(),
        r,
        s
    );

    assert(is_valid, 'Invalid solution');

    // Mark level complete...
}
```

## Security Properties

- **Solution Confidentiality**: Codeword never appears on-chain (only derived address)
- **Non-Transferability**: Signatures are bound to specific player addresses
- **Unlimited Attempts**: Players can retry without penalty (failed attempts don't reveal solution)
- **Transparent to Users**: Signature generation happens automatically in frontend
- **Standard Cryptography**: Uses Starknet's native ECDSA signature scheme

## Deployment Workflow

1. **Choose Codeword**: Select a secret codeword for each puzzle level (e.g., "DEVCONNECT")
2. **Derive Solution Address**: Run `addressFromSolution(codeword)` to get the address
3. **Store in Contract**: Call `set_puzzle(level_number, solution_address)` during deployment
4. **Never Store Codeword On-Chain**: Keep codewords secret, only store derived addresses
5. **Distribute Codewords**: Provide codewords to players via physical locations, QR codes, etc.

## Example: Full Flow

### Setup (Deployment)
```typescript
// Admin generates solution addresses for puzzles.json
const puzzles = [
  { level: 2, codeword: "DEVCONNECT", location: "Community Hub A" },
  { level: 4, codeword: "STARKNET", location: "Community Hub B" },
  { level: 6, codeword: "CARTRIDGE", location: "Community Hub C" },
];

puzzles.forEach(puzzle => {
  const solutionAddr = addressFromSolution(puzzle.codeword);
  console.log(`Level ${puzzle.level}: ${solutionAddr}`);
  // Store this address in contract: set_puzzle(puzzle.level, solutionAddr)
});
```

### Player Interaction (Frontend)
```typescript
// Player discovers codeword at physical location
const userCodeword = prompt("Enter the codeword:");

// Generate signature
const playerAddr = await getConnectedWalletAddress();
const sig = signatureFromSolution(userCodeword, playerAddr);

// Submit to contract
try {
  await contract.complete_puzzle_level(
    playerTokenId,
    currentLevel,
    [sig.r, sig.s]
  );
  console.log("Puzzle completed!");
} catch (error) {
  console.error("Incorrect codeword, try again");
}
```

## Testing

Run the test suite to verify all cryptographic operations:

```bash
ts-node puzzleSigning.test.ts
```

Tests cover:
- Deterministic address derivation
- Solution normalization (trimming/lowercase)
- Signature generation
- Signature verification
- Replay attack prevention
- Contract formatting

## References

- [Treasure Hunt Creator (THC)](https://github.com/social-dist0rtion-protocol/thc)
- [THC Blog Post](https://www.dist0rtion.com/2020/01/30/Planetscape-a-dystopian-escape-game-for-36C3/)
- [Starknet Signature Standards](https://docs.starknet.io/)
- [Adventure Spec](../spec/SPEC.md)
