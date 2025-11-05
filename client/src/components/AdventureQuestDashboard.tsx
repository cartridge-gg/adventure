/**
 * Adventure Quest Dashboard Component
 *
 * Main dashboard that displays all levels, progress, and the NFT preview.
 */

import { QuestDashboardProps, LevelStatus } from '../lib/adventureTypes';
import { LevelCard } from './LevelCard';
import { AdventureMapNFT } from './AdventureMapNFT';

export function AdventureQuestDashboard({ progress, levels, onLevelComplete }: QuestDashboardProps) {
  // Determine status for each level
  const getLevelStatus = (levelNumber: number): LevelStatus => {
    if (progress.levelsCompleted.includes(levelNumber)) {
      return 'completed';
    }
    if (levelNumber === 1 || progress.levelsCompleted.includes(levelNumber - 1)) {
      return 'available';
    }
    return 'locked';
  };

  return (
    <div className="space-y-8">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: NFT Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <AdventureMapNFT progress={progress} />
          </div>
        </div>

        {/* Right Column: Level Cards */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {levels.map((level) => {
              const status = getLevelStatus(level.levelNumber);
              return (
                <LevelCard
                  key={level.levelNumber}
                  level={level}
                  status={status}
                  tokenId={progress.tokenId}
                  onComplete={onLevelComplete}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
