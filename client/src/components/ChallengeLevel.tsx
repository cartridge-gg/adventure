/**
 * Challenge Level Component
 *
 * Displays a challenge level that requires completing an external Dojo game.
 * Shows owned game sessions and allows verification of completion.
 */

import { useState } from 'react';
import { useAdventureContract } from '../hooks/useAdventureContract';
import { useGameSessions } from '../hooks/useGameSessions';
import { ADVENTURE_TEXT } from '../lib/adventureConfig';

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
      <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6 opacity-60">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🔒</div>
          <p className="font-semibold">{ADVENTURE_TEXT.levelCard.locked}</p>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
        <div className="text-center text-green-700">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-semibold text-lg">{challenge?.game || 'Challenge Complete'}</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 animate-pulse">
        <div className="text-center text-green-700">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-bold text-xl">{ADVENTURE_TEXT.gameLevel.success}</p>
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
    <div className="bg-white border-2 border-purple-400 rounded-lg p-6 shadow-md">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">🎮</span>
          <h3 className="text-xl font-bold text-gray-900">{challenge.game}</h3>
        </div>
        <p className="text-gray-600">{challenge.description}</p>
      </div>

      {/* Requirements */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-purple-900 mb-2">Requirements:</h4>
        <ul className="text-purple-800 text-sm space-y-1">
          <li>• Complete a game session</li>
          <li>• Verify completion to unlock next level</li>
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
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>{gameSessions.length > 0 ? 'Continue Playing' : 'Start New Game'}</span>
          <span>🚀</span>
        </button>
      )}
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
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold py-2 px-3 rounded transition-colors"
        >
          {isVerifying ? 'Verifying...' : 'Mark Complete'}
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
