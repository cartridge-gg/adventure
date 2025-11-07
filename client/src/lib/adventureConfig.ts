/**
 * FOCG Adventure Configuration
 *
 * This file contains the level configuration for the adventure.
 * It can be easily updated to add/remove/modify levels.
 */

import { Level, OnchainGameLevel, IRLQuestLevel } from './adventureTypes';
import puzzlesData from '../../../spec/puzzles.json';
import challengesData from '../../../spec/challenges.json';

// ============================================================================
// SAMPLE LEVEL CONFIGURATION
// ============================================================================
// This is a 6-level adventure with alternating game and quest levels
// for demonstration purposes. Can be easily modified.
// IRL Quest levels are loaded from spec/puzzles.json
// Onchain game levels are loaded from spec/challenges.json

// Map puzzles and challenges data to lookups by level number
const puzzlesMap = new Map(
  puzzlesData.puzzles.map(p => [p.level, p])
);
const challengesMap = new Map(
  challengesData.challenges.map(c => [c.level, c])
);

export const ADVENTURE_LEVELS: Level[] = [
  // Level 1: Onchain Game (from challenges.json)
  {
    levelNumber: 1,
    name: challengesMap.get(1)!.game,
    description: challengesMap.get(1)!.description,
    type: 'game',
    gameUrl: challengesMap.get(1)!.location,
    gameInstructions: `Play ${challengesMap.get(1)!.game} and score at least ${challengesMap.get(1)!.minimum_score} points. Once you succeed, return here to claim completion.`,
    verificationStrategy: 'score_threshold',
  } as OnchainGameLevel,

  // Level 2: IRL Quest (from puzzles.json)
  {
    levelNumber: 2,
    name: puzzlesMap.get(2)!.name,
    description: puzzlesMap.get(2)!.description,
    type: 'quest',
    location: puzzlesMap.get(2)!.location,
    puzzleDescription: puzzlesMap.get(2)!.description,
    expectedCodeword: puzzlesMap.get(2)!.codeword,
  } as IRLQuestLevel,

  // Level 3: Onchain Game (from challenges.json)
  {
    levelNumber: 3,
    name: challengesMap.get(3)!.game,
    description: challengesMap.get(3)!.description,
    type: 'game',
    gameUrl: challengesMap.get(3)!.location,
    gameInstructions: `Play ${challengesMap.get(3)!.game} and score at least ${challengesMap.get(3)!.minimum_score} points. Once you succeed, return here to claim completion.`,
    verificationStrategy: 'score_threshold',
  } as OnchainGameLevel,

  // Level 4: IRL Quest (from puzzles.json)
  {
    levelNumber: 4,
    name: puzzlesMap.get(4)!.name,
    description: puzzlesMap.get(4)!.description,
    type: 'quest',
    location: puzzlesMap.get(4)!.location,
    puzzleDescription: puzzlesMap.get(4)!.description,
    expectedCodeword: puzzlesMap.get(4)!.codeword,
  } as IRLQuestLevel,

  // Level 5: Onchain Game (from challenges.json)
  {
    levelNumber: 5,
    name: challengesMap.get(5)!.game,
    description: challengesMap.get(5)!.description,
    type: 'game',
    gameUrl: challengesMap.get(5)!.location,
    gameInstructions: `Play ${challengesMap.get(5)!.game} and score at least ${challengesMap.get(5)!.minimum_score} points. Once you succeed, return here to claim completion.`,
    verificationStrategy: 'score_threshold',
  } as OnchainGameLevel,

  // Level 6: IRL Quest (from puzzles.json)
  {
    levelNumber: 6,
    name: puzzlesMap.get(6)!.name,
    description: puzzlesMap.get(6)!.description,
    type: 'quest',
    location: puzzlesMap.get(6)!.location,
    puzzleDescription: puzzlesMap.get(6)!.description,
    expectedCodeword: puzzlesMap.get(6)!.codeword,
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
    buttonText: 'Mint Your Map',
  },
  levelCard: {
    locked: 'Complete previous level to unlock',
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
  errors: {
    generic: 'Something went wrong. Please try again.',
  },
};
