/**
 * FOCG Adventure Configuration
 *
 * This file contains the level configuration for the adventure.
 * It can be easily updated to add/remove/modify levels.
 */

import { Level, OnchainGameLevel, IRLQuestLevel } from './adventureTypes';

// ============================================================================
// SAMPLE LEVEL CONFIGURATION
// ============================================================================
// This is a 6-level adventure with alternating game and quest levels
// for demonstration purposes. Can be easily modified.

export const ADVENTURE_LEVELS: Level[] = [
  // Level 1: Onchain Game
  {
    levelNumber: 1,
    name: 'The First Trial',
    description: 'Complete your first onchain challenge to begin your adventure.',
    type: 'game',
    gameUrl: 'https://example.com/game1',
    gameInstructions: 'Score at least 100 points in the challenge game. Once you succeed, return here to claim completion.',
    verificationStrategy: 'score_threshold',
    successCriteria: 'Score ≥ 100 points',
  } as OnchainGameLevel,

  // Level 2: IRL Quest
  {
    levelNumber: 2,
    name: 'Discover the Hub',
    description: 'Find the first community hub and solve the puzzle.',
    type: 'quest',
    locationHint: 'Located in the downtown district near the main conference center.',
    puzzleDescription: 'Find the QR code at the community hub and solve the riddle to get the codeword.',
    expectedCodeword: 'DEVCONNECT',
  } as IRLQuestLevel,

  // Level 3: Onchain Game
  {
    levelNumber: 3,
    name: 'The Strategy Challenge',
    description: 'Test your strategic thinking in an onchain game.',
    type: 'game',
    gameUrl: 'https://example.com/game2',
    gameInstructions: 'Complete all 5 levels of the strategy game. Each level builds on the previous.',
    verificationStrategy: 'completion_check',
    successCriteria: 'Complete all levels',
  } as OnchainGameLevel,

  // Level 4: IRL Quest
  {
    levelNumber: 4,
    name: 'The Hidden Message',
    description: 'Decode the message at the second community hub.',
    type: 'quest',
    locationHint: 'Look for the building with the distinctive architecture in the tech quarter.',
    puzzleDescription: 'Use the cipher wheel at the hub to decode the hidden message.',
    expectedCodeword: 'STARKNET',
  } as IRLQuestLevel,

  // Level 5: Onchain Game
  {
    levelNumber: 5,
    name: 'The Final Challenge',
    description: 'Prove your skills in the ultimate onchain test.',
    type: 'game',
    gameUrl: 'https://example.com/game3',
    gameInstructions: 'Complete the advanced challenge. This is the hardest level yet!',
    verificationStrategy: 'achievement_unlock',
    successCriteria: 'Unlock "Master" achievement',
  } as OnchainGameLevel,

  // Level 6: IRL Quest
  {
    levelNumber: 6,
    name: 'Journey\'s End',
    description: 'Complete the final quest and claim your treasure.',
    type: 'quest',
    locationHint: 'Return to where your journey began, but look closer this time.',
    puzzleDescription: 'Combine all the clues from previous quests to solve the final puzzle.',
    expectedCodeword: 'CARTRIDGE',
  } as IRLQuestLevel,
];

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

export const TOTAL_LEVELS = ADVENTURE_LEVELS.length;

export function getLevelByNumber(levelNumber: number): Level | undefined {
  return ADVENTURE_LEVELS.find(l => l.levelNumber === levelNumber);
}

export function getGameLevels(): OnchainGameLevel[] {
  return ADVENTURE_LEVELS.filter(l => l.type === 'game') as OnchainGameLevel[];
}

export function getQuestLevels(): IRLQuestLevel[] {
  return ADVENTURE_LEVELS.filter(l => l.type === 'quest') as IRLQuestLevel[];
}

// ============================================================================
// APP TEXT
// ============================================================================

export const ADVENTURE_TEXT = {
  header: {
    title: 'FOCG Adventure',
    subtitle: 'Complete challenges and explore community hubs at DevConnect',
  },
  mint: {
    title: 'Begin Your Adventure',
    buttonText: 'Mint Adventure Map',
  },
  dashboard: {
    progressLabel: (completed: number, total: number) =>
      `${completed} of ${total} levels complete`,
    journeyComplete: '🎉 Journey Complete!',
    journeyCompleteSubtitle: 'You have completed all levels',
  },
  levelCard: {
    locked: '🔒 Complete previous level to unlock',
    available: 'Available',
    completed: '✓ Complete',
    completedAt: (date: Date) => `Completed ${date.toLocaleDateString()}`,
  },
  gameLevel: {
    playButton: 'Play Game',
    completeButton: 'Mark Complete',
    verifying: 'Verifying...',
    success: 'Level complete!',
    error: 'Verification failed. Please try again.',
  },
  questLevel: {
    codewordLabel: 'Enter Codeword',
    codewordPlaceholder: 'Enter the codeword...',
    submitButton: 'Submit Codeword',
    verifying: 'Verifying...',
    success: 'Quest complete!',
    error: 'Incorrect codeword. Try again.',
  },
  share: {
    buttonText: 'Share Progress',
    message: (level: number, name: string) =>
      `Just completed Level ${level}: ${name} of the FOCG Adventure! 🎮⛓️`,
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    walletNotConnected: 'Please connect your wallet',
    noNFT: 'You need to mint an Adventure Map NFT first',
  },
};
