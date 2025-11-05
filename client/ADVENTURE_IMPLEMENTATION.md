# FOCG Adventure - Frontend Implementation

## Overview

A complete frontend implementation for the FOCG Adventure with reusable components, comprehensive mocking system, and full user flow support. The implementation follows the specification and provides a working client that can iterate without a backend.

## 🎯 What's Included

### Core Components

1. **AdventureMapNFT** (`src/components/AdventureMapNFT.tsx`)
   - Dynamic SVG treasure map visualization
   - Updates automatically as levels are completed
   - Shows progress with visual waypoints
   - Displays completion percentage and level attributes

2. **OnchainGameLevel** (`src/components/OnchainGameLevel.tsx`)
   - Reusable component for game challenges
   - Game launch functionality
   - Completion verification with mock contract calls
   - Clear success/error feedback

3. **IRLQuestLevel** (`src/components/IRLQuestLevel.tsx`)
   - Reusable component for IRL quests
   - Codeword input with validation
   - Location hints and puzzle descriptions
   - Cryptographic verification simulation

4. **LevelCard** (`src/components/LevelCard.tsx`)
   - Wrapper component for any level type
   - Handles locked/available/completed states
   - Level number badge
   - Completion timestamp display

5. **AdventureQuestDashboard** (`src/components/AdventureQuestDashboard.tsx`)
   - Main dashboard with progress tracking
   - NFT preview on left, levels on right
   - Journey completion celebration
   - Social sharing integration

6. **AdventureMintButton** (`src/components/AdventureMintButton.tsx`)
   - NFT minting interface with username input
   - Information about the adventure
   - Preview of what's ahead

### Mock System

**Location**: `src/lib/mock.ts`

A comprehensive mocking system that simulates all contract interactions:

```typescript
// Toggle between mock and real modes
export const USE_MOCK_MODE = true;

// Available mock functions
mockMintNFT(username)
mockCompleteLevel(tokenId, levelNumber, proofData)
mockGetPlayerTokenId(playerAddress)
mockGetLevelStatus(tokenId, levelNumber)
mockGetProgress(tokenId)
mockGetTokenURI(tokenId)
mockVerifyCodeword(tokenId, levelNumber, codeword, expectedCodeword)
```

**Key Features**:
- ✅ Simulates network latency (800ms default)
- ✅ Generates mock transaction hashes
- ✅ Maintains in-memory state
- ✅ Easily swappable for real contract calls
- ✅ Debug state inspection with `getMockState()`
- ✅ Reset functionality with `resetMockState()`

**Usage Pattern**:
```typescript
// Each function accepts the same arguments as real contracts
const result = await mockCompleteLevel(
  tokenId,
  levelNumber,
  proofData,
  mockResponse // Optional: customize response
);

if (result.success) {
  // Handle success
  console.log('Transaction hash:', result.txHash);
} else {
  // Handle error
  console.error('Error:', result.error);
}
```

### Type System

**Location**: `src/lib/adventureTypes.ts`

Comprehensive TypeScript types for:
- Level configurations (OnchainGameLevel, IRLQuestLevel)
- Progress tracking (AdventureProgress)
- Component props
- NFT metadata

### Configuration

**Location**: `src/lib/adventureConfig.ts`

- Sample 6-level adventure (3 games + 3 quests)
- Easily modifiable level configuration
- All UI text in one place (`ADVENTURE_TEXT`)
- Helper functions for level management

**Example Level Configuration**:
```typescript
{
  levelNumber: 1,
  name: 'The First Trial',
  description: 'Complete your first onchain challenge',
  type: 'game',
  gameUrl: 'https://example.com/game1',
  gameInstructions: 'Score at least 100 points...',
  verificationStrategy: 'score_threshold',
  successCriteria: 'Score ≥ 100 points',
}
```

### Hooks

**Location**: `src/hooks/useAdventureProgress.ts`

Custom hook for managing adventure progress:
```typescript
const { progress, isLoading, hasNFT, error, refetch } = useAdventureProgress();
```

## 🚀 Running the Application

### Start Development Server

```bash
cd client
pnpm dev
```

The app will start at `http://localhost:5173`

### Build for Production

```bash
pnpm build
```

## 🎮 User Flow

### 1. Initial State (No Wallet)
- Welcome screen with adventure overview
- Clear call-to-action to connect wallet

### 2. Connected (No NFT)
- Mint screen with username input
- Information about the adventure
- Preview of challenges ahead

### 3. NFT Minted
- Full dashboard with all levels
- NFT preview showing progress
- Sequential level unlocking

### 4. Completing Levels

**Onchain Game Levels**:
1. View instructions and success criteria
2. Click "Play Game" to open game in new tab
3. Complete the challenge
4. Return and click "Mark Complete"
5. Verification happens via mock
6. Success animation and next level unlocks

**IRL Quest Levels**:
1. Read location hint and puzzle description
2. Visit community hub (in real life)
3. Solve puzzle to get codeword
4. Enter codeword in the input field
5. Click "Submit Codeword"
6. Verification happens via mock
7. Success animation and next level unlocks

### 5. Journey Complete
- Celebration banner
- Complete NFT with all waypoints
- Social sharing button

## 🔧 Customization

### Adding/Modifying Levels

Edit `src/lib/adventureConfig.ts`:

```typescript
export const ADVENTURE_LEVELS: Level[] = [
  {
    levelNumber: 1,
    name: 'Your Level Name',
    description: 'Level description',
    type: 'game', // or 'quest'
    // ... level-specific fields
  },
  // Add more levels...
];
```

### Changing Mock Behavior

Edit `src/lib/mock.ts`:

```typescript
// Adjust delay
const MOCK_DELAY = 1000; // milliseconds

// Customize responses
const result = await mockCompleteLevel(
  tokenId,
  levelNumber,
  proofData,
  { success: false, error: 'Custom error message' } // Custom response
);
```

### Updating UI Text

Edit `src/lib/adventureConfig.ts`:

```typescript
export const ADVENTURE_TEXT = {
  header: {
    title: 'Your Custom Title',
    subtitle: 'Your custom subtitle',
  },
  // ... more text configurations
};
```

## 🔄 Switching to Real Contract Calls

When ready to integrate with actual contracts:

1. Set `USE_MOCK_MODE = false` in `src/lib/mock.ts`
2. Create a new file `src/lib/contracts.ts` with real implementations
3. Replace mock imports with contract imports in components
4. Each mock function has the same signature as expected contract calls

Example:
```typescript
// Before (mock)
import { mockCompleteLevel } from '../lib/mock';

// After (real)
import { completeLevel } from '../lib/contracts';
```

## 📁 File Structure

```
client/src/
├── AdventureApp.tsx              # Main app component
├── main.tsx                       # Entry point
├── components/
│   ├── AdventureMapNFT.tsx       # NFT preview with SVG map
│   ├── OnchainGameLevel.tsx      # Game level component
│   ├── IRLQuestLevel.tsx         # Quest level component
│   ├── LevelCard.tsx             # Level wrapper
│   ├── AdventureQuestDashboard.tsx  # Main dashboard
│   ├── AdventureMintButton.tsx   # Mint interface
│   ├── ConnectWallet.tsx         # (existing)
│   └── StarknetProvider.tsx      # (existing)
├── hooks/
│   └── useAdventureProgress.ts   # Progress management hook
└── lib/
    ├── mock.ts                    # Mock contract system
    ├── adventureTypes.ts          # Type definitions
    ├── adventureConfig.ts         # Configuration & text
    └── config.ts                  # (existing) Chain config
```

## 🎨 Styling

The app uses:
- **Tailwind CSS** for styling
- **Gradient backgrounds** for visual appeal
- **Responsive design** (mobile-first)
- **Smooth animations** for state transitions
- **Color coding**:
  - Purple/Blue for game levels
  - Purple for quest levels
  - Green for completed states
  - Gray for locked states
  - Amber/Gold for NFT and progress

## 🐛 Development Tools

### Mock State Inspection

```typescript
import { getMockState } from './lib/mock';

const state = getMockState();
console.log('Current state:', state);
// {
//   playerTokenId: "123456",
//   levelsCompleted: Set(3) { 1, 2, 3 },
//   username: "Adventurer"
// }
```

### Reset Button

A "🔄 Reset (Dev)" button appears in the header when `USE_MOCK_MODE = true`. Click it to reset all progress and start fresh.

### Browser Console Logging

All mock contract calls are logged to console:
```
[MOCK] Contract call: { contract: '0x...', entrypoint: 'mint', calldata: {...} }
[MOCK] Success: { data: {...}, txHash: '0x...' }
```

## ✨ Features

✅ Complete user flow from wallet connection to journey completion
✅ Sequential level progression (must complete N to unlock N+1)
✅ Dynamic NFT that updates as you progress
✅ Two distinct level types (games and quests)
✅ Codeword verification for IRL quests
✅ Social sharing integration
✅ Progress persistence (via mock state)
✅ Error handling and retry mechanisms
✅ Loading states and animations
✅ Responsive design
✅ TypeScript type safety
✅ Mock mode indicator
✅ Development reset button

## 🚧 Next Steps

1. **Integrate with real contracts**:
   - Implement actual Dojo actions
   - Connect to NFT contract
   - Add signature verification for quests

2. **Add game integrations**:
   - Connect to specific FOCG games
   - Implement verification strategies
   - Add game-specific proof data

3. **Enhance NFT rendering**:
   - Replace mock SVG with contract-generated SVG
   - Add more visual states
   - Implement metadata fetching

4. **Add features**:
   - Leaderboard
   - Achievement system
   - Multi-language support

## 📝 Notes

- All components are reusable and configurable
- Mock system is designed for easy replacement
- Type system ensures type safety throughout
- Configuration is centralized for easy updates
- Build succeeds with no TypeScript errors
- Ready for production deployment (with real contracts)

## 🎉 Success!

You now have a fully working FOCG Adventure frontend that you can:
- Click through the entire adventure
- Test all user flows
- Iterate on design and UX
- Demo to stakeholders
- Use as a foundation for real contract integration

Enjoy exploring the adventure! 🗺️✨
