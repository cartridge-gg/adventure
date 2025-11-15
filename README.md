# FOCG Adventure

**A gamified quest platform combining onchain games, cryptographic puzzles, and dynamic NFTs on Starknet.**

Implementation of [DIP-69](https://github.com/efdevcon/DIPs/blob/master/DIPs/DIP-69.md) for DevConnect Argentina.

## Overview

FOCG Adventure creates an evolving treasure map NFT that tracks player progress through a multi-level adventure. Players complete sequential challenges by:

- **Challenge Levels**: Playing external Dojo games (NUMS, DopeWars, Loot Survivor)
- **Quest Levels**: Discovering codewords at physical or digital puzzle locations

As levels are completed, the on-chain NFT artwork dynamically updates, revealing new waypoints and connecting paths on the treasure map.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                      │
│  • Cartridge Controller wallet integration                  │
│  • Dynamic NFT display with progress tracking               │
│  • Challenge verification via Torii queries                 │
│  • Quest signature generation from codewords                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│             Actions Contract (Dojo System)                  │
│  • Level verification and progress updates                  │
│  • Sequential progression enforcement                       │
│  • NFT minting coordination                                 │
│  • Admin configuration management                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          AdventureMap NFT (ERC721 Contract)                 │
│  • On-chain SVG generation with dynamic artwork             │
│  • Progress tracking via 64-bit bitmap                      │
│  • Username and timestamp storage                           │
│  • Unique waypoint layouts per token                        │
└─────────────────────────────────────────────────────────────┘
```

### Contract Architecture

#### **AdventureMap NFT** (`contracts/src/token/map.cairo`)
Standard ERC721 with dynamic SVG metadata generation:
- **Progress Storage**: 64-bit bitmap (bit N = level N complete)
- **SVG Rendering**: On-chain treasure map with waypoints, paths, decorations
- **Personalization**: Username display, deterministic waypoint positioning
- **Authorization**: Only Actions contract can update progress

#### **Supporting Modules**
- **SVG Generator** (`svg.cairo`): Renders treasure map with progress-based styling
- **Geometry Engine** (`geo.cairo`): Fixed-point trigonometry, coordinate calculations
- **Art Assets** (`art.cairo`): SVG path data for visual elements

#### **Actions Contract** (`contracts/src/systems/actions.cairo`)
Dojo system coordinating game logic:
- **Minting**: One NFT per wallet, requires username
- **Challenge Verification**: Queries external game contracts via Denshokan interface
- **Quest Verification**: Validates signatures from codeword-derived keys
- **Sequential Progression**: Must complete level N-1 before level N

### Frontend Application

React application providing the player experience:

**Key Features:**
- **Wallet Integration**: Cartridge Controller with gasless transactions
- **Progress Dashboard**: Two-column layout (NFT map | level cards)
- **Challenge Levels**: Opens external games, verifies completion via Torii
- **Quest Levels**: Accepts codewords, generates cryptographic signatures
- **Dynamic Updates**: NFT artwork evolves as levels complete

**Tech Stack:**
- React 19 + TypeScript + Vite
- Starknet React + Cartridge Controller
- Tailwind CSS with custom theming
- Multi-environment support (Katana/Sepolia/Mainnet)

## Key Design Decisions

### 1. Separation of Concerns
- **NFT Contract**: Pure token management + progress storage (no game logic)
- **Actions Contract**: All validation and verification logic
- **Rationale**: Keeps NFT gas-efficient while allowing upgradeable game logic

### 2. Denshokan Game Integration
Challenge levels verify completion by calling `IMinigameTokenData.game_over(token_id)` on external game contracts:
- **Composability**: Any FOCG game implementing Denshokan can integrate
- **Decoupling**: Adventure system independent of specific game implementations
- **Frontend Query**: Torii SQL efficiently finds player's game session tokens

### 3. Cryptographic Puzzle Verification
Quest levels use signature-based verification:
1. Player discovers codeword at physical/digital location
2. Frontend derives solution key: `privateKey = hash(codeword)`
3. Frontend signs player's address with solution key
4. Contract verifies signature matches stored solution address

**Benefits:**
- **Replay Protection**: Each signature binds to specific player address
- **Zero Knowledge**: Codeword never sent to blockchain
- **Offline Distribution**: Puzzles can be placed anywhere

### 4. Bitmap Progress Tracking
Single `u64` value tracks up to 64 levels:
- **Gas Efficiency**: One storage slot vs. array/mapping
- **Sequential Enforcement**: Easy to check if level N-1 is complete
- **Formula**: Level N complete if `(progress & 2^N) != 0`

### 5. Dynamic NFT Generation
On-chain SVG rendering with progress-based updates:
- **Waypoints**: Change from question marks to checkmarks when complete
- **Paths**: Connect between consecutive completed waypoints
- **Finale**: Golden glow around dojo when all levels complete
- **Uniqueness**: Deterministic pseudo-random waypoint positions per token

## Repository Structure

```
focg-adventure/
├── contracts/              # Cairo smart contracts
│   ├── src/
│   │   ├── systems/
│   │   │   └── actions.cairo      # Main game logic
│   │   ├── token/
│   │   │   ├── map.cairo          # ERC721 NFT contract
│   │   │   ├── svg.cairo          # Dynamic SVG generation
│   │   │   ├── geo.cairo          # Geometry calculations
│   │   │   └── art.cairo          # SVG asset data
│   │   ├── models/        # Dojo configuration models
│   │   └── denshokan/     # Game interface definitions
│   ├── manifest_*.json    # Deployment manifests
│   └── Scarb.toml
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdventureMap.tsx   # Main dashboard
│   │   │   ├── ChallengeLevel.tsx # Game verification
│   │   │   └── QuestLevel.tsx     # Puzzle verification
│   │   ├── hooks/         # Contract interaction hooks
│   │   ├── lib/           # Utilities (signatures, queries)
│   │   └── App.tsx
│   └── package.json
│
├── spec/                   # Configuration files
│   ├── challenges.json     # Challenge level definitions
│   └── puzzles.json        # Quest level definitions
│
└── refs/                   # Git submodules for game manifests
    ├── nums/
    ├── dopewars/
    └── death-mountain/
```

## Development

### Prerequisites
- Scarb (Cairo package manager)
- Node.js 18+
- Starknet wallet (Cartridge Controller recommended)

### Running Locally

**Contracts:**
```bash
cd contracts
scarb build
scarb run deploy_katana  # Deploy to local Katana
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

**Environment Configuration:**
Set `VITE_CHAIN=dev` for local Katana, `sepolia` for testnet, or `mainnet` for production.

### Testing

**Contract Tests:**
```bash
cd contracts
scarb test
```

## Deployment

Contracts are deployed to Starknet mainnet and Sepolia testnet. Deployment manifests are in `contracts/manifest_*.json`.

**Challenge Integration:**
To integrate a new challenge level, add an entry to `spec/challenges.json` with:
- Denshokan-compatible game contract address
- Torii indexer URL for session queries
- Game metadata (name, location, minigame tag)

**Quest Creation:**
To create a new quest level, add an entry to `spec/puzzles.json` with:
- Solution address (derived from `getStarkKey(hash(codeword))`)
- Puzzle metadata (description, location hint)

## Technical Highlights

- **On-Chain SVG**: All NFT artwork generated in Cairo, no external storage
- **Fixed-Point Math**: Pre-computed sine tables for trigonometry without floating-point
- **Session-Based Transactions**: Cartridge Controller provides gasless UX
- **Cross-World Queries**: Torii SQL efficiently finds game completions across different Dojo worlds
- **Idempotent Verification**: Calling `complete_level()` multiple times is safe
- **Multi-Environment**: Single codebase supports local dev, testnet, and mainnet

## Security Considerations

- **Authorization**: Only Actions contract can modify NFT progress
- **One Per Wallet**: Balance check prevents multiple NFTs per player
- **Sequential Progression**: Cannot skip levels or complete out of order
- **Signature Binding**: Puzzle signatures tied to specific player address
- **No Replay Attacks**: Each codeword signature unique to player

## License

UNLICENSED

## Contact

kronovet@cartridge.gg
