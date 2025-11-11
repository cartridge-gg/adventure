/**
 * FOCG Adventure Configuration
 *
 * Dynamically loads level configuration from spec files.
 * Levels are automatically generated from spec/puzzles.json and spec/challenges.json.
 */

import { Level, OnchainGameLevel, IRLQuestLevel } from './adventureTypes';
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
    } as OnchainGameLevel;
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
    } as IRLQuestLevel;
  }

  // This shouldn't happen if the data is consistent
  throw new Error(`Level ${levelNum} not found in challenges or puzzles data`);
});

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
