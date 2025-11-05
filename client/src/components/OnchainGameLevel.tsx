/**
 * Onchain Game Level Component
 *
 * Reusable component for onchain game challenges.
 * Handles game launching and completion verification.
 */

import { useState } from 'react';
import { OnchainGameLevelProps } from '../lib/adventureTypes';
import { mockCompleteLevel } from '../lib/mock';
import { ADVENTURE_TEXT } from '../lib/adventureConfig';

export function OnchainGameLevel({ level, status, tokenId, onComplete }: OnchainGameLevelProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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
          <p className="font-semibold text-lg">{level.name}</p>
        </div>
      </div>
    );
  }

  const handlePlayGame = () => {
    if (level.gameUrl) {
      window.open(level.gameUrl, '_blank');
    }
  };

  const handleCompleteLevel = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await mockCompleteLevel(
        tokenId,
        level.levelNumber,
        { strategy: level.verificationStrategy }
      );

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onComplete(level.levelNumber);
        }, 1500);
      } else {
        setError(result.error || ADVENTURE_TEXT.gameLevel.error);
      }
    } catch (err) {
      setError(ADVENTURE_TEXT.errors.generic);
    } finally {
      setIsVerifying(false);
    }
  };

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

  return (
    <div className="bg-white border-2 border-blue-400 rounded-lg p-6 shadow-md">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">🎮</span>
          <h3 className="text-xl font-bold text-gray-900">{level.name}</h3>
        </div>
        <p className="text-gray-600">{level.description}</p>
      </div>

      {/* Game Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
        <p className="text-blue-800 text-sm">{level.gameInstructions}</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {level.gameUrl && (
          <button
            onClick={handlePlayGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>{ADVENTURE_TEXT.gameLevel.playButton}</span>
            <span>🚀</span>
          </button>
        )}

        <button
          onClick={handleCompleteLevel}
          disabled={isVerifying}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {isVerifying ? ADVENTURE_TEXT.gameLevel.verifying : ADVENTURE_TEXT.gameLevel.completeButton}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-300 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
