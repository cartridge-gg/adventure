# The Ronin's Pact - Smart Contracts

A Dojo-based quest system on Starknet featuring a dynamic NFT that evolves as players complete three trials.

## Overview

The Ronin's Pact is a gamified quest where players forge their commitment to the Ronin by completing three trials:
- **Waza** (Technique) - Prove mastery by owning NFTs from approved game collections
- **Chi** (Wisdom) - Demonstrate knowledge by passing a quiz (3+ correct answers required)
- **Shin** (Spirit) - Show dedication through Controller integration (TODO)

Each completed trial adds a colored slash to the NFT's visual representation. When all three trials are complete, the NFT displays a golden glow effect with "FORGED" text.

## Architecture

This project uses a **separation of concerns** architecture:

### RoninPact NFT (`src/tokens/pact.cairo`)
**Type**: Standard ERC721 contract

**Purpose**: Store player progress and generate dynamic SVG artwork

**Key Responsibilities**:
- ERC721 token management (mint, transfer, metadata)
- Store trial progress using bit flags (3 bits for 3 trials)
- Generate dynamic on-chain SVG artwork based on progress
- Emit events for each trial completion
- Enforce minter authorization (only actions contract can update progress)

**Progress Storage**:
```cairo
// Efficient bit-flag storage
const WAZA_BIT: u8 = 0x04; // 0b100
const CHI_BIT: u8 = 0x02;  // 0b010
const SHIN_BIT: u8 = 0x01; // 0b001
```

**Key Functions**:
- `mint()` - Public minting (anyone can mint)
- `get_progress(token_id)` - Query trial progress
- `complete_waza/chi/shin(token_id)` - Record completion (minter only)
- `set_minter(address)` - Set authorized minter contract (owner only)
- `token_uri(token_id)` - Returns dynamic SVG data URI

### Actions Contract (`src/systems/actions.cairo`)
**Type**: Dojo contract

**Purpose**: Validate trial completion and manage game configuration

**Key Responsibilities**:
- Validate Waza trial (check NFT ownership in approved collections)
- Validate Chi trial (verify quiz answers)
- Validate Shin trial (TODO: Controller signer verification)
- Store game configuration using Dojo models
- Coordinate with NFT contract to record completions

**Trial Validation**:

**Waza (Technique)**:
1. Reads allowlisted game collections from Dojo models
2. Iterates through collections checking ERC721 balance
3. Requires balance ≥ 1 across all collections
4. Calls `nft.complete_waza(token_id)` to record

**Chi (Wisdom)**:
1. Verifies question and answer arrays match in length
2. Reads answer hashes from Dojo models
3. Validates submitted answers against stored hashes
4. Requires 3+ correct answers
5. Calls `nft.complete_chi(token_id)` to record

**Shin (Spirit)**:
1. TODO: Integrate with Controller to verify signer GUID
2. Currently placeholder (always validates)
3. Calls `nft.complete_shin(token_id)` to record

**Admin Functions**:
- `set_owner(owner)` - Update contract owner
- `set_pact(pact)` - Set NFT contract address
- `set_games(games)` - Set allowlisted game collections
- `set_quiz(answers)` - Set quiz answer hashes

### Dojo Models (`src/models.cairo`)

Configuration stored using Dojo's ECS pattern (all use singleton `game_id: 0`):

```cairo
// Contract owner
struct RoninOwner {
    game_id: u32,        // Always 0
    owner: ContractAddress,
}

// NFT contract address
struct RoninPact {
    game_id: u32,        // Always 0
    pact: ContractAddress,
}

// Allowlisted game collections for Waza
struct RoninGames {
    game_id: u32,        // Always 0
    games: Array<ContractAddress>,
}

// Quiz answer hashes for Chi
struct RoninAnswers {
    game_id: u32,        // Always 0
    answers: Array<felt252>,
}
```

## Data Flow

1. User calls `actions.complete_waza/chi/shin(token_id, ...)`
2. Actions contract validates trial using configuration from Dojo models
3. If valid, actions calls `pact.complete_waza/chi/shin(token_id)`
4. NFT updates progress in storage and emits events
5. Torii indexes both actions state (config) and NFT events (player progress)

## The Three Trials

### 1. Waza (Technique) - Game Ownership

**Goal**: Prove you own an NFT in an allowlisted game collection

**How It Works**:
- Admin configures array of allowlisted ERC721 collections
- Player calls `complete_waza(token_id)`
- Contract sums balance across all allowlisted collections
- Requires balance ≥ 1
- On success: Red diagonal slash appears (top-left to bottom-right)

### 2. Chi (Wisdom) - Quiz Challenge

**Goal**: Answer quiz questions correctly (3+ required)

**How It Works**:
- Admin sets quiz with array of answer hashes
- Player submits question indices and answer hashes
- Contract validates arrays match in length
- Contract compares answers against stored hashes
- Requires 3+ correct to complete
- On success: Blue diagonal slash appears (top-right to bottom-left)

**Answer Hashing**:
Use Poseidon hash for answer hashing:
```python
from starknet_py.hash.poseidon import poseidon_hash_many
answer_hash = poseidon_hash_many([int.from_bytes(answer.encode(), 'big')])
```

### 3. Shin (Spirit) - Controller Verification

**Goal**: Prove you have a Cartridge Controller signer (TODO)

**Current State**: Placeholder implementation (always validates)

**Planned Implementation**:
- Player provides Controller signer GUID
- Contract calls player's wallet to verify signer
- Uses Controller's `ISignerList.is_signer_in_list()` interface
- On success: Purple vertical slash appears (top to bottom)

**Reference**: https://github.com/cartridge-gg/controller-cairo

## Dynamic NFT Artwork

The NFT generates SVG artwork on-chain with 4 visual states:

1. **Base State**:
   - Dark gradient background
   - Gray concentric circles
   - "The Ronins Pact" text

2. **Waza Complete (+1)**:
   - Red gradient diagonal slash (top-left to bottom-right)
   - "WAZA" label with glow effect

3. **Chi Complete (+2)**:
   - Blue gradient diagonal slash (top-right to bottom-left)
   - "CHI" label with glow effect

4. **Shin Complete (+3)**:
   - Purple gradient vertical slash (top to bottom)
   - "SHIN" label

5. **All Complete (Final State)**:
   - All three slashes present
   - Golden radial glow effect
   - "FORGED" text at bottom

The artwork is generated in `token_uri()` as a data URI - no IPFS required.

## Building

```bash
# Build all contracts
sozo build

# This compiles:
# - RoninPact (ERC721 contract)
# - actions (Dojo contract)
# - Dojo models
```

## Testing

The project includes comprehensive integration tests (20 tests):

```bash
# Run all tests
snforge test

# Run with verbose output
snforge test -v

# Run specific test
snforge test test_complete_waza
```

**Test Coverage**:
- ✓ Admin function access control (4 tests)
- ✓ NFT minting (1 test)
- ✓ Waza trial (success + 2 failure cases)
- ✓ Chi trial (success + 3 failure cases)
- ✓ Shin trial (success + 1 failure case)
- ✓ Full lifecycle (all trials)

Tests use:
- Actual contract deployments
- Mock ERC721 for game collections
- Dojo test utilities for world setup

## Deployment

This project supports deployment to three environments:
- **Katana** (local development) - Automated with hot-reload
- **Sepolia** (testnet) - Automated with 1-hour time locks
- **Mainnet** (production) - Automated with 24-hour time locks and safety confirmations

### Prerequisites

Before deploying to Sepolia or Mainnet, you need:

1. **Sozo CLI** - Part of Dojo toolkit
2. **Starkli** - For account management
3. **Funded Starknet Account** - With STRK on target network
4. **jq** - For JSON parsing in scripts

### Account Setup (Sepolia/Mainnet)

Set up encrypted Starkli keystores for secure authentication:

#### Step 1: Install Starkli

```bash
curl https://get.starkli.sh | sh
starkliup
```

#### Step 2: Create Keystores

Create encrypted keystores for each network:

```bash
# For Sepolia
starkli signer keystore new ~/.starkli-wallets/deployer-sepolia.json

# For Mainnet (use a different, strong password!)
starkli signer keystore new ~/.starkli-wallets/deployer-mainnet.json
```

You'll be prompted to set a password for each keystore. **Store these passwords securely!**

#### Step 3: Initialize Account Descriptors

Create account descriptor files:

```bash
# For Sepolia
starkli account oz init \
  --keystore ~/.starkli-wallets/deployer-sepolia.json \
  ~/.starkli-wallets/deployer-sepolia-account.json

# For Mainnet
starkli account oz init \
  --keystore ~/.starkli-wallets/deployer-mainnet.json \
  ~/.starkli-wallets/deployer-mainnet-account.json
```

#### Step 4: Get Account Addresses

Extract your account addresses:

```bash
# Sepolia
cat ~/.starkli-wallets/deployer-sepolia-account.json | jq -r '.deployment.address'

# Mainnet
cat ~/.starkli-wallets/deployer-mainnet-account.json | jq -r '.deployment.address'
```

#### Step 5: Fund Your Accounts

Fund these addresses:
- **Sepolia**: Use the [Starknet Sepolia Faucet](https://starknet-faucet.vercel.app/) (~0.01 ETH)
- **Mainnet**: Bridge STRK from L1 using [Starkgate](https://starkgate.starknet.io/) (~0.1-0.5 ETH)

#### Step 6: Deploy Account Contracts

Deploy your account contracts on-chain:

```bash
# Sepolia
starkli account deploy \
  --network sepolia \
  --keystore ~/.starkli-wallets/deployer-sepolia.json \
  ~/.starkli-wallets/deployer-sepolia-account.json

# Mainnet
starkli account deploy \
  --network mainnet
  --keystore ~/.starkli-wallets/deployer-mainnet.json \
  ~/.starkli-wallets/deployer-mainnet-account.json
```

#### Step 7: Configure TOML Files

Update both the keystore path and account address in your network configuration files.

**For Sepolia**, edit `dojo_sepolia.toml`:

```toml
[env]
rpc_url = "https://api.cartridge.gg/x/starknet/sepolia"
account_address = "0x1234..." # Your account address
keystore_path = "~/.starkli-wallets/deployer-sepolia-account.json"

# ... later in the file ...

[[external_contracts]]
contract_name = "RoninPact"
instance_name = "ronin_pact"
salt = "1"
constructor_data = [
    "0x1234..."  # Same account address
]
```

**For Mainnet**, edit `dojo_mainnet.toml`:

```toml
[env]
rpc_url = "https://api.cartridge.gg/x/starknet/mainnet"
account_address = "0x5678..." # Your account address
keystore_path = "~/.starkli-wallets/deployer-mainnet-account.json"

# ... later in the file ...

[[external_contracts]]
contract_name = "RoninPact"
instance_name = "ronin_pact"
salt = "1"
constructor_data = [
    "0x5678..."  # Same account address
]
```

**Security Note**: Your private keys are encrypted in keystores, never exposed in plaintext!

### Local Development (Katana)

For local testing, use the automated deployment script:

```bash
# Starts Katana and deploys everything
scarb run deploy_katana
```

This script handles:
- Starting Katana testnet
- Building and migrating contracts
- Configuring permissions and settings
- Running continuously with hot-reload

### Network Deployment (Sepolia/Mainnet)

#### Deploying to Sepolia

Simply run the automated deployment (keystore path is configured in `dojo_sepolia.toml`):

```bash
# Deploy (you'll be prompted for your keystore password)
scarb run deploy_sepolia
```

The script will:
1. Build contracts for Sepolia
2. Migrate the world and deploy all contracts (including RoninPact NFT as external contract)
3. Extract contract addresses from the manifest
4. Update `dojo_sepolia.toml` with the world address
5. Grant owner permissions to deployer account on the `ronin_quest` namespace
6. Set the NFT minter to the actions contract
7. Configure actions contract with NFT address and 1-hour time lock
8. Whitelist game collections for Waza trial (from `spec/waza.json`)
9. Set Chi trial quiz answers (from `spec/chi.json`)
10. Mint an initial NFT from deployer account

**Time Lock**: 3600 seconds (1 hour) between trials

#### Deploying to Mainnet

Simply run the automated deployment (keystore path is configured in `dojo_mainnet.toml`):

```bash
# Deploy (requires explicit confirmation)
scarb run deploy_mainnet
```

You'll be prompted to:
1. Enter your keystore password
2. Type "yes" to confirm mainnet deployment

The script performs the same steps as Sepolia but with:
- **Time Lock**: 86400 seconds (24 hours) between trials
- **Safety confirmation**: Must type "yes" to proceed
- **Production configuration**: Uses mainnet game collections from `spec/waza.json`

#### Deployment Output

After successful deployment, you'll see:

```
=== Starknet Sepolia/Mainnet Deployment Complete ===
Network:
  Starknet Sepolia/Mainnet
  RPC: https://api.cartridge.gg/x/starknet/{network}

Deployed Contracts:
  World Address:    0x...
  RoninPact NFT:    0x...
  Actions Contract: 0x...

Configuration:
  ✓ Owner permissions granted to deployer
  ✓ NFT minter set to Actions contract
  ✓ Actions contract configured with NFT address
  ✓ Games whitelisted for Waza trial
  ✓ Chi trial quiz configured
  ✓ Initial NFT minted from deployer account
```

**Output Files**:
- `manifests/{network}/manifest.json` - Full deployment manifest with all addresses
- `dojo_{network}.toml` - Updated with world address

#### Post-Deployment Steps

After deploying, you should:

1. **Verify Contracts on Starkscan**:
   - Sepolia: `https://sepolia.starkscan.co/contract/{world_address}`
   - Mainnet: `https://starkscan.co/contract/{world_address}`

2. **Configure Client Application**:
   - Update client environment with contract addresses
   - Deploy client to Vercel with `VITE_ENV=sepolia` or `VITE_ENV=mainnet`

3. **Set Up Torii Indexer**:
   - Configure Torii to index the deployed world
   - Point to the RPC endpoint for the network

4. **Test Integration**:
   - Mint a test NFT
   - Complete each trial to verify functionality
   - Check SVG rendering and progress tracking

5. **Monitor Deployment**:
   - Watch for events on block explorer
   - Verify quiz answers are working correctly
   - Test game collection whitelisting

### Manual Step-by-Step Deployment

If you need to deploy manually:

#### Step 1: Build Contracts

```bash
sozo -P sepolia build
```

#### Step 2: Deploy World & Contracts

```bash
sozo -P sepolia migrate
```

This deploys:
- Dojo World contract
- Actions contract
- RoninPact NFT (as external contract)
- All Dojo models

#### Step 3: Configure System

```bash
# Extract addresses from manifest
MANIFEST="manifests/sepolia/manifest.json"
TOKEN_ADDRESS=$(jq -r '.contracts[] | select(.tag == "ronin_quest-ronin_pact") | .address' $MANIFEST)
ACTIONS_ADDRESS=$(jq -r '.contracts[] | select(.tag == "ronin_quest-actions") | .address' $MANIFEST)

# Set NFT minter to actions contract
sozo -P sepolia execute $TOKEN_ADDRESS set_minter $ACTIONS_ADDRESS

# Configure actions with NFT address and time lock (1 hour = 3600 seconds)
sozo -P sepolia execute ronin_quest-actions set_pact $TOKEN_ADDRESS 3600

# Whitelist game collections for Waza trial
sozo -P sepolia execute ronin_quest-actions set_game <collection_address> 1

# Set quiz answer hashes for Chi trial
sozo -P sepolia execute ronin_quest-actions set_quiz <count> <hash1> <hash2> ...
```

#### Step 4: Verify Deployment

```bash
# Check NFT minter is set correctly
sozo -P sepolia call $TOKEN_ADDRESS get_minter

# Mint test NFT
sozo -P sepolia execute ronin_quest-actions mint sstr:testuser
```

## Scripts

Scarb.toml defines helpful scripts:

```bash
# Build and migrate
scarb run migrate

# Mint an NFT (for testing)
scarb run mint
```

## Project Structure

```
contracts/
├── Scarb.toml              # Package configuration
├── README.md               # This file
├── src/
│   ├── lib.cairo           # Module declarations
│   ├── models.cairo        # Dojo models (4 singletons)
│   ├── systems/
│   │   └── actions.cairo   # Trial validation logic
│   ├── tokens/
│   │   └── pact.cairo      # Dynamic ERC721 NFT
│   └── tests/
│       ├── actions.cairo   # Integration tests (20)
│       └── mocks.cairo     # Mock ERC721 for testing
```

## Dependencies

- **Dojo** 1.7.1 - ECS framework and world management
- **Starknet** 2.12.2 - Cairo standard library
- **OpenZeppelin** v0.20.0 - ERC721 components
- **Starknet Foundry** 0.48.1 - Testing framework

## Development Guide

### Local Development with Katana

```bash
# Start local devnet
katana --disable-fee

# In another terminal: Build and deploy
sozo build
sozo migrate --name ronin_pact_dev

# Configure system
sozo execute ronin_quest-actions set_pact --calldata <nft_addr>
# ... other configuration
```

### Adding New Trials

To add a new trial (e.g., "Gi" - Honor):

1. Add bit flag to `pact.cairo`:
```cairo
const GI_BIT: u8 = 0x08; // 0b1000
```

2. Add field to `TrialProgress`:
```cairo
pub struct TrialProgress {
    pub waza_complete: bool,
    pub chi_complete: bool,
    pub shin_complete: bool,
    pub gi_complete: bool, // New
}
```

3. Add `complete_gi()` to NFT interface and implementation

4. Add validation logic to `actions.cairo`

5. Add artwork generation in `get_gi_slash()`

6. Update tests in `tests/actions.cairo`

### Updating Quiz

```bash
# Hash new answers (Python)
from starknet_py.hash.poseidon import poseidon_hash_many

answers = ["dojo", "starknet", "cairo"]
hashes = [poseidon_hash_many([int.from_bytes(a.encode(), 'big')]) for a in answers]

# Update on-chain
sozo execute ronin_quest-actions set_quiz --calldata <hash1>,<hash2>,<hash3>
```

### Updating Allowlist

```bash
# Add new game collection
sozo execute ronin_quest-actions set_games --calldata <game1>,<game2>,<new_game>
```

## Troubleshooting

### "keystore_path not found in config"

Ensure you've set the keystore path in your `dojo_{network}.toml` file:

```toml
[env]
keystore_path = "~/.starkli-wallets/deployer-sepolia-account.json"
```

### "Account address not configured"

Set your deployer account address in the `constructor_data` field of your `dojo_{network}.toml`:

```bash
# Get your account address
cat ~/.starkli-wallets/deployer-sepolia-account.json | jq -r '.deployment.address'

# Then update dojo_sepolia.toml:
# [[external_contracts]]
# constructor_data = [
#     "0xYOUR_ADDRESS_HERE"
# ]
```

### "Keystore file not found"

Verify the keystore file exists at the path specified in your TOML:

```bash
ls -la ~/.starkli-wallets/deployer-sepolia-account.json
```

If missing, re-run the account initialization steps from [Account Setup](#account-setup-sepoliamainnet).

### "Could not extract account address from keystore"

Verify your file is a Starkli account descriptor (not just a signer keystore). You need the `-account.json` file, not just the keystore file.

### "Account not funded"

Check your account balance:

```bash
# Sepolia
starkli balance ~/.starkli-wallets/deployer-sepolia-account.json \
  --rpc https://api.cartridge.gg/x/starknet/sepolia

# Mainnet
starkli balance ~/.starkli-wallets/deployer-mainnet-account.json \
  --rpc https://api.cartridge.gg/x/starknet/mainnet
```

Get testnet STRK from the [Sepolia Faucet](https://starknet-faucet.vercel.app/) or bridge mainnet STRK via [Starkgate](https://starkgate.starknet.io/).

### "Migration failed" or "Build failed"

- Check RPC endpoint is accessible:
  ```bash
  curl -X POST https://api.cartridge.gg/x/starknet/sepolia \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"starknet_chainId","params":[],"id":1}'
  ```
- Verify keystore password is correct
- Ensure account is deployed on the target network
- Check account has sufficient STRK for gas

### "Profile not found"

Ensure you're using the correct profile flag:
```bash
sozo -P sepolia build
sozo -P mainnet build
```

Or use the Scarb aliases:
```bash
scarb run deploy_sepolia
scarb run deploy_mainnet
```

### Tests failing locally

Ensure you have the correct versions:
```bash
# Check Dojo version
dojoup -v

# Check Starknet Foundry version
snforge --version
```

Expected versions:
- Dojo: 1.7.1
- Starknet Foundry: 0.48.1

## Security Considerations

### Access Control

1. **Actions contract**: Only owner can modify configuration
2. **NFT contract**: Only minter (actions) can update progress
3. **NFT contract**: Only owner can set minter

### Progress Integrity

1. **Bit flags** prevent tampering
2. **Double-completion** prevented (bit already set check)
3. **Only authorized minter** can update progress

### Validation

1. **Waza**: Real-time balance checks via ERC721
2. **Chi**: Answer hashes stored (not plaintext)
3. **Shin**: TODO - Controller integration required

### Quiz Privacy

1. **Answer hashes** stored on-chain (not plaintext answers)
2. **Actual answers** never revealed
3. **Poseidon hash** used (collision-resistant)

### Deployment Security

1. **Encrypted keystores**: Private keys never stored in plaintext
2. **Separate accounts**: Use different keystores for testnet and mainnet
3. **Strong passwords**: Use unique, strong passwords for each keystore
4. **Backup securely**: Keep encrypted backups of keystores off-machine
5. **Test on Sepolia first**: Always verify deployment scripts on testnet
6. **Hardware wallet**: Consider hardware wallet integration for mainnet production
7. **Minimal funding**: Only keep enough STRK for deployments, withdraw excess
8. **Keystore location**: Store keystores outside project directory (e.g., `~/.starkli-wallets/`)
9. **Never commit**: Keystores and passwords should never be committed to version control
10. **Time locks**: Production uses 24-hour time locks to prevent rushing through trials

## TODOs

- [ ] Implement Controller integration for Shin trial
- [ ] Add base64 encoding for SVG data URIs (currently UTF-8)
- [ ] Consider adding rate limiting between trials
- [ ] Add events to actions contract for analytics
- [ ] Add metadata JSON generation alongside SVG
- [ ] Consider adding trial completion timestamps
- [ ] Add admin function to pause/unpause system

## Known Issues

- Shin trial is currently a placeholder (always validates)
- SVG data URIs use UTF-8 encoding (should use base64)
- No rate limiting between trials
- No events emitted from actions contract

## License

See parent repository for license information.
