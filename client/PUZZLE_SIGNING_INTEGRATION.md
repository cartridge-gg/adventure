# Puzzle Signing Integration

This document describes how puzzle signing is integrated into the FOCG Adventure client application.

## Overview

The client now uses cryptographic signatures to verify puzzle solutions, implementing replay protection to prevent players from copying solutions from on-chain transactions.

## Architecture

### 1. Signing Utilities (`src/signing/puzzleSigning.ts`)

Core cryptographic functions:
- `privateKeyFromSolution(solution)` - Derives private key from codeword
- `addressFromSolution(solution)` - Derives solution address (public key)
- `signatureFromSolution(solution, playerAddress)` - Generates signature
- `verifySignature(signature, playerAddress, solutionAddress)` - Verifies signature (testing only)
- `formatSignatureForContract(signature)` - Formats signature for contract call

### 2. React Hook (`src/hooks/usePuzzleSigning.ts`)

Provides React integration:
```typescript
const { generateSignature, getSolutionAddress, playerAddress } = usePuzzleSigning();
```

**Functions:**
- `generateSignature(codeword)` - Generates signature for current player
- `getSolutionAddress(codeword)` - Gets solution address for codeword
- `playerAddress` - Current connected wallet address

### 3. Contract Calls (`src/lib/contractCalls.ts`)

Real contract interaction functions:
- `completePuzzleLevel(account, mapId, levelNumber, signature)` - Submits puzzle completion to contract

### 4. Mock System (`src/lib/mock.ts`)

Development/testing utilities:
- `mockCompletePuzzleLevel()` - Mocks contract call for development
- `completePuzzleLevelWrapper()` - Switches between mock/real based on `USE_MOCK_MODE`

### 5. UI Component (`src/components/IRLQuestLevel.tsx`)

Updated to use signing:
1. Player enters codeword
2. `generateSignature()` creates cryptographic signature
3. Signature submitted to contract (or mock)
4. Contract verifies signature matches expected solution address

## How It Works

### Client-Side Flow

1. **Player enters codeword**
   ```typescript
   const codeword = "DEVCONNECT";
   ```

2. **Generate signature**
   ```typescript
   const signature = generateSignature(codeword);
   // Returns: ["0x...", "0x..."] (r, s components)
   ```

3. **Submit to contract**
   ```typescript
   await completePuzzleLevel(account, tokenId, levelNumber, signature);
   ```

### Security Properties

**Replay Protection:**
- Each signature signs `hash(player_address)`
- Alice's signature for her address cannot be used by Bob
- Each player must know the codeword to generate a valid signature

**Privacy:**
- Codeword never appears on-chain
- Only the derived solution address is stored in contract
- Signatures are unique per player

## Development vs Production

### Mock Mode (Development)

Set `USE_MOCK_MODE = true` in `src/lib/mock.ts`:
- Uses `mockCompletePuzzleLevel()` for testing
- No real contract calls
- Instant feedback
- Good for UI development

### Real Mode (Production)

Set `USE_MOCK_MODE = false`:
- Uses real contract calls via `completePuzzleLevel()`
- Requires configured contract addresses
- Waits for transaction confirmation
- Real gas costs

## Configuration

### Environment Variables

Create `.env` file in client directory:

```env
# Contract addresses
VITE_ACTIONS_CONTRACT_ADDRESS=0x...

# Network configuration
VITE_CHAIN=dev  # or sepolia, mainnet
```

### Contract Deployment

Before using real contract calls:

1. Deploy contracts (from `contracts/` directory):
   ```bash
   sozo build
   sozo migrate
   ```

2. Set puzzle solution addresses:
   ```bash
   # Generate addresses from codewords
   cd ../utils
   ts-node generate_solution_addresses.ts

   # Set addresses in contract
   sozo execute focg_adventure-actions set_puzzle 2 0x...
   sozo execute focg_adventure-actions set_puzzle 4 0x...
   sozo execute focg_adventure-actions set_puzzle 6 0x...
   ```

3. Update `.env` with contract addresses

4. Set `USE_MOCK_MODE = false` in `src/lib/mock.ts`

## Testing

### Unit Tests

Test signing utilities:
```bash
cd src/signing
ts-node puzzleSigning.test.ts
```

### Integration Testing

1. **Mock Mode Testing:**
   - Set `USE_MOCK_MODE = true`
   - Run `npm run dev`
   - Enter any codeword (signature generated but not verified)

2. **Real Contract Testing:**
   - Deploy contracts to Katana
   - Configure `.env`
   - Set `USE_MOCK_MODE = false`
   - Test with real codewords

### Verification

Check browser console for:
```
[Puzzle] Generated signature: { codeword: "DEV***", signature: [...], playerAddress: "0x..." }
[MOCK] Complete puzzle level with signature: { ... }
```

Or with real contracts:
```
[Contract] Complete puzzle level: { ... }
[Contract] Transaction sent: 0x...
[Contract] Transaction confirmed: 0x...
```

## Example Usage

### In a Component

```typescript
import { usePuzzleSigning } from '../hooks/usePuzzleSigning';

function MyComponent() {
  const { generateSignature, playerAddress } = usePuzzleSigning();

  const handleSubmit = async (codeword: string) => {
    if (!playerAddress) {
      alert('Connect wallet first');
      return;
    }

    const signature = generateSignature(codeword);
    if (!signature) {
      alert('Failed to generate signature');
      return;
    }

    // Submit to contract...
    const result = await completePuzzleLevel(
      account,
      tokenId,
      levelNumber,
      signature
    );

    if (result.success) {
      console.log('Level completed!', result.txHash);
    } else {
      console.error('Failed:', result.error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(e.currentTarget.codeword.value);
    }}>
      <input name="codeword" placeholder="Enter codeword" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Troubleshooting

### "Failed to generate signature"
- Ensure wallet is connected
- Check browser console for errors
- Verify `starknet` package is installed

### "Invalid solution signature"
- Wrong codeword entered
- Contract has different solution address
- Regenerate and re-deploy solution addresses

### "Contract address not configured"
- Set `VITE_ACTIONS_CONTRACT_ADDRESS` in `.env`
- Restart development server after changing `.env`

### Signature validation fails in contract
- Check that TypeScript and Cairo use same hash algorithm (Poseidon)
- Verify message format matches: `hash(player_address)`
- Ensure solution address deployed matches codeword derivation

## Security Considerations

### Client-Side
- Never log full codewords in production
- Validate wallet connection before signing
- Handle signature generation errors gracefully

### Contract-Side
- Signature verification happens on-chain
- Solution addresses are public (derived from private codewords)
- Each player must generate their own signature

### Deployment
- Keep codewords private until game starts
- Use secure channel to distribute codewords to players
- Store only solution addresses in contract, never plaintext codewords

## Future Enhancements

1. **Batch Signatures:** Allow completing multiple levels in one transaction
2. **Time-locks:** Add time-based unlocking for progressive reveal
3. **Hints System:** Cryptographic hints that reveal partial solution info
4. **Leaderboard:** Track completion times on-chain

## References

- Signing utilities: `src/signing/puzzleSigning.ts`
- React hook: `src/hooks/usePuzzleSigning.ts`
- Contract calls: `src/lib/contractCalls.ts`
- UI component: `src/components/IRLQuestLevel.tsx`
- Contract implementation: `../../contracts/src/systems/actions.cairo`
- THC reference: `../../refs/thc/lib/src/thc.ts`
