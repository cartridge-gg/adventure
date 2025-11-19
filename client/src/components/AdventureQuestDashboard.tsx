/**
 * Adventure Quest Dashboard Component
 *
 * Main dashboard that displays all levels, progress, and the NFT preview.
 */

import { LevelCard } from './LevelCard';
import { AdventureMapNFT } from './AdventureMapNFT';
import { LeaderboardCard } from './LeaderboardCard';
import { QuestDashboardProps, LevelStatus } from '../lib/adventureTypes';

interface ExtendedQuestDashboardProps extends QuestDashboardProps {
  onNavigateToLeaderboard: () => void;
}

export function AdventureQuestDashboard({ progress, levels, onLevelComplete, onMapRefresh, onRefetchReady, onNavigateToLeaderboard }: ExtendedQuestDashboardProps) {
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
      {/* Main Content Grid - 5:7 ratio (map:levels) closest to 4:7 in 12-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: NFT Preview (5/12 width) */}
        <div className="lg:col-span-5">
          <div className="sticky top-4">
            <AdventureMapNFT progress={progress} onRefetchReady={onRefetchReady} />
          </div>
        </div>

        {/* Right Column: Level Cards (7/12 width) */}
        <div className="lg:col-span-7">
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
                  onMapRefresh={onMapRefresh}
                />
              );
            })}

            {/* Leaderboard Card */}
            <LeaderboardCard onNavigate={onNavigateToLeaderboard} />
          </div>
        </div>
      </div>
    </div>
  );
}
