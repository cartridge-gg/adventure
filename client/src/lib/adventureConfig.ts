/**
 * FOCG Adventure Configuration
 *
 * This file contains the level configuration for the adventure.
 * It can be easily updated to add/remove/modify levels.
 */

import { Level, OnchainGameLevel, IRLQuestLevel } from './adventureTypes';
import questsData from '../../../spec/quests.json';

// ============================================================================
// SAMPLE LEVEL CONFIGURATION
// ============================================================================
// This is a 6-level adventure with alternating game and quest levels
// for demonstration purposes. Can be easily modified.
// IRL Quest levels are loaded from spec/quests.json

// Map quests data to a lookup by level number
const questsMap = new Map(
  questsData.quests.map(q => [q.level, q])
);

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

  // Level 2: IRL Quest (from quests.json)
  {
    levelNumber: 2,
    name: questsMap.get(2)!.name,
    description: questsMap.get(2)!.description,
    type: 'quest',
    locationHint: questsMap.get(2)!.location,
    puzzleDescription: questsMap.get(2)!.puzzle,
    expectedCodeword: questsMap.get(2)!.codeword,
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

  // Level 4: IRL Quest (from quests.json)
  {
    levelNumber: 4,
    name: questsMap.get(4)!.name,
    description: questsMap.get(4)!.description,
    type: 'quest',
    locationHint: questsMap.get(4)!.location,
    puzzleDescription: questsMap.get(4)!.puzzle,
    expectedCodeword: questsMap.get(4)!.codeword,
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

  // Level 6: IRL Quest (from quests.json)
  {
    levelNumber: 6,
    name: questsMap.get(6)!.name,
    description: questsMap.get(6)!.description,
    type: 'quest',
    locationHint: questsMap.get(6)!.location,
    puzzleDescription: questsMap.get(6)!.puzzle,
    expectedCodeword: questsMap.get(6)!.codeword,
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
