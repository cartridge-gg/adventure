# Dashboard and UI Components

This directory contains the main dashboard and UI components for The Ronin's Pact frontend.

## Components

### QuestDashboard

Main dashboard component that orchestrates the entire quest experience.

**Props:**
- `progress: TrialProgress` - Current trial completion status
- `trialState: TrialState` - Current state of each trial (locked/available/in_progress/completed)
- `onCompleteWaza: () => void` - Callback when Waza trial is completed
- `onCompleteChi: () => void` - Callback when Chi trial is completed
- `onCompleteShin: () => void` - Callback when Shin trial is completed
- `wazaContent?: React.ReactNode` - Custom content to render inside Waza trial card
- `chiContent?: React.ReactNode` - Custom content to render inside Chi trial card
- `shinContent?: React.ReactNode` - Custom content to render inside Shin trial card

**Features:**
- Shows overall progress (X/3 trials complete)
- Responsive grid layout (single column on mobile, 3-column on desktop)
- Sticky NFT preview on desktop
- Celebratory message when all trials are complete

### TrialCard

Reusable card component for individual trials.

**Props:**
- `trialName: 'waza' | 'chi' | 'shin'` - Which trial this card represents
- `status: TrialStatus` - Current status (locked/available/in_progress/completed)
- `progress: TrialProgress` - Overall progress object
- `onComplete: () => void` - Callback when trial is completed
- `children?: React.ReactNode` - Custom trial-specific content

**Features:**
- Automatically displays trial name, subtitle, and description from constants
- Shows status badge with appropriate styling
- Handles locked state with placeholder message
- Shows completion message when trial is done
- Renders custom trial components via children prop

### NFTPreview

Visual representation of the evolving NFT.

**Props:**
- `progress: TrialProgress` - Current trial completion status

**Features:**
- Shows three "slashes" that light up as trials are completed
- Animated transitions when progress changes
- Visual glow effect when all trials are complete
- Progress counter (X/3)
- Status text that changes based on progress
- Individual trial indicators at bottom

### ShareButton

Social sharing button for Twitter/X.

**Props:**
- `progress: TrialProgress` - Current trial completion status

**Features:**
- Generates custom message based on progress level
- Opens Twitter compose in new window
- Includes hashtags and URL from constants
- Styled consistently with app theme
- Hover and active states

## Usage Example

```tsx
import { QuestDashboard } from '@/components';
import { WazaTrial, ChiTrial, ShinTrial } from '@/components/trials';
import { useTrialProgress } from '@/hooks/useTrialProgress';

function App() {
  const { progress, trialState, completeWaza, completeChi, completeShin } = useTrialProgress();

  return (
    <QuestDashboard
      progress={progress}
      trialState={trialState}
      onCompleteWaza={completeWaza}
      onCompleteChi={completeChi}
      onCompleteShin={completeShin}
      wazaContent={<WazaTrial onComplete={completeWaza} />}
      chiContent={<ChiTrial onComplete={completeChi} />}
      shinContent={<ShinTrial onComplete={completeShin} />}
    />
  );
}
```

## Styling

All components use Tailwind CSS with the ronin color scheme:
- `ronin-primary`: #E63946 (red)
- `ronin-secondary`: #F1FAEE (off-white)
- `ronin-accent`: #A8DADC (light blue)
- `ronin-dark`: #1D3557 (dark blue)
- `ronin-light`: #457B9D (medium blue)

## Responsive Design

- Mobile: Single column layout
- Desktop (lg breakpoint): 3-column grid with sticky NFT preview

## State Management

Components are designed to be controlled from the parent level. They receive:
- Current progress state
- Trial status information
- Callback functions for completions
- Custom content via children/props

This allows for flexible integration with various state management solutions (hooks, context, Redux, etc.).
