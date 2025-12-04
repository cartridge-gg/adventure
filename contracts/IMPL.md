# Adventure - Contract Implementation Plan

## ⚠️ CONFIRMED DESIGN DECISIONS (2024-11-05)

1. **Signature Verification**: Use secp256k1 (Ethereum-compatible) for easier frontend integration ✅
2. **Challenge Verification**: Minimum score requirement (stubbed initially, game-specific later) ✅
3. **Architecture**: General solution through interfaces/traits for different games/levels ✅
4. **SVG Design**: Basic treasure map (polish later) ✅
5. **Timeline**: 2 WEEKS (aggressive sprint!) ✅

## Overview

This document outlines the contract architecture for the Adventure system, supporting an arbitrary number of levels mixing onchain challenge games and IRL puzzle quests with cryptographic replay protection.

## Architecture Summary

**Two-Contract System:**
1. **Adventure Map NFT Contract** (standalone ERC721): Stores player progress, generates dynamic SVG metadata
2. **Adventure Actions Contract** (Dojo): Game logic, level verification, and configuration

**Key Features:**
- Support for N levels in any mix of challenge/puzzle types
- Bitmap-based progress tracking (efficient for up to 256 levels)
- Pluggable verification system for different challenge types
- THC-inspired signature-based replay protection for quests (secp256k1)
- Dynamic NFT artwork that updates as levels are completed
- One NFT per wallet policy

---

## 1. Data Models (Dojo)

### 1.1 AdventureConfig

Singleton configuration for the adventure.

```cairo
#[derive(Drop, Serde)]
#[dojo::model]
pub struct AdventureConfig {
    #[key]
    pub game_id: u32,              // Always 0 for singleton
    pub nft_contract: ContractAddress,
    pub total_levels: u8,           // Total number of levels (e.g., 6)
}
```

**Purpose:** Stores the NFT contract address and total level count.

### 1.2 PlayerToken

Tracks which token_id each player owns.

```cairo
#[derive(Drop, Serde)]
#[dojo::model]
pub struct PlayerToken {
    #[key]
    pub player: ContractAddress,
    pub token_id: u256,
}
```

**Purpose:** Maps player address to their Adventure Map NFT token_id. Enforces one-per-wallet policy.

### 1.3 LevelConfig

Configuration for each level.

```cairo
#[derive(Drop, Serde)]
#[dojo::model]
pub struct LevelConfig {
    #[key]
    pub level_number: u8,
    pub level_type: felt252,           // 'challenge' or 'puzzle'
    pub active: bool,

    // For challenge levels:
    pub verifier: ContractAddress,     // Address of verifier contract (0 if quest)

    // For puzzle levels:
    pub solution_address: ContractAddress,  // Derived from codeword (0 if game)
}
```

**Purpose:** Stores per-level configuration. Type determines which verification path to use.

**Design Decision:** Single model with optional fields vs separate models per type
- **Chosen:** Single model with optional fields (simpler, less storage)
- Uses `level_type` to determine which fields are relevant
- Challenge levels: use `verifier` field, ignore `solution_address`
- Puzzle levels: use `solution_address` field, ignore `verifier`

---

## 2. Adventure Map NFT Contract

### 2.1 Interface

```cairo
#[starknet::interface]
pub trait IAdventureMap<TContractState> {
    // ERC721 standard functions (from OpenZeppelin)
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn token_uri(self: @TContractState, token_id: u256) -> ByteArray;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
    fn transfer_from(ref self: TContractState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn safe_transfer_from(ref self: TContractState, from: ContractAddress, to: ContractAddress, token_id: u256, data: Span<felt252>);
    fn approve(ref self: TContractState, to: ContractAddress, token_id: u256);
    fn set_approval_for_all(ref self: TContractState, operator: ContractAddress, approved: bool);
    fn get_approved(self: @TContractState, token_id: u256) -> ContractAddress;
    fn is_approved_for_all(self: @TContractState, owner: ContractAddress, operator: ContractAddress) -> bool;

    // Custom minting and progress
    fn mint(ref self: TContractState, recipient: ContractAddress, username: felt252) -> u256;
    fn complete_level(ref self: TContractState, token_id: u256, level_number: u8);

    // View functions
    fn get_progress(self: @TContractState, token_id: u256) -> u256; // Returns bitmap
    fn get_username(self: @TContractState, token_id: u256) -> felt252;
    fn get_timestamp(self: @TContractState, token_id: u256) -> u64;

    // Admin
    fn set_minter(ref self: TContractState, minter: ContractAddress);
    fn get_minter(self: @TContractState) -> ContractAddress;
    fn set_total_levels(ref self: TContractState, total: u8);
    fn get_total_levels(self: @TContractState) -> u8;
}
```

### 2.2 Storage

```cairo
#[storage]
struct Storage {
    #[substorage(v0)]
    erc721: ERC721Component::Storage,
    #[substorage(v0)]
    src5: SRC5Component::Storage,

    owner: ContractAddress,
    minter: ContractAddress,            // Adventure Actions contract
    token_count: u256,

    // Per-token data
    mint_timestamps: Map<u256, u64>,
    usernames: Map<u256, felt252>,
    progress_bitmaps: Map<u256, u256>,  // Bitmap: bit N = level N complete

    // Configuration
    total_levels: u8,                    // e.g., 6
}
```

**Progress Bitmap Design:**
- `u256` supports up to 256 levels
- Bit position N corresponds to level N (0-indexed or 1-indexed, we'll use 1-indexed)
- Example: `0b00000111` = levels 1, 2, 3 complete
- Efficient: single storage slot for all progress
- Easy bit operations: `progress |= (1 << level_number)` to mark complete
- Check completion: `(progress & (1 << level_number)) != 0`

### 2.3 Key Functions

#### mint()

```cairo
fn mint(ref self: ContractState, recipient: ContractAddress, username: felt252) -> u256 {
    self.assert_minter();

    // Get next token ID
    let token_id = self.token_count.read();
    self.token_count.write(token_id + 1);

    // Mint the token and initialize progress
    self.erc721.mint(recipient, token_id);
    self.progress_bitmaps.write(token_id, 0);  // No levels complete yet

    // Store metadata
    self.mint_timestamps.write(token_id, starknet::get_block_timestamp());
    self.usernames.write(token_id, username);

    token_id
}
```

#### complete_level()

```cairo
fn complete_level(ref self: ContractState, token_id: u256, level_number: u8) {
    self.assert_minter();  // Only Actions contract can call

    // Read current progress
    let progress = self.progress_bitmaps.read(token_id);

    // Set bit for this level (using 1-indexed levels)
    let mask: u256 = 1_u256 << level_number.into();
    let new_progress = progress | mask;

    // Write updated progress
    self.progress_bitmaps.write(token_id, new_progress);
}
```

#### token_uri()

Generates dynamic SVG based on progress bitmap.

```cairo
fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
    let progress = self.get_progress(token_id);
    let username = self.get_username(token_id);
    let total_levels = self.total_levels.read();

    svg::generate_adventure_map_svg(progress, username, total_levels)
}
```

**SVG Generation:**
- Takes progress bitmap and total_levels as input
- Dynamically generates treasure map with N waypoints
- Highlights completed levels in green
- Shows username and completion percentage
- Final state (all levels complete) shows treasure chest and "Journey Complete"

---

## 3. Adventure Actions Contract (Dojo)

### 3.1 Interface

```cairo
#[starknet::interface]
pub trait IAdventureActions<T> {
    // Player actions
    fn mint(ref self: T, username: felt252);
    fn complete_level(ref self: T, token_id: u256, level_number: u8, proof_data: Span<felt252>);

    // View functions
    fn get_player_token_id(self: @T, player: ContractAddress) -> u256;
    fn get_level_status(self: @T, token_id: u256, level_number: u8) -> bool;
    fn get_progress(self: @T, token_id: u256) -> u256;
    fn get_level_config(self: @T, level_number: u8) -> LevelConfig;

    // Admin functions
    fn set_nft_contract(ref self: T, nft_contract: ContractAddress, total_levels: u8);
    fn set_level_config(ref self: T, level_number: u8, level_type: felt252, verifier: ContractAddress, solution_address: ContractAddress, active: bool);
}
```

### 3.2 Events

```cairo
#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct MapMinted {
    #[key]
    pub player: ContractAddress,
    pub token_id: u256,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct LevelCompleted {
    #[key]
    pub token_id: u256,
    pub player: ContractAddress,
    pub level_number: u8,
    pub level_type: felt252,
}
```

### 3.3 Core Logic: complete_level()

This is the heart of the system. It handles verification for both level types.

```cairo
fn complete_level(ref self: ContractState, token_id: u256, level_number: u8, proof_data: Span<felt252>) {
    let caller = get_caller_address();
    let mut world = self.world_default();

    // 1. Get NFT contract and verify ownership
    let config: AdventureConfig = world.read_model(CONFIG_KEY);
    let nft_erc721 = IERC721Dispatcher { contract_address: config.nft_contract };
    let owner = nft_erc721.owner_of(token_id);
    assert(owner == caller, 'Not token owner');

    // 2. Get level configuration
    let level_config: LevelConfig = world.read_model(level_number);
    assert(level_config.active, 'Level not active');
    assert(level_number >= 1 && level_number <= config.total_levels, 'Invalid level');

    // 3. Check sequential progression (must complete level N-1 first)
    let nft = IAdventureMapDispatcher { contract_address: config.nft_contract };
    let progress = nft.get_progress(token_id);

    if level_number > 1 {
        let prev_level_mask: u256 = 1_u256 << (level_number - 1).into();
        assert((progress & prev_level_mask) != 0, 'Must complete previous level');
    }

    // 4. Check if already complete (idempotency)
    let level_mask: u256 = 1_u256 << level_number.into();
    if (progress & level_mask) != 0 {
        return; // Already complete, no-op
    }

    // 5. Verify based on level type
    if level_config.level_type == 'challenge' {
        self.verify_challenge_level(caller, level_config.verifier, proof_data);
    } else if level_config.level_type == 'puzzle' {
        self.verify_puzzle_level(caller, level_config.solution_address, proof_data);
    } else {
        panic_with_felt252('Invalid level type');
    }

    // 6. Mark level complete in NFT contract
    nft.complete_level(token_id, level_number);

    // 7. Emit event
    world.emit_event(@LevelCompleted {
        token_id,
        player: caller,
        level_number,
        level_type: level_config.level_type
    });
}
```

---

## 4. Verification Strategies

### 4.1 Challenge Level Verification

Challenge levels use a pluggable verifier contract system.

#### Verifier Interface

```cairo
#[starknet::interface]
pub trait ILevelVerifier<T> {
    fn verify(self: @T, player: ContractAddress, proof_data: Span<felt252>) -> bool;
}
```

#### Implementation in Actions Contract

```cairo
fn verify_challenge_level(self: @ContractState, player: ContractAddress, verifier: ContractAddress, proof_data: Span<felt252>) {
    let verifier_dispatcher = ILevelVerifierDispatcher { contract_address: verifier };
    let result = verifier_dispatcher.verify(player, proof_data);
    assert(result, 'Challenge verification failed');
}
```

#### Example Verifier: ERC721 Ownership

For challenges that mint completion NFTs (like Death Mountain, Nums):

```cairo
#[starknet::contract]
pub mod ERC721OwnershipVerifier {
    use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};

    #[storage]
    struct Storage {
        game_nft_contract: ContractAddress,
        min_balance: u256,
    }

    #[abi(embed_v0)]
    impl VerifierImpl of super::ILevelVerifier<ContractState> {
        fn verify(self: @ContractState, player: ContractAddress, proof_data: Span<felt252>) -> bool {
            // proof_data is ignored for this verifier (could contain game_id if needed)
            let game_nft = IERC721Dispatcher { contract_address: self.game_nft_contract.read() };
            let balance = game_nft.balance_of(player);
            balance >= self.min_balance.read()
        }
    }
}
```

#### Example Verifier: Score Threshold

For challenges that track scores in Dojo models:

```cairo
#[starknet::contract]
pub mod ScoreThresholdVerifier {
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    #[storage]
    struct Storage {
        game_world: ContractAddress,
        threshold: u256,
    }

    #[abi(embed_v0)]
    impl VerifierImpl of super::ILevelVerifier<ContractState> {
        fn verify(self: @ContractState, player: ContractAddress, proof_data: Span<felt252>) -> bool {
            // Read player's score from challenge's Dojo world
            let world = IWorldDispatcher { contract_address: self.game_world.read() };

            // proof_data format: [game_id_felt252]
            // This is game-specific - would need to read the appropriate model

            // Example: let score = world.read_model::<GameScore>(player);
            // return score.value >= self.threshold.read();

            // For now, simplified:
            true  // Implementation depends on specific challenge's model structure
        }
    }
}
```

**Design Note:** Each game will need a custom verifier contract or configuration. This is intentional for flexibility.

### 4.2 Puzzle Level Verification (THC-Inspired)

Puzzle levels use cryptographic signature-based verification with replay protection.

#### Cryptographic Flow

**Setup (Deployment):**
1. Choose codeword (e.g., "DEVCONNECT")
2. Derive Starknet address from codeword:
   ```typescript
   const privateKey = poseidonHash(stringToBytes(codeword.toLowerCase()));
   const solutionAddress = getAddressFromPrivateKey(privateKey);
   ```
3. Store `solution_address` in `LevelConfig` (never store codeword on-chain)

**Verification (Player Submission):**

Frontend generates signature:
```typescript
function signatureFromSolution(codeword: string, playerAddress: string): Signature {
  const privateKey = poseidonHash(stringToBytes(codeword.toLowerCase()));
  const solutionAccount = new Account(provider, getAddressFromPrivateKey(privateKey), privateKey);

  // Sign the player's address
  const messageHash = typedDataHash({
    domain: { name: "Adventure", version: "1" },
    types: { Message: [{ name: "player", type: "ContractAddress" }] },
    primaryType: "Message",
    message: { player: playerAddress }
  });

  return solutionAccount.signHash(messageHash);
}
```

Contract verifies signature:
```cairo
fn verify_puzzle_level(self: @ContractState, player: ContractAddress, solution_address: ContractAddress, proof_data: Span<felt252>) {
    // proof_data format: [r_low, r_high, s_low, s_high] (signature as felt252s)
    assert(proof_data.len() == 4, 'Invalid signature format');

    // Reconstruct signature
    let r_low: u128 = (*proof_data.at(0)).try_into().unwrap();
    let r_high: u128 = (*proof_data.at(1)).try_into().unwrap();
    let s_low: u128 = (*proof_data.at(2)).try_into().unwrap();
    let s_high: u128 = (*proof_data.at(3)).try_into().unwrap();

    let r: u256 = u256 { low: r_low, high: r_high };
    let s: u256 = u256 { low: s_low, high: s_high };

    // Reconstruct message hash: hash(player_address)
    let message_hash = self.compute_puzzle_message_hash(player);

    // Recover signer address from signature
    let recovered_address = self.recover_address(message_hash, r, s);

    // Verify recovered address matches stored solution address
    assert(recovered_address == solution_address, 'Wrong codeword');
}

fn compute_puzzle_message_hash(self: @ContractState, player: ContractAddress) -> felt252 {
    // Use Starknet typed data hashing (SNIP-12)
    // Simplified: just hash the player address
    let player_felt: felt252 = player.into();
    poseidon::poseidon_hash_single(player_felt)
}

fn recover_address(self: @ContractState, message_hash: felt252, r: u256, s: u256) -> ContractAddress {
    // Use Starknet's signature verification
    // This is a simplified example - actual implementation uses starknet::ecdsa_recover

    // Note: Starknet uses its own curve (STARK-friendly curve)
    // We need to use starknet::secp256k1 verification or native curve

    // Placeholder - actual implementation:
    // let public_key = ecdsa::recover(message_hash, r, s);
    // let address = public_key_to_address(public_key);
    // address

    starknet::contract_address_const::<0>()  // Placeholder
}
```

**Security Properties:**
- **Replay Protection:** Alice's signature for her address won't verify for Bob's address
- **Solution Confidentiality:** Codeword never appears on-chain
- **Unlimited Attempts:** Failed submissions don't reveal solution
- **Non-Transferability:** Signatures are player-specific

**Implementation Note:** Starknet signature recovery is complex. We may need to:
1. Use a library for ECDSA signature verification
2. Consider using Starknet account abstraction signature verification
3. Potentially use secp256k1 signature scheme for compatibility

---

## 5. SVG Generation

### 5.1 Dynamic Treasure Map

The SVG generator creates a treasure map with N waypoints based on `total_levels`.

**Key Requirements:**
- Support arbitrary N (3-10+ levels)
- Show waypoints as numbered circles
- Highlight completed levels (green) vs incomplete (gray)
- Draw path between waypoints
- Show progress percentage
- Display username
- Final state shows treasure chest

**Example Structure:**

```cairo
pub fn generate_adventure_map_svg(progress: u256, username: felt252, total_levels: u8) -> ByteArray {
    let mut svg = ByteArray::new();

    // Header
    svg.append(@"<svg viewBox=\"0 0 400 500\" xmlns=\"http://www.w3.org/2000/svg\">");

    // Background
    svg.append(@"<rect width=\"400\" height=\"500\" fill=\"#fef3c7\"/>");

    // Title
    svg.append(@"<text x=\"200\" y=\"40\" text-anchor=\"middle\" font-size=\"24\" fill=\"#78350f\">");
    svg.append(@"Adventure");
    svg.append(@"</text>");

    // Username
    svg.append(@"<text x=\"200\" y=\"65\" text-anchor=\"middle\" font-size=\"14\" fill=\"#92400e\">");
    svg.append(@"Adventurer: ");
    append_felt_as_string(ref svg, username);
    svg.append(@"</text>");

    // Generate waypoints
    let waypoints = calculate_waypoints(total_levels);
    render_waypoints(ref svg, waypoints, progress);

    // Completion status
    let completed = count_completed_levels(progress, total_levels);
    if completed == total_levels {
        svg.append(@"<text x=\"200\" y=\"475\" text-anchor=\"middle\" font-size=\"16\" fill=\"#15803d\" font-weight=\"bold\">");
        svg.append(@"Journey Complete!");
        svg.append(@"</text>");

        // Treasure chest
        render_treasure_chest(ref svg, 200, 440);
    }

    svg.append(@"</svg>");
    svg
}
```

**Waypoint Layout:**
- Calculate waypoint positions in a winding path from top to bottom
- Use sine wave or zigzag pattern for visual interest
- Space evenly based on `total_levels`

```cairo
fn calculate_waypoints(total_levels: u8) -> Array<(u32, u32)> {
    let mut waypoints = ArrayTrait::new();
    let start_y: u32 = 80;
    let end_y: u32 = 420;
    let vertical_spacing: u32 = (end_y - start_y) / (total_levels.into() - 1);
    let center_x: u32 = 200;
    let amplitude: u32 = 80;

    let mut i: u8 = 0;
    loop {
        if i >= total_levels {
            break;
        }

        let y = start_y + (i.into() * vertical_spacing);
        let x = center_x + (sin_approx(i) * amplitude / 100);
        waypoints.append((x, y));

        i += 1;
    };

    waypoints
}
```

---

## 6. Deployment Flow

### 6.1 Deployment Steps

1. **Deploy Adventure Map NFT Contract**
   ```bash
   scarb build
   starkli declare contracts/target/dev/adventure_map.contract_class.json
   starkli deploy <class_hash> <owner_address>
   ```

2. **Deploy Dojo World and Models**
   ```bash
   cd contracts
   sozo build
   sozo migrate --world <WORLD_ADDRESS>
   ```

3. **Deploy Verifier Contracts**
   - Deploy one verifier per challenge type
   - Example: ERC721OwnershipVerifier for Death Mountain
   - Example: ScoreThresholdVerifier for Nums

4. **Configure Adventure**
   ```bash
   # Set NFT contract in Dojo
   sozo execute <ACTIONS_ADDRESS> set_nft_contract <NFT_ADDRESS> 6

   # Grant minter role to Actions contract
   starkli invoke <NFT_ADDRESS> set_minter <ACTIONS_ADDRESS>
   ```

5. **Configure Levels**

   For each challenge level:
   ```bash
   sozo execute <ACTIONS_ADDRESS> set_level_config \
     <level_number> \
     'challenge' \
     <VERIFIER_ADDRESS> \
     0x0 \
     true
   ```

   For each puzzle level:
   ```bash
   # First, derive solution address locally:
   node scripts/derive_solution_address.js "DEVCONNECT"
   # Output: 0x1234...

   sozo execute <ACTIONS_ADDRESS> set_level_config \
     <level_number> \
     'puzzle' \
     0x0 \
     0x1234... \
     true
   ```


### 6.2 Configuration Script

Create `scripts/configure_adventure.sh` following the deploy_katana.sh pattern:

```bash
#!/bin/bash
set -euo pipefail

# Configuration script for Adventure levels
# Reads from spec/challenges.json and spec/puzzles.json
# Uses sozo to configure level settings via the actions contract

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONTRACTS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
SPEC_DIR="$( cd "$SCRIPT_DIR/../../spec" && pwd )"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Configuring Adventure Levels ===${NC}"

# Get contract addresses from manifest
NFT_ADDRESS=$(jq -r '.external_contracts[] | select(.tag == "adventure-adventure_map") | .address' "$CONTRACTS_DIR/manifest_dev.json")
ACTIONS_ADDRESS=$(jq -r '.contracts[] | select(.tag == "adventure-actions") | .address' "$CONTRACTS_DIR/manifest_dev.json")

echo -e "${BLUE}NFT Contract: $NFT_ADDRESS${NC}"
echo -e "${BLUE}Actions Contract: $ACTIONS_ADDRESS${NC}"

# Step 1: Set NFT contract in actions
echo -e "\n${YELLOW}Step 1: Configuring NFT contract...${NC}"
TOTAL_LEVELS=6
sozo execute --profile dev --wait adventure-actions set_nft_contract "$NFT_ADDRESS" "$TOTAL_LEVELS"
echo -e "${GREEN}✓ NFT contract configured with $TOTAL_LEVELS total levels${NC}"

# Step 2: Grant minter role to actions contract
echo -e "\n${YELLOW}Step 2: Setting minter role...${NC}"
sozo execute --profile dev --wait "$NFT_ADDRESS" set_minter "$ACTIONS_ADDRESS"
echo -e "${GREEN}✓ Actions contract granted minter role${NC}"

# Step 3: Configure challenge levels from challenges.json
echo -e "\n${YELLOW}Step 3: Configuring challenge levels...${NC}"
CHALLENGES_JSON="$SPEC_DIR/challenges.json"

if [ -f "$CHALLENGES_JSON" ]; then
    # Get challenges from JSON using jq
    CHALLENGES=$(jq -c '.challenges[]' "$CHALLENGES_JSON")

    while IFS= read -r challenge; do
        LEVEL=$(echo "$challenge" | jq -r '.level')
        NAME=$(echo "$challenge" | jq -r '.name')
        VERIFIER_TYPE=$(echo "$challenge" | jq -r '.verifier_type')

        # TODO: Deploy actual verifier contracts
        # For now, use placeholder address or deploy MinimumScoreVerifier
        VERIFIER_ADDRESS="0x0"  # Replace with actual deployed verifier

        echo -e "${YELLOW}Configuring Level $LEVEL: $NAME (${VERIFIER_TYPE})${NC}"

        # Execute set_level_config: level_number, level_type, verifier, solution_address, active
        sozo execute --profile dev --wait adventure-actions set_level_config \
            "$LEVEL" \
            "'challenge'" \
            "$VERIFIER_ADDRESS" \
            "0x0" \
            "1"

        echo -e "${GREEN}✓ Level $LEVEL configured${NC}"
    done <<< "$CHALLENGES"
else
    echo -e "${YELLOW}Warning: challenges.json not found at $CHALLENGES_JSON${NC}"
fi

# Step 4: Configure puzzle levels from puzzles.json
echo -e "\n${YELLOW}Step 4: Configuring puzzle levels...${NC}"
PUZZLES_JSON="$SPEC_DIR/puzzles.json"

if [ -f "$PUZZLES_JSON" ]; then
    # Get puzzles from JSON using jq
    PUZZLES=$(jq -c '.puzzles[]' "$PUZZLES_JSON")

    while IFS= read -r puzzle; do
        LEVEL=$(echo "$puzzle" | jq -r '.level')
        NAME=$(echo "$puzzle" | jq -r '.name')
        CODEWORD=$(echo "$puzzle" | jq -r '.codeword')

        echo -e "${YELLOW}Configuring Level $LEVEL: $NAME${NC}"

        # Derive solution address from codeword
        # TODO: Implement derive_solution_address.sh script
        # For now, use placeholder
        SOLUTION_ADDRESS="0x0"  # Replace with actual derived address

        # Execute set_level_config: level_number, level_type, verifier, solution_address, active
        sozo execute --profile dev --wait adventure-actions set_level_config \
            "$LEVEL" \
            "'puzzle'" \
            "0x0" \
            "$SOLUTION_ADDRESS" \
            "1"

        echo -e "${GREEN}✓ Level $LEVEL configured (codeword: $CODEWORD)${NC}"
    done <<< "$PUZZLES"
else
    echo -e "${YELLOW}Warning: puzzles.json not found at $PUZZLES_JSON${NC}"
fi

echo -e "\n${GREEN}Configuration complete!${NC}"
echo -e "${BLUE}Note: Verifier contracts need to be deployed separately${NC}"
echo -e "${BLUE}Note: Puzzle solution addresses need to be derived from codewords${NC}"
```

**Usage:**
```bash
cd contracts
chmod +x scripts/configure_adventure.sh
./scripts/configure_adventure.sh
```

**Note:** This script assumes:
- Contracts are already deployed (via `sozo migrate`)
- `manifest_dev.json` contains the deployed addresses
- Verifier contracts are deployed separately (see section 6.3)
- Solution addresses for puzzles are derived using `scripts/derive_solution_address.sh` (see section 6.4)

---

## 7. Testing Strategy

### 7.1 Unit Tests

**NFT Contract Tests:**
- [ ] Minting creates new token with correct owner
- [ ] One-per-wallet enforcement (checked via balance)
- [ ] Progress bitmap updates correctly
- [ ] SVG generation works for all progress states
- [ ] Only minter can mint and complete levels

**Actions Contract Tests:**
- [ ] Mint creates PlayerToken mapping
- [ ] Sequential progression enforcement
- [ ] Challenge level verification calls correct verifier
- [ ] Puzzle level verification checks signature
- [ ] Idempotency (completing twice is safe)
- [ ] Events emitted correctly

**Verifier Tests:**
- [ ] ERC721 verifier checks ownership correctly
- [ ] Score verifier reads Dojo models correctly
- [ ] Custom verifiers work as expected

### 7.2 Integration Tests

- [ ] Full flow: mint → complete level 1 (game) → complete level 2 (quest) → ... → complete level N
- [ ] NFT metadata updates after each level
- [ ] Frontend can read progress and display correctly
- [ ] Signature verification works end-to-end
- [ ] Sequential progression enforced across level types

### 7.3 Security Tests

- [ ] Cannot complete level N without completing N-1
- [ ] Cannot use another player's puzzle signature
- [ ] Wrong codeword signature fails verification
- [ ] Cannot mint second NFT to same wallet
- [ ] Only authorized minter can call NFT functions

---

## 8. Implementation Phases (2-WEEK SPRINT)

### Week 1: Core Infrastructure & Verification

**Days 1-2: Foundation**
- [x] Design document and architecture decisions
- [ ] Refactor models.cairo from ronin-quest baseline
- [ ] Implement AdventureMap NFT contract (bitmap progress, no SVG yet)
- [ ] Implement Actions contract skeleton

**Days 3-4: Verification System**
- [ ] Create ILevelVerifier trait/interface
- [ ] Implement MinimumScoreVerifier (stubbed)
- [ ] Implement puzzle signature verification (secp256k1)
- [ ] Create cryptographic utilities for signature recovery

**Days 5-7: Core Logic & Testing**
- [ ] Implement complete_level() with both verification paths
- [ ] Implement mint() flow end-to-end
- [ ] Sequential progression enforcement
- [ ] Write unit tests for all core functions
- [ ] Basic integration tests

### Week 2: SVG, Integration & Deployment

**Days 8-10: SVG & Frontend Integration**
- [ ] Implement basic treasure map SVG generation
- [ ] Dynamic waypoint rendering based on total_levels
- [ ] Frontend crypto utilities (signature generation)
- [ ] Frontend contract integration helpers
- [ ] End-to-end testing with frontend

**Days 11-12: Game Verifiers & Configuration**
- [ ] Stub game-specific verifiers (Death Mountain, Nums, Glitchbomb)
- [ ] Create deployment scripts
- [ ] Create configuration scripts for levels
- [ ] Deploy to Katana testnet
- [ ] Test all 6 levels end-to-end

**Days 13-14: Polish & Deploy**
- [ ] Security review of contracts
- [ ] Fix any critical issues
- [ ] Deploy to Starknet mainnet (or target network)
- [ ] Configure production levels
- [ ] Update frontend with production addresses
- [ ] Final end-to-end testing

### MVP Features (Must-Have)
- ✅ Mint Adventure Map NFT (one per wallet)
- ✅ Complete challenge levels with stub verification
- ✅ Complete puzzle levels with signature verification
- ✅ Sequential progression enforcement
- ✅ Bitmap progress tracking
- ✅ Basic SVG treasure map
- ✅ Frontend integration

### Polish Features (Nice-to-Have, if time)
- ⚠️ Advanced SVG design
- ⚠️ Detailed game-specific verification
- ⚠️ Comprehensive test coverage
- ⚠️ Gas optimizations
- ⚠️ Admin tools for level management

---

## 9. Design Decisions (Finalized)

### Q1: Signature Verification Implementation ✅ DECIDED

**Decision:** Use secp256k1 (Ethereum-compatible) for easier frontend integration.

**Implementation:** Use `starknet::secp256k1::secp256k1_recover` for signature recovery.

### Q2: Verifier Architecture ✅ DECIDED

**Decision:** Use trait-based interface system with standalone verifier contracts for flexibility.

**Implementation:** `ILevelVerifier` trait with MinimumScoreVerifier (stubbed initially), customizable per game later.

### Q3: Progress Storage: Bitmap vs Array

**Question:** Use bitmap or array of completed level numbers?

**Comparison:**
- **Bitmap:** Single u256 storage slot, efficient, but limited to 256 levels
- **Array:** Unlimited levels, but higher gas for large N

**Chosen:** Bitmap. Limits us to 256 levels, but that's far more than needed. Extremely gas-efficient.

### Q4: Level Numbering: 0-indexed or 1-indexed?

**Question:** Should levels be numbered 1-6 or 0-5?

**Recommendation:** 1-indexed (1-6) for user-facing consistency. Frontend shows "Level 1", "Level 2", etc.

### Q5: Multiple Codewords per Level?

**Question:** Support multiple valid codewords per puzzle level?

**Use Case:** Synonyms, translations, or alternative solutions.

**Implementation:**
```cairo
pub solution_addresses: Array<ContractAddress>,  // Store multiple valid addresses
```

**Recommendation:** Start with single codeword per level for simplicity. Can add multi-answer support in v2 if needed.

### Q6: Admin Permissions

**Question:** How to manage admin functions in Dojo?

**Answer:** Dojo uses owner permissions defined in `dojo_<profile>.toml`. The world owner can grant write permissions to specific contracts/addresses.

**Security:** Ensure only authorized addresses can call `set_level_config()` and `set_nft_contract()`.

---

## 10. Migration from Ronin's Pact

The existing contracts are based on Ronin's Pact. Here's what needs to change:

| Ronin's Pact | Adventure | Changes |
|--------------|----------------|---------|
| 3 fixed trials (Waza/Chi/Shin) | N arbitrary levels | Replace fixed trial models with LevelConfig |
| Hardcoded trial types | Dynamic level types | Add `level_type` field |
| Quiz answer hashing | Signature-based quests | Replace hash verification with signature recovery |
| Game NFT ownership only | Pluggable verifiers | Add ILevelVerifier interface |
| 3-state progress struct | Bitmap | Replace TrialProgress with u256 bitmap |
| Fixed SVG with 3 states | Dynamic SVG with N+1 states | Generalize SVG generation |
| Time lock for final trial | No time locks | Remove time lock logic |

**Files to Modify:**
- `models.cairo`: Replace with new models (AdventureConfig, LevelConfig)
- `systems/actions.cairo`: Rewrite complete_level() logic
- `token/pact.cairo`: Rename to `adventure_map.cairo`, update progress tracking
- `token/svg.cairo`: Completely rewrite for dynamic treasure map

**Files to Create:**
- `systems/verifiers/`: New directory for verifier contracts
- `crypto/signature.cairo`: Signature verification utilities

---

## 11. Dependencies & Libraries

**Required:**
- `openzeppelin::token::erc721`: ERC721 implementation
- `openzeppelin::introspection::src5`: SRC5 interface detection
- `dojo::world`: Dojo world interactions
- `dojo::model`: Model storage
- `dojo::event`: Event emission
- `starknet::secp256k1`: Signature verification (for puzzle levels)

**External Contracts:**
- Death Mountain game contract (for ERC721 verifier)
- Nums game contract (for ERC721 verifier)
- Glitchbomb game contract (for ERC721 verifier)

---

## 12. Frontend Integration Notes

### Contract Addresses to Export

After deployment, frontend needs:
```typescript
export const ADVENTURE_CONTRACTS = {
  nftContract: '0x...',      // Adventure Map NFT
  actionsContract: '0x...',  // Dojo Actions
  worldContract: '0x...',    // Dojo World

  verifiers: {
    deathMountain: '0x...',
    nums: '0x...',
    glitchbomb: '0x...',
  },

  games: {
    deathMountain: '0x...',  // Game NFT contract for ownership check
    nums: '0x...',
    glitchbomb: '0x...',
  }
};
```

### Key Functions Frontend Needs

**Read Operations:**
- `get_player_token_id(player)` → u256
- `get_progress(token_id)` → u256 bitmap
- `get_level_status(token_id, level_number)` → bool
- `get_level_config(level_number)` → LevelConfig

**Write Operations:**
- `mint(username)` → triggers transaction
- `complete_level(token_id, level_number, proof_data)` → triggers transaction

**Cryptographic Utilities (Frontend):**
```typescript
// For puzzle levels
function generateQuestProof(codeword: string, playerAddress: string): Span<felt252>;

// For challenge levels (if needed)
function generateGameProof(gameId: string, gameData: any): Span<felt252>;
```

---

## Summary

This implementation plan provides a flexible, scalable architecture for the Adventure system that supports:

1. **Arbitrary N levels** in any mix of challenge/puzzle types
2. **Efficient progress tracking** via bitmap storage
3. **Pluggable challenge verification** via ILevelVerifier interface
4. **Secure quest verification** via THC-inspired signature system
5. **Dynamic NFT artwork** that updates with progress
6. **Sequential progression** enforcement
7. **One NFT per wallet** policy

**Next Steps:**
1. Review this plan and confirm architecture decisions
2. Start Phase 1 implementation (core infrastructure)
3. Create detailed task list for each phase
4. Set up testing environment on Katana

**Estimated Timeline:** 6-8 weeks for full implementation and testing.
