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
      {/* Level Number Badge - Dark Fantasy Waypoint Marker */}
      <div className="absolute -top-3 -left-3 z-10">
        <div className="bg-gradient-to-br from-temple-bronze to-temple-gold text-temple-void w-8 h-8 rounded-full flex items-center justify-center shadow-xl border-2 border-temple-ember relative">
          <div className="absolute inset-0 rounded-full bg-temple-gold/20 animate-pulse"></div>
          <span className="font-bold text-sm font-heading relative z-10">{level.levelNumber}</span>
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
        <div className="absolute -bottom-2 right-4 bg-temple-shadow px-3 py-1 rounded-full shadow-lg border-2 border-temple-bronze/50">
          <p className="text-xs text-temple-gold font-semibold">
            {completedAt.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
