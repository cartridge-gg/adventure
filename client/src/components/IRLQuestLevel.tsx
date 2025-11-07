/**
 * IRL Quest Level Component
 *
 * Reusable component for in-real-life quest challenges.
 * Handles codeword submission with cryptographic verification.
 */

import { useState } from 'react';
import { IRLQuestLevelProps } from '../lib/adventureTypes';
import { ADVENTURE_TEXT } from '../lib/adventureConfig';
import { usePuzzleSigning } from '../hooks/usePuzzleSigning';
import { useAdventureContract } from '../hooks/useAdventureContract';

export function IRLQuestLevel({ level, status, tokenId, onComplete }: IRLQuestLevelProps) {
  const [codeword, setCodeword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { generateSignature, playerAddress } = usePuzzleSigning();
  const { completePuzzleLevel } = useAdventureContract();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codeword.trim()) {
      setError('Please enter a codeword');
      return;
    }

    if (!playerAddress) {
      setError('Please connect your wallet');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Generate cryptographic signature from codeword
      const signature = generateSignature(codeword);

      if (!signature) {
        setError('Failed to generate signature. Please try again.');
        setIsVerifying(false);
        return;
      }

      console.log('[Puzzle] Generated signature:', {
        codeword: codeword.substring(0, 3) + '***', // Don't log full codeword
        signature,
        playerAddress
      });

      // Submit to contract
      const result = await completePuzzleLevel(
        tokenId,
        level.levelNumber,
        signature
      );

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onComplete(level.levelNumber);
        }, 1500);
      } else {
        setError(result.error || ADVENTURE_TEXT.questLevel.error);
        setCodeword(''); // Clear input on error
      }
    } catch (err) {
      console.error('[Puzzle] Error:', err);
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
          <p className="font-bold text-xl">{ADVENTURE_TEXT.questLevel.success}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-purple-400 rounded-lg p-6 shadow-md">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">🗺️</span>
          <h3 className="text-xl font-bold text-gray-900">{level.name}</h3>
        </div>
        <p className="text-gray-600">{level.description}</p>
      </div>

      {/* Location */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <span>📍</span>
          <span>Location:</span>
        </h4>
        <p className="text-purple-800 text-sm">{level.location}</p>
      </div>

      {/* Codeword Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="codeword" className="block text-sm font-semibold text-gray-700 mb-2">
            {ADVENTURE_TEXT.questLevel.codewordLabel}
          </label>
          <input
            id="codeword"
            type="text"
            value={codeword}
            onChange={(e) => setCodeword(e.target.value)}
            placeholder={ADVENTURE_TEXT.questLevel.codewordPlaceholder}
            disabled={isVerifying}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100 text-lg font-mono uppercase"
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={isVerifying || !codeword.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {isVerifying ? ADVENTURE_TEXT.questLevel.verifying : ADVENTURE_TEXT.questLevel.submitButton}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-300 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
