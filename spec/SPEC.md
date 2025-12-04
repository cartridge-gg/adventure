# Adventure — Feature Specification

> **Status:** DRAFT

> **Architecture:** Vite + React frontend + Starknet contracts (Dojo + standalone ERC721)

> **Network:** Local Katana development → Starknet mainnet deployment

> **Based on:** [DIP-69](https://github.com/efdevcon/DIPs/blob/master/DIPs/DIP-69.md)

> **See also:** [DIP-4](https://github.com/efdevcon/DIPs/blob/master/DIPs/DIP-4.md)

---

## 1) Overview

The Adventure is a multi-level gaming experience combining browser-based fully onchain games with real-world quests at community hub spaces throughout DevConnect. Participants progress through the adventure using the Cartridge Controller for seamless authentication, with their journey represented as a dynamically updating onchain NFT adventure map.

**Core Experience:**
* N levels in any mix of onchain game challenges and community hub-based quests
* One evolving NFT that visualizes progress as a treasure map
* Self-serve, automatic verification for all levels
* Sequential progression through configurable level sequence

---

## 2) Goals

* Drive DevConnect engagement through progressive onchain and physical challenges
* Create a seamless experience alternating between digital gameplay and real-world exploration
* Provide a smooth, low-friction UX for new and existing Starknet users via Cartridge Controller
* Generate a memorable, shareable artifact (dynamic NFT adventure map)
* Encourage community hub visits and social connections

---

## 3) User Experience

### 3.1 Discovery & Entry
* Users discover the adventure via QR codes at DevConnect venue entry points
* Users connect with **Cartridge Controller**
* Users mint **one** Adventure Map NFT to their wallet (includes username)

### 3.2 Progressive Journey
* A **Quest Dashboard** shows all configured levels with real-time status and progress
* Levels unlock sequentially (must complete level N to unlock level N+1)
* As each level is completed, the NFT artwork updates to show progress on the adventure map
* When all levels are complete, the NFT displays the **"Journey Complete"** state
* Total number of levels and their types are configured at deployment

### 3.3 Level Types
* **Onchain Game Levels:** Complete challenges in browser-based FOCG games
* **Community Hub Quest Levels:** Visit physical locations, solve puzzles, submit codewords
* Level types can be configured in any order and mix at deployment

### 3.4 Social Features
* Share progress on social media (X/Twitter)
* Display completion status and NFT artwork
* Optional: leaderboard showing completion rates

---

## 4) Core Features

### 4.1 Authentication & Account

* Connect/disconnect via **Cartridge Controller**
* Display the currently connected wallet address
* Show user's current progress and adventure map NFT

### 4.2 The Adventure Map (Dynamic NFT)

* **One-per-wallet** mint policy
* NFT artwork visualizes progress as a **treasure map** with **N+1 visual states**:
  * Base state (0/N levels complete)
  * +Level 1 complete (1/N)
  * +Level 2 complete (2/N)
  * ...
  * +Level N-1 complete ((N-1)/N)
  * Journey Complete (N/N)
* NFT metadata displays **progress traits** for each level (Complete/Incomplete)
* Artwork updates **automatically** when progress changes (no manual refresh)
* Map design should evoke a sense of exploration and adventure
* Number of visual states adapts to the configured number of levels

**Technical Implementation:**
* Onchain SVG generation tracking level completion state
* Progress stored in NFT contract storage
* Metadata updates trigger on level completion

### 4.3 Level Architecture (Generalized)

The adventure supports **N levels** with two distinct level types:

#### 4.3.1 Level Type: Onchain Game

**Objective:** Complete a challenge in a specific FOCG game

**Configuration (per level):**
* Game identifier/contract address
* Verification strategy (see §4.3.3)
* Level name and thematic description
* Success criteria

**Verification Flow:**
1. User clicks "Complete Level N" after finishing game challenge
2. Frontend calls `complete_level(token_id, level_number, proof_data)`
3. Contract verifies:
   * Caller owns the Adventure Map NFT
   * Level N-1 is complete (sequential progression)
   * Level N is not already complete
   * Game-specific verification passes (see §4.3.3)
4. On success, Level N is marked **Complete** in NFT contract

**UI Requirements:**
* Clear instructions on what game to play and how to complete the challenge
* Link to game (opens in new tab or embedded iframe)
* "Complete Level" button with clear success/failure feedback
* Re-claim blocked once complete

#### 4.3.2 Level Type: Community Hub Quest

**Objective:** Visit a community hub location, solve a puzzle, and submit the codeword with cryptographic replay protection

**Configuration (per level):**
* Community hub name and general location hint
* Solution address (Starknet address derived from codeword, for verification)
* Level name and thematic description

**Verification Flow:**
1. User visits community hub and solves physical/digital puzzle to obtain codeword
2. User enters plaintext codeword in the dashboard
3. Frontend derives a Starknet wallet from the codeword (see §4.3.4)
4. Frontend signs the player's address using the codeword-derived wallet
5. Frontend calls `complete_level(token_id, level_number, signature)` with the ECDSA signature
6. Contract verifies:
   * Caller owns the Adventure Map NFT
   * Level N-1 is complete (sequential progression)
   * Level N is not already complete
   * Signature verification passes (see §4.3.4)
7. On success, Level N is marked **Complete** in NFT contract

**UI Requirements:**
* Text input for codeword entry
* "Submit Codeword" button
* Clear success/failure feedback (e.g., "Incorrect codeword, try again")
* Hint system (optional: reveal location after previous level complete)
* Unlimited submission attempts allowed
* Automatic signature generation (transparent to user)

**Security Properties:**
* Codewords never appear on-chain (only derived addresses)
* Replay protection: each player must sign their own address
* Cannot copy another player's transaction to solve the puzzle
* Solution remains confidential even after multiple submissions
* Based on proven THC (Treasure Hunt Creator) cryptographic design

#### 4.3.3 Game Verification Strategies

Game verification will be more complex than simple ERC721 ownership checks. The system should support multiple verification strategies:

**Strategy Interface (conceptual):**
```cairo
trait ILevelVerifier {
    fn verify(player: ContractAddress, proof_data: Span<felt252>) -> bool;
}
```

**Potential Verification Strategies (to be implemented):**
* **Token Ownership:** Player owns ≥N tokens from specific collection
* **Score Threshold:** Player achieved score ≥X in specific game instance
* **Achievement Unlock:** Player unlocked specific achievement/badge
* **Game Completion:** Player completed specific game level/challenge
* **Custom Logic:** Game-specific verification via external contract call

**Implementation Approach:**
* Each game level has an associated verifier contract/logic
* Verifier is registered in Dojo models at deployment
* `complete_level` dispatches to appropriate verifier based on level number
* Proof data format is verifier-specific (e.g., game_address, token_id, score, etc.)

**Note:** Specific verification strategies will be implemented based on selected games.

#### 4.3.4 Cryptographic Replay Protection for Community Hub Quests

Community hub quest verification uses ECDSA signature-based replay protection inspired by the [Treasure Hunt Creator (THC)](https://github.com/social-dist0rtion-protocol/thc) framework. This prevents players from copying answers by observing on-chain transactions.

**Core Mechanism:**

Each codeword solution deterministically derives a unique Starknet address. Players prove they know the solution by signing their own wallet address with the solution-derived private key.

**Frontend Implementation:**

```typescript
// 1. Derive wallet from codeword solution
function walletFromSolution(solution: string): Account {
  const normalized = solution.trim().toLowerCase();
  const solutionBytes = stringToBytes(normalized);
  const privateKey = poseidonHash(solutionBytes);  // Starknet-native hash
  return privateKeyToAccount(privateKey);
}

// 2. Generate signature for submission
async function signatureFromSolution(
  solution: string,
  playerAddress: string
): Promise<Signature> {
  const solutionWallet = walletFromSolution(solution);
  const messageHash = typedDataHash(playerAddress);  // Structured message hash
  return solutionWallet.signHash(messageHash);
}
```

**Contract Implementation:**

```cairo
// Stored at deployment: solution addresses for each quest level
#[dojo::model]
pub struct LevelConfig {
    #[key]
    pub level_number: u8,
    pub solution_address: ContractAddress,  // Derived from correct codeword
    // ... other fields
}

// Verification logic in complete_level
fn complete_level(token_id: u256, level_number: u8, signature: Span<felt252>) {
    let caller = get_caller_address();
    let level_config: LevelConfig = world.read_model(level_number);

    // Reconstruct message hash (player's address)
    let message_hash = typed_data_hash(caller);

    // Recover signer from signature
    let recovered_address = recover_address(message_hash, signature);

    // Verify recovered address matches stored solution address
    assert(recovered_address == level_config.solution_address, 'Wrong solution');

    // Mark level complete...
}
```

**Why This Prevents Replay Attacks:**

1. **Solution Derivation:** Codeword → Private Key → Public Address (deterministic)
2. **Player-Specific Signature:** Each player signs their own address with solution-derived key
3. **Verification:** Contract checks if signature on player's address is valid for solution address
4. **Replay Protection:**
   - Alice solves puzzle, gets codeword "DEVCONNECT"
   - Alice signs hash(0xAlice) with wallet derived from "DEVCONNECT"
   - Bob sees Alice's transaction but cannot use her signature
   - Bob's address is 0xBob, so Alice's signature on hash(0xAlice) won't verify for hash(0xBob)
   - Bob must independently solve the puzzle to get "DEVCONNECT" and sign hash(0xBob)

**Security Properties:**

* **Solution Confidentiality:** Codeword never appears on-chain (only derived address)
* **Non-Transferability:** Signatures are bound to specific player addresses
* **Unlimited Attempts:** Players can retry without penalty (failed attempts don't reveal solution)
* **Transparent to Users:** Signature generation happens automatically in frontend
* **Standard Cryptography:** Uses well-established ECDSA/Schnorr signature schemes

**Implementation Notes for Starknet:**

* Use Starknet's native Pedersen or Poseidon hash for solution derivation
* Use Starknet's `secp256k1` or native signature verification
* Consider using `starknet-js` utilities: `ec.starkCurve.sign()` and signature recovery
* Message hash should follow Starknet typed data standards (SNIP-12)
* Test with both regular accounts and Argent/Braavos account contracts

**Deployment Setup:**

For each quest level, the game operator:
1. Chooses a codeword (e.g., "DEVCONNECT", "STARKNET", "CARTRIDGE")
2. Derives solution address: `address = walletFromSolution(codeword).address`
3. Stores solution address in LevelConfig at deployment
4. Never stores the codeword itself on-chain

**Alternative: Multi-Answer Support**

To support multiple valid codewords per level (e.g., synonyms or translations):
```cairo
#[dojo::model]
pub struct LevelConfig {
    #[key]
    pub level_number: u8,
    pub solution_addresses: Array<ContractAddress>,  // Multiple valid solutions
    // ...
}

// Verification checks if recovered address is in the array
assert(solution_addresses.contains(recovered_address), 'Wrong solution');
```

---

## 5) Data Models

### 5.1 Dojo Models

```cairo
// Adventure configuration and NFT contract reference
#[dojo::model]
pub struct AdventureConfig {
    #[key]
    pub game_id: u32,              // Always 0 for singleton
    pub nft_contract: ContractAddress,
    pub total_levels: u8,           // e.g., 6
}

// Player's minted NFT token_id
#[dojo::model]
pub struct PlayerToken {
    #[key]
    pub player: ContractAddress,
    pub token_id: u256,
}

// Level configuration (per level)
#[dojo::model]
pub struct LevelConfig {
    #[key]
    pub level_number: u8,
    pub level_type: felt252,           // 'game' or 'quest'
    pub verifier: ContractAddress,     // For game levels
    pub solution_address: ContractAddress,  // For quest levels (derived from codeword)
    pub active: bool,
}
```

### 5.2 NFT Contract Storage

```cairo
// Per-token progress tracking
struct AdventureProgress {
    username: felt252,
    mint_timestamp: u64,
    levels_completed: u256,  // Bitmap: bit N = level N complete
}
```

---

## 6) Contract Interfaces

### 6.1 Adventure Actions (Dojo Contract)

```cairo
trait IAdventureActions {
    // Player actions
    fn mint(username: felt252) -> u256;
    fn complete_level(token_id: u256, level_number: u8, proof_data: Span<felt252>);

    // View functions
    fn get_player_token_id(player: ContractAddress) -> u256;
    fn get_level_status(token_id: u256, level_number: u8) -> bool;
    fn get_progress(token_id: u256) -> u256; // Returns bitmap

    // Admin functions
    fn set_config(nft_contract: ContractAddress, total_levels: u8);
    fn set_level(level_number: u8, level_type: felt252, verifier: ContractAddress, solution_address: ContractAddress, active: bool);
}
```

### 6.2 Adventure Map NFT (ERC721 Contract)

```cairo
trait IAdventureMap {
    // Core ERC721
    fn mint(to: ContractAddress, username: felt252) -> u256;
    fn token_uri(token_id: u256) -> ByteArray;

    // Progress tracking (called by Dojo contract)
    fn complete_level(token_id: u256, level_number: u8);
    fn get_progress(token_id: u256) -> u256;
    fn get_username(token_id: u256) -> felt252;
}
```

---

## 7) Quest Dashboard & UI States

### 7.1 Overall Layout

* **Header:** Cartridge Controller connection, wallet address
* **Progress Summary:** "X of N levels complete" with visual progress bar
* **NFT Preview:** Live render of the Adventure Map showing current progress
* **Level Cards:** Grid of N cards (one per configured level)
* **Footer:** Social sharing, help/FAQ

### 7.2 Level Card States

Each level card displays:

**Locked State (Level N, when Level N-1 incomplete):**
* Grayed out appearance
* "🔒 Complete Level N-1 to unlock"
* No interactive elements

**Available State (Level N, when Level N-1 complete):**
* Full color, prominent display
* Level name and thematic description
* Instructions for completion
* Relevant action buttons (see below)

**Completed State:**
* "✓ Complete" badge
* Timestamp of completion
* Option to view completion transaction
* No interactive elements (actions disabled)

### 7.3 Level-Specific UI Elements

**Onchain Game Level:**
* "Play [Game Name]" button (opens game)
* Brief instructions: "Complete [objective] and return to submit"
* "Complete Level" button (visible after user indicates they're ready)
* Link to game rules/tutorial

**Community Hub Quest Level:**
* Location hint (e.g., "Find the community hub in the downtown district")
* Text input field for codeword entry
* "Submit Codeword" button
* Error message for incorrect codewords
* Optional: "Get Hint" button (reveals more specific location after delay)

---

## 8) Social Amplification

### 8.1 Share on X (Twitter)

* **"Share Progress"** button available after each level completion
* Precomposed message template:
  * "Just completed Level X of the Adventure at #DevConnect! [level_emoji] [nft_image_url] Play along at [adventure_url]"
* Opens user's X client compose window (no verification required)
* Optional: unique share images per level

### 8.2 Leaderboard (Optional v1 Feature)

* Display top N players by completion time
* Show total completion statistics (e.g., "1,234 adventurers have started")
* Filterable by level or overall completion

---

## 9) Administration & Configuration

### 9.1 Deployment Configuration

**Game Levels:**
* Register game contracts/identifiers
* Configure verification strategies per game
* Set success criteria and proof data requirements

**Quest Levels:**
* Choose codewords for each quest level
* Derive solution addresses from codewords (see §4.3.4)
* Store solution addresses in LevelConfig (never store codewords on-chain)
* Configure location hints and puzzle descriptions

**NFT Configuration:**
* Set total number of levels (N, configurable at deployment)
* Configure treasure map artwork SVG templates for N+1 visual states
* Set mint policies (one-per-wallet enforcement)

### 9.2 Runtime Administration

* Enable/disable specific levels (in case of issues)
* Update level configurations (with caution, may affect fairness)
* Monitor completion statistics
* Access to Dojo world permissions for model updates

---

## 10) Error Handling & Edge Cases

### 10.1 Common Errors

* **Not connected / wrong network**
  * Clear prompt to connect Cartridge Controller
  * Display current network and expected network

* **Attempting to mint more than one Adventure Map**
  * Check at contract level: `assert(balance_of(caller) == 0)`
  * UI should hide/disable mint button if already minted

* **Sequential progression violations**
  * Attempting to complete Level N when Level N-1 is incomplete
  * Contract rejects with clear error: "Must complete previous level first"
  * UI should lock/gray out unavailable levels

* **Incorrect game verification**
  * Failed proof verification for game levels
  * Clear feedback: "Challenge not completed. Please complete [specific objective] and try again."

* **Incorrect codewords**
  * Hash mismatch for quest levels
  * Clear feedback: "Incorrect codeword. Please try again."
  * Unlimited retries allowed

* **Already completed level**
  * Attempting to complete a level twice
  * UI should disable actions for completed levels
  * Contract rejects as safety check

### 10.2 Idempotency

* All level completion operations are **idempotent**
* Completing a level twice does not duplicate effects or fail unexpectedly
* Progress bitmaps handle repeated completions gracefully

### 10.3 Network Issues

* Handle transaction failures with retry prompts
* Display pending transaction states clearly
* Provide transaction hash links for verification

---

## 11) Accessibility & Usability

* **Responsive Design:** Mobile-first approach (many users will discover via QR codes on phones)
* **Keyboard Navigation:** All interactive elements keyboard-accessible
* **Readable Contrast:** WCAG AA compliance for text and buttons
* **Inline Help:** Tooltips and help text for each level's requirements
* **Progress Legibility:** Clear visual indicators (badges, colors, progress bars)
* **Loading States:** Skeleton screens and spinners during data fetching
* **Offline Handling:** Clear messaging when connectivity is lost

---

## 12) Technical Architecture

### 12.1 Frontend Stack

* **Framework:** Vite + React + TypeScript
* **Styling:** Tailwind CSS
* **Web3:** starknet-react for wallet connection
* **Cryptography:** starknet.js for signature generation and replay protection
* **State Management:** React Context + hooks
* **Cartridge Integration:** Cartridge Controller for authentication

### 12.2 Smart Contract Stack

* **Platform:** Starknet (Cairo)
* **Framework:** Dojo (for game logic and models)
* **NFT:** Standalone ERC721 contract with dynamic SVG metadata
* **Cryptography:** Native signature verification for replay protection (inspired by THC framework)
* **Network:** Development on Katana, deployment to Starknet mainnet

### 12.3 Data Flow

```
User Action (UI)
    ↓
starknet-react transaction
    ↓
Dojo Actions Contract
    ↓
Verification Logic (game-specific or codeword hash)
    ↓
NFT Contract Progress Update
    ↓
Event Emission
    ↓
UI State Refresh (polling or subscription)
```

### 12.4 Contract Deployment Flow

1. Deploy Adventure Map ERC721 contract
2. Deploy Dojo world and models
3. Deploy Actions contract
4. Configure actions contract with NFT address
5. Grant actions contract permission to update NFT progress
6. Configure all level configurations (games, codewords, verifiers)
7. Test end-to-end flows on Katana
8. Deploy to Starknet mainnet
9. Verify contracts and update frontend config

---

## 13) Non-Goals (Deferred or Out of Scope)

* **Twitter/X verification** of posts (share button opens compose window only, no callback)
* **Discord role assignment** or bot integrations
* **Offchain indexers** (Torii not used in v1; may be added for leaderboard features)
* **Time locks or delays** between level completions (all levels available once previous is complete)
* **Rewards or prizes** distribution (NFT completion is the reward; external rewards TBD)
* **Custom NFT rendering** per user (map design is standardized)
* **Multi-language support** (English only for v1)
* **Rate limiting** for incorrect solution attempts (unlimited retries allowed)

---

## 14) Success Criteria

Users can:
* Discover the adventure via QR codes at DevConnect
* Connect with Cartridge Controller seamlessly
* Mint exactly one Adventure Map NFT
* Complete each level with clear, self-serve flows
* See their NFT artwork update as levels are completed
* Visit community hubs and solve quests
* Share their progress on social media

System metrics:
* "Journey Complete" (N/N) state is attainable without manual intervention
* All interactions remain serverless (static frontend + contracts only)
* Average completion time per level is reasonable (≤10 minutes for games, ≤5 minutes for quests)
* Minimal transaction failures and clear error recovery paths
* System scales gracefully with different values of N (tested with various level counts)

---

## 15) Contingency Plan

**If development timeline is tight:**
* Reduce total level count (e.g., from 6 to 4 or even 3 levels)
* NFT visual states adjust automatically based on configured N
* Maintain same architecture and verification patterns
* System architecture supports easy expansion to more levels for future events

**If game partner availability is limited:**
* Reduce number of game levels
* Increase proportion of quest levels (e.g., from 3:3 ratio to 2:4 or 1:5)
* System supports any mix ratio without architectural changes
* Maintain overall experience arc

**If community hub access is restricted:**
* Convert quest levels to digital-only puzzles (no physical location requirement)
* Codewords distributed via alternative channels (social media, email, etc.)
* Maintain codeword verification mechanics
* Or increase game level proportion instead

**Architecture Advantage:**
The generalized N-level architecture allows these adjustments to be made via configuration changes only, with minimal code modifications required.

---

## 16) Future Enhancements (Post-v1)

* **Multi-answer support:** Allow multiple valid codewords per level (synonyms, translations)
* **Dynamic difficulty:** Adjust game challenges based on player performance
* **Team mode:** Allow groups to collaborate on levels
* **Community-created content:** Let participants submit quest ideas for future events
* **Cross-event persistence:** Reuse Adventure Map NFTs across multiple DevConnect events
* **Achievement system:** Additional badges for speed runs, perfect scores, etc.
* **Integration with other DevConnect quests:** Coordinate with other DIP implementations
* **Advanced leaderboards:** Real-time rankings, regional filters, social features
* **NFT marketplace integration:** Enable trading/showcasing of completed Adventure Maps

---

## Appendix A: Treasure Map Design Concepts

The Adventure Map NFT should evoke a sense of exploration and discovery. Visual progression should be clear and satisfying.

**Design Elements:**
* Hand-drawn or parchment-style aesthetic
* N distinct "waypoints" or "landmarks" representing configured levels
* Path connecting waypoints lights up as levels are completed
* Final state shows complete illuminated path with "treasure" at end
* Username integrated into map design (e.g., as "Adventurer: [username]")
* DevConnect branding (logo, color scheme)
* Design adapts to different values of N (supports 3-10+ levels gracefully)

**Technical Considerations:**
* SVG generation in Cairo (onchain)
* Moderate complexity to keep gas costs reasonable
* Easily updatable via bitmap progress tracking
* Responsive to both square and rectangular aspect ratios

---

## Appendix B: Development Phases

**Phase 1: Core Architecture (Weeks 1-2)**
* Set up project structure (client + contracts)
* Implement base NFT contract with dynamic SVG
* Implement Dojo models and basic actions
* Build dashboard UI skeleton

**Phase 2: Level Implementation (Weeks 3-4)**
* Implement game level verification system
* Implement quest level codeword system
* Build level-specific UI components
* Integration testing

**Phase 3: Game Partner Integration (Weeks 5-6)**
* Coordinate with selected FOCG game partners
* Implement custom verification strategies per game
* Test game completion flows end-to-end

**Phase 4: Quest Content & Community Hub Coordination (Weeks 6-7)**
* Work with DevConnect organizers to select community hubs
* Design puzzles and determine codewords
* Configure level hints and location clues

**Phase 5: Testing & Deployment (Week 8)**
* End-to-end testing on Katana
* Security review of contracts
* Deploy to Starknet mainnet
* Create QR codes and marketing materials

**Phase 6: Launch & Operations (DevConnect Event)**
* Monitor contract activity
* Provide on-site support
* Gather feedback for iterations

---

## Appendix C: Treasure Hunt Creator (THC) Framework Reference

The cryptographic replay protection mechanism used in this project is inspired by and adapted from the [Treasure Hunt Creator (THC)](https://github.com/social-dist0rtion-protocol/thc) framework developed by the Social Distortion Protocol team.

**THC Background:**

THC is a framework for creating decentralized treasure hunts on Ethereum, first deployed at 36C3 for the [Planetscape dystopian escape game](https://www.dist0rtion.com/2020/01/30/Planetscape-a-dystopian-escape-game-for-36C3/). The framework pioneered the use of ECDSA signature-based replay protection for puzzle solutions.

**Key Innovations from THC:**

1. **Solution-to-Address Derivation:** Solutions deterministically convert to Ethereum private keys, which derive unique addresses
2. **Player-Specific Signatures:** Each player must sign their own address using the solution-derived key
3. **On-Chain Verification:** Smart contracts verify signatures without ever seeing the plaintext solution
4. **Replay Protection:** Signatures are non-transferable between players due to address binding

**Adaptations for Starknet:**

* **Hash Function:** Using Starknet's Poseidon/Pedersen instead of Ethereum's Keccak256
* **Signature Scheme:** Using Starknet's native ECDSA/Schnorr signatures
* **Account Abstraction:** Compatible with Starknet account contracts (Argent, Braavos, Cartridge)
* **Typed Data:** Following SNIP-12 for structured message hashing
* **Framework Integration:** Integrated with Dojo for game state management

**Acknowledgments:**

We thank the THC team for their pioneering work on cryptographic treasure hunt mechanisms. Their open-source framework provided invaluable reference material for implementing secure, decentralized quest verification on Starknet.

**Related Resources:**

* THC Repository: https://github.com/social-dist0rtion-protocol/thc
* THC Replay Protection implementation: https://github.com/social-dist0rtion-protocol/thc/tree/master/lib
* THC Documentation: See `refs/thc/` submodule in this repository
* Original DIP: See `refs/DIPs/` submodule, specifically DIP-69 and DIP-4

---

*End of Specification*
