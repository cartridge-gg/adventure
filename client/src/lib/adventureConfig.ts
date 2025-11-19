/**
 * FOCG Adventure Configuration
 *
 * Dynamically loads level configuration from spec files.
 * Levels are automatically generated from spec/puzzles.json and spec/challenges.json.
 */

import { Level, ChallengeLevel, QuestLevel } from './adventureTypes';
import puzzlesData from '../../../spec/puzzles.json';
import challengesData from '../../../spec/challenges.json';

// ============================================================================
// DYNAMIC LEVEL CONFIGURATION
// ============================================================================
// Levels are automatically generated from spec files:
// - Challenge levels (type: 'game') from spec/challenges.json
// - Puzzle levels (type: 'quest') from spec/puzzles.json
// The levels are sorted by level number to create the final adventure sequence.

// Map puzzles and challenges data to lookups by level number
const puzzlesMap = new Map(
  puzzlesData.puzzles.map(p => [p.level, p])
);
const challengesMap = new Map(
  challengesData.challenges.map(c => [c.level, c])
);

// Get all level numbers from both sources
const allLevelNumbers = [
  ...puzzlesData.puzzles.map(p => p.level),
  ...challengesData.challenges.map(c => c.level),
].sort((a, b) => a - b);

// Dynamically build the ADVENTURE_LEVELS array
export const ADVENTURE_LEVELS: Level[] = allLevelNumbers.map((levelNum) => {
  // Check if this is a challenge level
  const challenge = challengesMap.get(levelNum);
  if (challenge) {
    return {
      levelNumber: levelNum,
      name: challenge.game,
      description: challenge.description,
      type: 'game',
      gameUrl: challenge.location,
      gameInstructions: `Play ${challenge.game} and complete a game session. Once you succeed, return here to claim completion.`,
      verificationStrategy: 'score_threshold',
      tip: challenge.tip, // Optional tip from spec file
    } as ChallengeLevel;
  }

  // Otherwise it's a puzzle level
  const puzzle = puzzlesMap.get(levelNum);
  if (puzzle) {
    return {
      levelNumber: levelNum,
      name: puzzle.name,
      description: puzzle.description,
      type: 'quest',
      location: puzzle.location,
      puzzleDescription: puzzle.description,
      expectedCodeword: puzzle.codeword,
      tip: puzzle.tip, // Optional tip from spec file
    } as QuestLevel;
  }

  // This shouldn't happen if the data is consistent
  throw new Error(`Level ${levelNum} not found in challenges or puzzles data`);
});

// ============================================================================
// LEVEL ICONS
// ============================================================================

export const LEVEL_ICONS = {
  challenge: '⚔️',  // Sword for game challenges
  quest: '🔮',      // Crystal ball for puzzle quests
} as const;

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

export const TOTAL_LEVELS = ADVENTURE_LEVELS.length;

// ============================================================================
// APP TEXT
// ============================================================================

export const ADVENTURE_TEXT = {
  header: {
    title: 'The Lost Temple ⛩️',
    subtitle: 'Break seals and navigate waypoints to unlock ancient mysteries',
  },
  mint: {
    title: 'Begin Your Journey',
    buttonText: 'Mint Your Adventure Map',
    nftDescription: 'is a dynamic NFT that updates as you complete levels.',
    whatAwaitsTitle: 'What Awaits',
    trials: {
      title: 'Ancient Trials',
      description: 'Break seals by completing challenges',
    },
    waypoints: {
      title: 'Hidden Waypoints',
      description: 'Discover codes in secret locations',
    },
  },
  welcome: {
    title: 'The Lost Temple Awaits',
    description: 'Break seals through trials of skill. Find hidden waypoints with secret codes. Your Adventure Map reveals the path forward.',
    subtitle: 'Connect your wallet to begin the journey',
  },
  levelCard: {
    locked: 'Locked',
    sealBroken: 'Seal Broken',
    waypointDiscovered: 'Waypoint Navigated',
  },
  gameLevel: {
    playButton: 'Play Game',
    continueButton: 'Return to Trial',
    completeButton: 'Claim Victory',
    breakSealButton: 'Break Seal',
    verifying: 'The Guardian judges...',
    success: 'The seal is broken!',
    error: 'The guardian rejects your attempt. Try again.',
    trialHeader: 'The Trial:',
    trialInstructions: [
      'Complete an ancient trial',
      'Return to claim your victory',
    ],
  },
  questLevel: {
    locationHeader: 'Waypoint Location:',
    codewordLabel: 'Discover the Hidden Code',
    codewordPlaceholder: 'Enter the code...',
    submitButton: 'Submit the Code',
    verifying: 'The Guardian judges...',
    success: 'Waypoint navigated!',
    error: 'The word is false. Seek the truth.',
  },
  map: {
    title: 'Adventure Map',
    completedTitle: 'You Found the Temple!',
    shareButton: 'Share Your Discovery',
    shareMessage: `⛩️ I finished the Lost Temple adventure!\n\nBegin your journey at adventure.cartridge.gg\n\n@cartridge_gg @ohayo_dojo @EFDevcon`,
  },
  leaderboard: {
    title: 'Leaderboard',
    viewButton: 'See Top Adventures',
    backButton: 'Back to Your Adventure',
    loading: 'Loading adventures...',
    loadingProgress: 'Loaded {current} of {total} adventures...',
    noAdventures: 'No adventures found yet. Be the first!',
    sortByProgress: 'Sort by Progress',
  },
  support: {
    text: 'Need help? Reach out on Telegram',
    url: 'https://t.me/kronosapiens',
  },
  loading: {
    adventure: 'Consulting the ancient maps...',
  },
  errors: {
    generic: 'The path grows dark. Seek the way again.',
  },
};
