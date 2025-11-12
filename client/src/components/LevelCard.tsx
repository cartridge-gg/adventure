/**
 * Level Card Component
 *
 * Wrapper component that renders the appropriate level type
 * (ChallengeLevel for games or QuestLevel for quests) based on configuration.
 */

import { LevelCardProps } from '../lib/adventureTypes';
import { ChallengeLevel } from './ChallengeLevel';
import { QuestLevel } from './QuestLevel';

export function LevelCard({ level, status, tokenId, onComplete, completedAt }: LevelCardProps) {
  return (
    <div className="relative">
      {/* Level Number Badge */}
      <div className="absolute -top-3 -left-3 z-10">
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <span className="font-bold text-lg">{level.levelNumber}</span>
        </div>
      </div>

      {/* Render appropriate level component */}
      {level.type === 'game' ? (
        <ChallengeLevel
          levelNumber={level.levelNumber}
          tokenId={tokenId}
          status={status}
          onComplete={onComplete}
        />
      ) : (
        <QuestLevel
          level={level}
          status={status}
          tokenId={tokenId}
          onComplete={onComplete}
        />
      )}

      {/* Completion timestamp */}
      {status === 'completed' && completedAt && (
        <div className="absolute -bottom-2 right-4 bg-white px-3 py-1 rounded-full shadow border border-gray-200">
          <p className="text-xs text-gray-600">
            {completedAt.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
