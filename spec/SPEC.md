# The Rōnin's Pact — Feature Specification

> **Status:** FINAL IMPLEMENTATION
> **Architecture:** Vite + React frontend + Starknet contracts (Dojo + standalone ERC721)
> **Network:** Local Katana development → Starknet mainnet deployment

---

## 1) Goals

* Drive pre-jam engagement through a single, evolving participation NFT ("The Rōnin's Pact").
* Let participants complete three thematic trials (Technique, Wisdom, Spirit) with **self-serve, automatic onchain verification**.
* Provide a smooth, low-friction UX for new and existing Starknet users using Cartridge Controller.

---

## 2) User Experience

* Users connect with **Cartridge Controller**.
* Users mint **one** Rōnin's Pact NFT to their wallet (includes username).
* A **Quest Dashboard** shows three trials with real-time status and progress.
* As each trial is completed, the NFT artwork updates to light one of three slashes (dynamically generated SVG).
* When all trials are complete, the NFT displays the **"Fully Forged Pact"** state with golden glow.
* The UI includes a **"Share on X"** button (opens compose window; not verified).
* Trial 3 (Shin) requires waiting for a time lock period after minting.

---

## 3) Core Features

### 3.1 Authentication & Account

* Connect/disconnect via **Cartridge Controller**.
* Display the currently connected wallet address.
* Show signer selection UI for Trial 3 (see §3.4).

### 3.2 The Rōnin’s Pact (Dynamic NFT)

* **One-per-wallet** mint policy.
* NFT artwork has **four visual states**:

  * Base (0 slashes lit)
  * +Waza lit (1/3)
  * +Chi lit (2/3)
  * +Shin lit (3/3 “Fully Forged Pact”)
* NFT metadata displays **progress traits** (Waza/Chi/Shin: Complete/Incomplete).
* Artwork updates **automatically** when progress changes (no manual refresh).

### 3.3 Trial 1 — **Waza** (Technique)

* **Objective:** Prove play in a supported Dojo-powered game.
* **Verification:** User selects a specific allowlisted game collection and proves they own ≥1 token from it.
* **Implementation:**
  * User clicks "Claim via \[Game]" button for a specific collection.
  * Frontend calls `complete_waza(token_id, game_address)` on the Quest Manager contract.
  * Contract verifies:
    1. Game collection is allowlisted and active
    2. Caller owns the Pact token
    3. Caller owns ≥1 token from the specified game collection
  * On success, Waza is marked **Complete** in the NFT contract.
* **UI:**
  * Individual "Claim via \[Game]" buttons for each allowlisted collection.
  * Clear success/failure feedback.
  * Re-claim blocked once complete.
* **Allowlisted Collections:**
  * Loot Survivor 2 Adventurers
  * Loot Survivor 2 Beasts
  * Pistols at Dawn Duels
  * Bloberts
  * Ronin Pact (self-reference for testing)

### 3.4 Trial 2 — **Chi** (Wisdom)

* **Objective:** Demonstrate knowledge about Dojo 1.7 via a short quiz.
* **Quiz Format:**
  * 8 total questions about Dojo concepts (models, World contract, ECS, Torii, etc.)
  * Questions stored in `spec/chi.json` with pre-computed answer hashes
  * Frontend selects 3 questions to display
  * User must answer at least 3 correctly to pass
* **Implementation:**
  * User answers questions in the UI
  * Frontend hashes answers and submits to contract
  * Contract calls `complete_chi(token_id, questions, answers)` on Quest Manager
  * Contract verifies at least 3 answers match stored hashes
  * On success, Chi is marked **Complete** in NFT contract
* **UI:**
  * Inline questions with multiple choice answers
  * Single "Submit Quiz" button
  * Clear success/failure feedback
  * Unlimited retakes allowed
* **Sample Questions:**
  * "What is the primary role of the World contract in Dojo?"
  * "In Dojo 1.7, which traits must models derive?"
  * "What does the #\[key] attribute do in a Dojo model?"

### 3.5 Trial 3 — **Shin** (Spirit)

* **Objective:** Make a public vow and demonstrate commitment through a time lock.
* **Implementation:**
  * User must wait for a time lock period to elapse after minting their Pact NFT
  * Time lock duration is configurable (default: set at deployment)
  * User writes a vow message in the UI
  * Frontend hashes the vow text using Starknet's selector hash
  * Contract calls `complete_shin(token_id, vow_hash)` on Quest Manager
  * Contract verifies:
    1. Caller owns the Pact token
    2. Time lock period has elapsed since mint timestamp
    3. Vow hash is not empty
  * On success, Shin is marked **Complete** and vow hash is emitted as an event
* **UI:**
  * Text input for the vow message
  * Timer display showing remaining time until time lock expires
  * "Complete Vow" button (disabled until time lock expires)
  * Clear success/failure feedback
* **Time Lock:**
  * Calculated as: `current_time - mint_timestamp >= time_lock`
  * Prevents instant completion of all three trials
  * Encourages sustained engagement over time
* **Vow Storage:**
  * Vow hash is stored onchain in the `ShinCompleted` event
  * Full vow text is not stored (privacy + gas efficiency)
  * Vow hash serves as public commitment without revealing content

---

## 4) Quest Dashboard & States

* **Global Progress:** Show total completed trials (0/3 → 3/3).
* **Per-Trial Cards:** Each card displays:

  * Trial name, lore subtitle, and iconography.
  * Current state (Locked / In Progress / Completed).
  * Relevant action buttons:

    * Waza: “Claim via \[Game]”, “Try All”.
    * Chi: “Take Quiz / Submit”.
    * Shin: “Write Vow / Choose Signer / Complete Vow”.
* **NFT Preview:** Live render of the Pact artwork that reflects current progress.

---

## 5) Social Amplification (Optional)

* **Share on X** button:

  * Precomposed message with official hashtag and link.
  * Opens the user’s X client compose; **no** verification required.
* Encouraged in UI copy, but **not** required to complete any trial.

---

## 6) Administration & Configuration

* **Allowlisted collections** for Waza are configurable at deployment.
* **Quiz content** (questions and accepted answers) is configurable at deployment.
* **Quest timing** (start/end windows) can be defined as a product setting (optional for v1).

---

## 7) Error Handling & Edge Cases

* Clear, human-readable errors for:

  * Not connected / wrong network.
  * Attempting to mint more than one Pact.
  * Claiming Waza without owning an allowlisted token.
  * Incorrect quiz answers.
  * Missing or invalid signer GUID for Shin.
  * Signature failures and nonce reuse for Shin.
* UI disables or hides actions that are **already completed**.
* All states are **idempotent**: completing a trial twice does not duplicate effects.

---

## 8) Accessibility & Usability

* Keyboard-navigable UI; readable contrast.
* Inline help/tooltips for trial requirements.
* Progress is legible at a glance (badges, ticks, or color states).

---

## 9) Non-Goals (Implemented Simplifications)

* No Twitter/X verification of posts (share button opens compose window only).
* No Discord role assignment or bots.
* No offchain indexers (Torii not used in v1).
* No signer GUID verification or Controller integration (simplified to time lock).
* No "Try All" button for Waza trial (per-game verification only).
* No pseudo-random quiz question selection (frontend selects questions).
* No enforced one-per-wallet minting (application-level check only).
* No vow content stored onchain (only hash for commitment).

---

## 10) Success Criteria

* Users can:

  * Connect with Controller.
  * Mint exactly one Pact.
  * Complete each trial with clear, self-serve flows.
  * See their NFT artwork update as trials are completed.
* “Fully Forged Pact” state is attainable without manual admin intervention.
* All interactions remain serverless and function with only a static frontend plus contracts.
