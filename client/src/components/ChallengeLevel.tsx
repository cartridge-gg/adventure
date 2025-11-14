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
  const { completeOnchainLevel } = useAdventureContract();

  const {
    sessions: gameSessions,
    isLoading: isLoadingTokens,
    error: tokensError,
    challenge,
    dojoConfig,
  } = useGameSessions(levelNumber);

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

        {/* Requirements */}
        <div className="bg-temple-shadow/60 border-2 border-temple-ember/30 rounded-lg p-4 mb-4 effect-carved texture-parchment">
          <h4 className="font-semibold text-temple-ember mb-2">{ADVENTURE_TEXT.gameLevel.trialHeader}</h4>
          <ul className="text-temple-parchment/70 text-sm space-y-1">
            {ADVENTURE_TEXT.gameLevel.trialInstructions.map((instruction, i) => (
              <li key={i}>• {instruction}</li>
            ))}
          </ul>
        </div>

      {/* Game Sessions */}
      {!dojoConfig ? (
        <div className="mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm text-center">
              <strong>Dev Mode:</strong> Playing external games is not available locally.
              Testing with pre-configured game_id=1 from deploy_katana.
            </p>
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Test Game Session:</h4>
          <GameSessionCard
            session={{
              token_id: '1',
              score: 0,
              game_over: true,
            }}
            adventureTokenId={tokenId}
            levelNumber={levelNumber}
            onSuccess={() => {
              setShowSuccess(true);
              setTimeout(() => onComplete(levelNumber), 1500);
            }}
          />
        </div>
      ) : isLoadingTokens ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="text-gray-600 text-center">Loading your game sessions...</p>
        </div>
      ) : tokensError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">Error loading games: {tokensError}</p>
        </div>
      ) : gameSessions.length > 0 ? (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Your Game Sessions:</h4>
          <div className="space-y-2">
            {gameSessions.map((session) => (
              <GameSessionCard
                key={session.token_id}
                session={session}
                adventureTokenId={tokenId}
                levelNumber={levelNumber}
                onSuccess={() => {
                  setShowSuccess(true);
                  setTimeout(() => onComplete(levelNumber), 1500);
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm text-center">
            <strong>Ready to start?</strong> Click "Start New Game" below to play <strong>{challenge.game}</strong>.
            Complete a game session, then return here to verify and unlock the next level!
          </p>
        </div>
      )}

      {/* Play Button - only shown when not in dev mode */}
      {dojoConfig && (
        <button
          onClick={handlePlayGame}
          className="w-full bg-gradient-to-r from-temple-ember to-temple-flame hover:from-temple-flame hover:to-temple-ember text-white font-ui font-semibold py-3 px-4 rounded-lg transition-all border-2 border-temple-bronze/50 hover:border-temple-gold shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide effect-raised relative overflow-hidden"
        >
          <span className="relative z-10">{gameSessions.length > 0 ? ADVENTURE_TEXT.gameLevel.continueButton : ADVENTURE_TEXT.gameLevel.playButton}</span>
          <span className="relative z-10">{LEVEL_ICONS.challenge}</span>
          <div className="absolute inset-0 effect-metallic pointer-events-none"></div>
        </button>
      )}
      </div>
    </div>
  );
}

/**
 * Individual Game Session Card (OPTIMIZED)
 *
 * Displays game session with state already fetched from Torii.
 * No additional contract calls needed!
 */
interface GameSessionCardProps {
  session: {
    token_id: string;
    score: number;
    game_over: boolean;
  };
  adventureTokenId: string;
  levelNumber: number;
  onSuccess: () => void;
}

function GameSessionCard({
  session,
  adventureTokenId,
  levelNumber,
  onSuccess,
}: GameSessionCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { completeOnchainLevel } = useAdventureContract();

  const { token_id, score, game_over: gameOver } = session;

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await completeOnchainLevel(
        adventureTokenId,
        levelNumber,
        { game_id: parseInt(token_id) }
      );

      if (result.success) {
        onSuccess();
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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-600">Game #{token_id.slice(0, 8)}...</span>
        </div>
        {gameOver && (
          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
            ✓ Complete
          </span>
        )}
      </div>

      <div className="text-sm text-gray-700 mb-2">
        <div>Score: <span className="font-semibold">{score.toLocaleString()}</span></div>
        <div>Status: <span className={gameOver ? 'text-green-600' : 'text-blue-600'}>
          {gameOver ? 'Complete' : 'In Progress'}
        </span></div>
      </div>

      {gameOver && (
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full bg-temple-jade hover:bg-temple-moss disabled:bg-temple-shadow text-white text-sm font-ui font-semibold py-2 px-3 rounded transition-colors border border-temple-bronze/30 uppercase tracking-wide"
        >
          {isVerifying ? ADVENTURE_TEXT.gameLevel.verifyingGuardian : ADVENTURE_TEXT.gameLevel.completeButton}
        </button>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
