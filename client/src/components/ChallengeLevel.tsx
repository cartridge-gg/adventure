/**
 * Challenge Level Component
 *
 * Displays a challenge level that requires completing an external Dojo game.
 * Shows owned game sessions and allows verification of completion.
 */

import { useState } from 'react';
import { useAdventureContract } from '../hooks/useAdventureContract';
import { useGameSessions } from '../hooks/useGameSessions';
import { ADVENTURE_TEXT, LEVEL_ICONS } from '../lib/adventureConfig';

interface ChallengeLevelProps {
  levelNumber: number;
  tokenId: string;
  status: 'locked' | 'active' | 'completed';
  onComplete: (levelNumber: number) => void;
}

export function ChallengeLevel({ levelNumber, tokenId, status, onComplete }: ChallengeLevelProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { completeOnchainLevel } = useAdventureContract();

  const {
    sessions: gameSessions,
    isLoading: isLoadingTokens,
    error: tokensError,
    challenge,
    dojoConfig,
  } = useGameSessions(levelNumber);

  // Find first completed game session
  const completedSession = gameSessions.find(s => s.game_over);

  if (status === 'locked') {
    return (
      <div className="bg-temple-shadow border-2 border-temple-dusk rounded-lg p-6 opacity-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-temple-void/50 to-transparent"></div>
        <div className="relative text-center text-temple-bronze">
          <div className="text-4xl mb-2">🔒</div>
          <p className="font-semibold italic">{ADVENTURE_TEXT.levelCard.locked}</p>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="bg-temple-jade/20 border-2 border-temple-jade rounded-lg p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-temple-jade/10 to-transparent"></div>
        <div className="relative text-center text-temple-jade">
          <div className="text-4xl mb-2">{LEVEL_ICONS.challenge}</div>
          <p className="font-semibold text-lg font-heading">{challenge?.game || 'Trial Overcome'}</p>
          <p className="text-sm text-temple-moss mt-1">{ADVENTURE_TEXT.levelCard.sealBroken}</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="bg-temple-jade/20 border-2 border-temple-gold rounded-lg p-6 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-temple-gold/20 to-transparent"></div>
        <div className="relative text-center text-temple-gold">
          <div className="text-5xl mb-3">{LEVEL_ICONS.challenge}</div>
          <p className="font-bold text-xl font-heading">{ADVENTURE_TEXT.gameLevel.success}</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
        <p className="text-red-800">Challenge configuration not found for level {levelNumber}</p>
      </div>
    );
  }

  const handlePlayGame = () => {
    window.open(challenge.location, '_blank');
  };

  const handleBreakSeal = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      // Use test session in dev mode, otherwise use first completed session
      const gameId = dojoConfig ? parseInt(completedSession!.token_id) : 1;

      const result = await completeOnchainLevel(
        tokenId,
        levelNumber,
        { game_id: gameId }
      );

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => onComplete(levelNumber), 1500);
      } else {
        setError(result.error || 'Failed to verify completion');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-temple-dusk/40 border-2 border-temple-bronze rounded-lg p-6 shadow-xl relative overflow-hidden backdrop-blur-sm texture-stone effect-embossed texture-grain">
      {/* Mystical background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-temple-mystic/20 to-transparent pointer-events-none"></div>

      {/* Decorative corner ornaments */}
      <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-temple-ember/30 rounded-tl"></div>
      <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-temple-ember/30 rounded-tr"></div>
      <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-temple-ember/30 rounded-bl"></div>
      <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-temple-ember/30 rounded-br"></div>

      <div className="relative">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl glow-mystical">{LEVEL_ICONS.challenge}</span>
            <h3 className="text-xl font-bold text-temple-gold font-heading" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.4)' }}>{challenge.game}</h3>
          </div>
          <p className="text-temple-parchment/80" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)' }}>{challenge.description}</p>
        </div>

      {/* Status Messages */}
      {!dojoConfig && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm text-center">
            <strong>Dev Mode:</strong> Playing external games is not available locally.
            Testing with pre-configured game_id=1 from deploy_katana.
          </p>
        </div>
      )}

      {isLoadingTokens && dojoConfig && (
        <div className="bg-temple-shadow/60 border border-temple-bronze rounded-lg p-4 mb-4">
          <p className="text-temple-parchment text-center">Loading your game sessions...</p>
        </div>
      )}

      {tokensError && dojoConfig && (
        <div className="bg-temple-ember/20 border-2 border-temple-flame/50 rounded-lg p-4 mb-4">
          <p className="text-temple-flame text-sm text-center">Error loading games: {tokensError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Play Game Button */}
        <button
          onClick={handlePlayGame}
          className="flex-1 bg-gradient-to-r from-temple-ember to-temple-flame hover:from-temple-flame hover:to-temple-ember text-white font-ui font-semibold py-3 px-4 rounded-lg transition-all border-2 border-temple-bronze/50 hover:border-temple-gold shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide effect-raised relative overflow-hidden"
        >
          <span className="relative z-10">{ADVENTURE_TEXT.gameLevel.playButton}</span>
          <div className="absolute inset-0 effect-metallic pointer-events-none"></div>
        </button>

        {/* Break Seal Button - enabled only when there's a completed session */}
        <button
          onClick={handleBreakSeal}
          disabled={isVerifying || (dojoConfig && !completedSession)}
          className="flex-1 bg-gradient-to-r from-temple-seal to-temple-mystic hover:from-temple-mystic hover:to-temple-seal disabled:from-temple-shadow disabled:to-temple-shadow text-white font-ui font-semibold py-3 px-4 rounded-lg transition-all border-2 border-temple-bronze/50 hover:border-temple-gold disabled:border-temple-dusk shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide effect-raised relative overflow-hidden"
        >
          <span className="relative z-10">
            {isVerifying ? ADVENTURE_TEXT.gameLevel.verifying : 'Break Seal'}
          </span>
          <div className="absolute inset-0 effect-metallic pointer-events-none"></div>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-temple-ember/20 border-2 border-temple-flame/50 rounded-lg p-3">
          <p className="text-temple-flame text-sm font-semibold text-center">{error}</p>
        </div>
      )}
      </div>
    </div>
  );
}
