/**
 * Leaderboard Page Component
 *
 * Displays a grid of all adventure maps sorted by progress.
 * Uses parallel batch loading for performance.
 */

import { useEffect } from 'react';
import { OnChainMapNFT } from './OnChainMapNFT';
import { useLeaderboard, LeaderboardEntry } from '../hooks/useLeaderboard';
import { ADVENTURE_TEXT } from '../lib/adventureConfig';
import { MAP_ADDRESS, CHAIN_ENV } from '../lib/config';

interface LeaderboardPageProps {
  onBack: () => void;
}

export function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const { entries, isLoading, progress, error, loadLeaderboard } = useLeaderboard();

  // Load leaderboard on mount
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-temple-dusk/40 rounded-lg p-6 shadow-xl border-2 border-temple-bronze backdrop-blur-sm relative overflow-hidden texture-stone effect-embossed texture-grain">
        <div className="absolute inset-0 bg-gradient-to-br from-temple-gold/20 to-transparent pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
              <span className="text-4xl glow-mystical">🏆</span>
              <h2 className="text-3xl font-bold text-temple-gold font-heading" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.4)' }}>
                {ADVENTURE_TEXT.leaderboard.title}
              </h2>
            </div>
            <p className="text-temple-parchment/80" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)' }}>
              {entries.length > 0 ? `${entries.length} adventurers on the journey` : 'Loading adventurers...'}
            </p>
          </div>

          <button
            onClick={onBack}
            className="bg-gradient-to-r from-temple-seal to-temple-mystic hover:from-temple-mystic hover:to-temple-seal text-white font-ui font-semibold py-2 px-6 rounded-lg transition-all border-2 border-temple-bronze/50 hover:border-temple-gold shadow-lg uppercase tracking-wide effect-raised relative overflow-hidden"
          >
            <span className="relative z-10">{ADVENTURE_TEXT.leaderboard.backButton}</span>
            <div className="absolute inset-0 effect-metallic pointer-events-none"></div>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && entries.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-temple-gold mb-4"></div>
          <p className="text-temple-parchment text-lg">{ADVENTURE_TEXT.leaderboard.loading}</p>
          {progress.current > 0 && (
            <p className="text-temple-parchment/70 text-sm mt-2">
              {ADVENTURE_TEXT.leaderboard.loadingProgress
                .replace('{current}', progress.current.toString())
                .replace('{total}', progress.total.toString())}
            </p>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border-2 border-red-400 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-200 mb-2">Failed to Load Leaderboard</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="bg-red-600 hover:bg-red-700 text-white font-ui font-semibold py-2 px-6 rounded-lg transition-colors uppercase tracking-wide"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && entries.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">⛩️</div>
          <p className="text-temple-parchment text-lg">{ADVENTURE_TEXT.leaderboard.noAdventures}</p>
        </div>
      )}

      {/* Leaderboard Grid */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {entries.map((entry, index) => (
            <LeaderboardEntryCard key={entry.tokenId} entry={entry} rank={index + 1} />
          ))}
        </div>
      )}

      {/* Loading More Indicator */}
      {isLoading && entries.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-temple-gold mb-2"></div>
          <p className="text-temple-parchment text-sm">
            {ADVENTURE_TEXT.leaderboard.loadingProgress
              .replace('{current}', progress.current.toString())
              .replace('{total}', progress.total.toString())}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Leaderboard Entry Card
 */
function LeaderboardEntryCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  // Rank medal/badge
  const getRankDisplay = () => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="bg-temple-dusk/40 rounded-lg p-3 shadow-xl border-2 border-temple-bronze backdrop-blur-sm relative overflow-hidden texture-stone effect-embossed texture-grain">
      {/* Rank Badge */}
      <div className="absolute -top-3 -right-3 z-10">
        <div className="bg-gradient-to-br from-temple-gold/90 to-temple-ember/90 w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-2 border-temple-bronze effect-raised">
          <span className="font-bold text-lg font-heading text-temple-void" style={{ textShadow: '0 0 4px rgba(212, 175, 55, 0.8)' }}>
            {getRankDisplay()}
          </span>
        </div>
      </div>

      {/* Map Preview Only */}
      <div className="relative">
        <OnChainMapNFT tokenId={entry.tokenId} />
      </div>
    </div>
  );
}
