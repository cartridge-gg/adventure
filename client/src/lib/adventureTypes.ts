/**
 * Type definitions for FOCG Adventure
 */

// ============================================================================
// LEVEL TYPES
// ============================================================================

export type LevelType = 'game' | 'quest';
export type LevelStatus = 'locked' | 'available' | 'completed';

/**
 * Base level configuration
 */
export interface BaseLevel {
  levelNumber: number;
  name: string;
  description: string;
  type: LevelType;
}

/**
 * Onchain game level configuration
 */
export interface OnchainGameLevel extends BaseLevel {
  type: 'game';
  gameUrl?: string;
  gameInstructions: string;
  verificationStrategy: string;
}

/**
 * IRL quest level configuration
 */
export interface IRLQuestLevel extends BaseLevel {
  type: 'quest';
  location: string;
  puzzleDescription: string;
  expectedCodeword: string; // For mock verification only
}

export type Level = OnchainGameLevel | IRLQuestLevel;

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface AdventureProgress {
  tokenId: string;
  username: string;
  levelsCompleted: number[]; // Array of completed level numbers
  totalLevels: number;
  completionPercentage: number;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface BaseLevelProps {
  level: Level;
  status: LevelStatus;
  tokenId: string;
  onComplete: (levelNumber: number) => void;
}

export interface OnchainGameLevelProps extends BaseLevelProps {
  level: OnchainGameLevel;
}

export interface IRLQuestLevelProps extends BaseLevelProps {
  level: IRLQuestLevel;
}

export interface LevelCardProps {
  level: Level;
  status: LevelStatus;
  tokenId: string;
  onComplete: (levelNumber: number) => void;
  completedAt?: Date;
}

export interface QuestDashboardProps {
  progress: AdventureProgress;
  levels: Level[];
  onLevelComplete: (levelNumber: number) => void;
}

// ============================================================================
// NFT
// ============================================================================

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}
