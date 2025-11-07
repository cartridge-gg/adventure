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

  // Sync local state with hook progress
  useEffect(() => {
    if (initialProgress) {
      setProgress(initialProgress);
    }
  }, [initialProgress]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="min-h-screen bg-black/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="text-center lg:text-left">
                <h1 className="font-heading text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                  {ADVENTURE_TEXT.header.title}
                </h1>
                <p className="text-blue-200 text-lg">
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
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400"></div>
                  <p className="text-blue-200 mt-4 text-lg">Loading your adventure...</p>
                </div>
              ) : !hasNFT ? (
                <div className="py-8">
                  <AdventureMintButton onMintSuccess={() => {}} />
                </div>
              ) : progress ? (
                <AdventureQuestDashboard
                  progress={progress}
                  levels={ADVENTURE_LEVELS}
                  onLevelComplete={handleLevelComplete}
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
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="py-20">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-lg p-12 shadow-2xl">
                    <div className="text-7xl mb-6">🎮</div>
                    <h2 className="font-heading text-3xl font-bold mb-4">
                      Welcome to the FOCG Adventure
                    </h2>
                    <p className="text-blue-100 text-lg mb-8">
                      Connect your wallet to begin your journey through onchain games and real-world quests
                    </p>
                    <div className="bg-white/10 border border-white/30 rounded-lg p-6 text-left">
                      <h3 className="font-semibold mb-3">What you'll do:</h3>
                      <ul className="space-y-2 text-blue-100">
                        <li className="flex items-start gap-2">
                          <span>✨</span>
                          <span>Mint a dynamic Adventure Map NFT</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🎮</span>
                          <span>Complete onchain game challenges</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🗺️</span>
                          <span>Solve IRL quests at community hubs</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🏆</span>
                          <span>Watch your NFT evolve as you progress</span>
                        </li>
                      </ul>
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
                className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
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
