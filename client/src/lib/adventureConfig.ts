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
    } as QuestLevel;
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

export function getGameLevels(): ChallengeLevel[] {
  return ADVENTURE_LEVELS.filter(l => l.type === 'game') as ChallengeLevel[];
}

export function getQuestLevels(): QuestLevel[] {
  return ADVENTURE_LEVELS.filter(l => l.type === 'quest') as QuestLevel[];
}

// ============================================================================
// APP TEXT
// ============================================================================

export const ADVENTURE_TEXT = {
  header: {
    title: 'The Lost Temple Adventure',
    subtitle: 'Break seals and navigate waypoints to unlock ancient mysteries.',
  },
  mint: {
    title: 'Begin Your Journey',
    buttonText: 'Claim Your Wayfinder\'s Map',
  },
  levelCard: {
    locked: 'Previous waypoint must be discovered',
  },
  gameLevel: {
    playButton: 'Enter the Challenge',
    completeButton: 'Claim Victory',
    verifying: 'Verifying your trial...',
    success: 'Waypoint discovered!',
    error: 'The guardian rejects your proof. Try again.',
  },
  questLevel: {
    codewordLabel: 'Speak the Ancient Word',
    codewordPlaceholder: 'Enter the secret word...',
    submitButton: 'Submit to the Guardian',
    verifying: 'The guardian tests your knowledge...',
    success: 'The seal is broken!',
    error: 'The word is false. Seek the truth.',
  },
  errors: {
    generic: 'The path grows dark. Seek the way again.',
  },
};
