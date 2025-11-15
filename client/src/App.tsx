/**
 * FOCG Adventure App
 *
 * Main application component for the FOCG Adventure.
 * Manages authentication, NFT minting, and quest progression.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { ConnectWallet } from './components/ConnectWallet';
import { AdventureMintButton } from './components/AdventureMintButton';
import { AdventureQuestDashboard } from './components/AdventureQuestDashboard';
import { useAdventureProgress } from './hooks/useAdventureProgress';
import { ADVENTURE_LEVELS, ADVENTURE_TEXT, TOTAL_LEVELS } from './lib/adventureConfig';
import { AdventureProgress } from './lib/adventureTypes';

function AdventureApp() {
  const { address } = useAccount();
  const { progress: initialProgress, isLoading, hasNFT } = useAdventureProgress();
  const [progress, setProgress] = useState<AdventureProgress | null>(initialProgress);
  const [mapRefresh, setMapRefresh] = useState<(() => void) | null>(null);

  // Sync local state with hook progress
  useEffect(() => {
    if (initialProgress) {
      setProgress(initialProgress);
    }
  }, [initialProgress]);

  // Receive refetch function from OnChainMapNFT
  const handleRefetchReady = useCallback((refetch: () => void) => {
    setMapRefresh(() => refetch);
  }, []);

  // Handle level completion with optimistic update
  const handleLevelComplete = useCallback((levelNumber: number) => {
    setProgress((prev) => {
      if (!prev) return prev;

      // Check if already completed
      if (prev.levelsCompleted.includes(levelNumber)) {
        return prev;
      }

      // Optimistically update the progress state
      return {
        ...prev,
        levelsCompleted: [...prev.levelsCompleted, levelNumber],
        completionPercentage: ((prev.levelsCompleted.length + 1) / TOTAL_LEVELS) * 100,
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-void via-temple-shadow to-temple-dusk texture-grain">
      <div className="min-h-screen bg-temple-void/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="text-center lg:text-left">
                <h1 className="font-heading text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-temple-gold via-temple-ember to-temple-flame mb-2 relative"
                    style={{ filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.5)) drop-shadow(0 0 40px rgba(255, 107, 53, 0.3))' }}>
                  {ADVENTURE_TEXT.header.title}
                </h1>
                <p className="text-temple-parchment text-lg opacity-90" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)' }}>
                  {ADVENTURE_TEXT.header.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Connect Wallet */}
                <div className="w-64">
                  <ConnectWallet />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main>
            {address ? (
              isLoading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-temple-gold"></div>
                  <p className="text-temple-parchment mt-4 text-lg">{ADVENTURE_TEXT.loading.adventure}</p>
                </div>
              ) : !hasNFT ? (
                <div className="py-8">
                  <AdventureMintButton />
                </div>
              ) : progress ? (
                <AdventureQuestDashboard
                  progress={progress}
                  levels={ADVENTURE_LEVELS}
                  onLevelComplete={handleLevelComplete}
                  onMapRefresh={mapRefresh || undefined}
                  onRefetchReady={handleRefetchReady}
                />
              ) : (
                <div className="text-center py-20">
                  <div className="bg-red-500/20 border-2 border-red-400 rounded-lg p-8 max-w-lg mx-auto">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="font-heading text-2xl text-red-200 mb-4">
                      Unable to load adventure
                    </h2>
                    <p className="text-red-300 mb-6">
                      There was an error loading your progress. Please try refreshing the page.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-red-600 hover:bg-red-700 text-white font-ui font-semibold py-2 px-6 rounded-lg transition-colors uppercase tracking-wide"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="py-20">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="bg-gradient-to-br from-temple-mystic via-temple-seal to-temple-dusk text-white rounded-lg p-12 shadow-2xl border-2 border-temple-bronze/50 texture-parchment effect-embossed texture-grain relative overflow-hidden">
                    {/* Decorative corner ornaments */}
                    <div className="absolute top-3 left-3 w-12 h-12 border-l-2 border-t-2 border-temple-gold/30 rounded-tl"></div>
                    <div className="absolute top-3 right-3 w-12 h-12 border-r-2 border-t-2 border-temple-gold/30 rounded-tr"></div>
                    <div className="absolute bottom-3 left-3 w-12 h-12 border-l-2 border-b-2 border-temple-gold/30 rounded-bl"></div>
                    <div className="absolute bottom-3 right-3 w-12 h-12 border-r-2 border-b-2 border-temple-gold/30 rounded-br"></div>

                    <div className="relative">
                      <div className="text-7xl mb-6">⛩️</div>
                      <h2 className="font-heading text-3xl font-bold mb-4" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.3)' }}>
                        {ADVENTURE_TEXT.welcome.title}
                      </h2>
                      <p className="text-temple-parchment/90 text-lg mb-6 leading-relaxed" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)' }}>
                        {ADVENTURE_TEXT.welcome.description}
                      </p>
                      <p className="text-temple-gold/90 text-base font-semibold" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)' }}>
                        {ADVENTURE_TEXT.welcome.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="mt-20 text-center pb-8">
            <div className="flex flex-col items-center gap-4">
              <a
                href="https://book.dojoengine.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-temple-bronze hover:text-temple-gold transition-colors"
              >
                <span className="text-sm">Powered by</span>
                <img
                  src="/dojo-word.svg"
                  alt="Dojo"
                  className="h-5 opacity-90"
                />
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AdventureApp;
