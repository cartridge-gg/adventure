# FOCG Adventure - Quick Start Guide

## 🚀 Get Started in 30 Seconds

### 1. Install Dependencies (if not already done)

```bash
cd client
pnpm install
```

### 2. Start the Development Server

```bash
pnpm dev
```

The app will open at `http://localhost:5173`

### 3. Test the Full User Flow

#### Step 1: Connect Wallet
- Click "Connect Wallet" button in the header
- Select Cartridge Controller or any Starknet wallet
- (In mock mode, connection will still work for UI testing)

#### Step 2: Mint Your Adventure Map
- Enter a username (e.g., "Adventurer")
- Click "Mint Adventure Map"
- Wait for the mock transaction (~800ms)
- You'll see your NFT with 0/6 levels complete

#### Step 3: Complete Level 1 (Game)
- Level 1 is automatically unlocked
- Read the instructions
- Click "Play Game" (opens in new tab)
- Click "Mark Complete" when ready
- Watch the success animation!
- See Level 2 unlock and your NFT update

#### Step 4: Complete Level 2 (Quest)
- Level 2 is now unlocked
- Read the location hint
- Enter the codeword: **DEVCONNECT**
- Click "Submit Codeword"
- Watch the success animation!
- See Level 3 unlock and your NFT update

#### Step 5: Continue Through All Levels

**Level 3 (Game)**: Mark Complete → Unlock Level 4
**Level 4 (Quest)**: Codeword is **STARKNET**
**Level 5 (Game)**: Mark Complete → Unlock Level 6
**Level 6 (Quest)**: Codeword is **CARTRIDGE**

#### Step 6: Complete the Journey!
- After Level 6, see the journey completion celebration 🏆
- Your NFT shows all waypoints completed
- Share your achievement on social media

### 4. Reset and Try Again

Click the "🔄 Reset (Dev)" button in the header to clear all progress and start over.

## 🎮 Testing Different Scenarios

### Test Error Handling

**Wrong Codeword**:
- Try entering a wrong codeword on any quest level
- You'll see an error message
- You can retry unlimited times

**Verification Failure** (Game):
- The mock always succeeds, but you can customize this in `src/lib/mock.ts`

### Test Sequential Progression

- Try to complete Level 2 before Level 1 (you can't!)
- Levels stay locked until previous level is complete
- The UI clearly shows which level is available

### Test NFT Updates

- Watch the NFT map update after each level
- Waypoints light up progressively
- Progress bar increases
- Level attributes update in the list

## 🔧 Customizing for Your Test

### Change Level Count

Edit `src/lib/adventureConfig.ts`:

```typescript
export const ADVENTURE_LEVELS: Level[] = [
  // Add or remove levels here
  // System automatically adapts to N levels
];
```

### Change Codewords

Edit the `expectedCodeword` field in any quest level:

```typescript
{
  levelNumber: 2,
  type: 'quest',
  expectedCodeword: 'YOUR_CODEWORD_HERE',
  // ...
}
```

### Change Mock Delay

Edit `src/lib/mock.ts`:

```typescript
const MOCK_DELAY = 1000; // Change to any value in milliseconds
```

### Customize UI Text

Edit `src/lib/adventureConfig.ts`:

```typescript
export const ADVENTURE_TEXT = {
  header: {
    title: 'Your Title',
    subtitle: 'Your Subtitle',
  },
  // ... customize any text
};
```

## 📱 Testing on Mobile

The app is fully responsive. Test on mobile by:

1. Start dev server: `pnpm dev`
2. On mobile, navigate to: `http://[YOUR_IP]:5173`
3. Or use `pnpm dev --host` to expose to network

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
pnpm dev --port 3000
```

### Build Errors

```bash
# Clean and reinstall
rm -rf node_modules dist
pnpm install
pnpm build
```

### Mock State Issues

Open browser console and run:
```javascript
// Check current state
console.log(window.__mockState);

// Or refresh the page
location.reload();
```

## 📊 Browser Console

The mock system logs all operations. Open DevTools console to see:

```
Configuration loaded:
  Environment: dev
  Chain ID: 0x4b4154414e41
  ...

[MOCK] Contract call: { ... }
[MOCK] Success: { ... }
[MOCK] Get level status: { ... }
```

## ✨ What to Look For

When testing, verify:

✅ **Visual Progression**: NFT map updates after each level
✅ **State Management**: Levels lock/unlock correctly
✅ **Error Handling**: Wrong codewords show clear error messages
✅ **Animations**: Smooth transitions between states
✅ **Responsive Design**: Works on desktop and mobile
✅ **User Feedback**: Clear instructions and feedback at every step

## 🎯 Demo Mode

For a quick demo:

1. Start the app
2. Connect wallet
3. Mint NFT with a fun username
4. Rapid-fire through all levels:
   - Level 1: Mark Complete
   - Level 2: DEVCONNECT
   - Level 3: Mark Complete
   - Level 4: STARKNET
   - Level 5: Mark Complete
   - Level 6: CARTRIDGE
5. Show the completion celebration!

Total demo time: ~2 minutes

## 📝 Next: Read the Full Documentation

See [ADVENTURE_IMPLEMENTATION.md](./ADVENTURE_IMPLEMENTATION.md) for complete documentation including:
- Architecture overview
- Component details
- Mock system documentation
- Integration with real contracts
- Customization guide

---

Happy adventuring! 🗺️✨
