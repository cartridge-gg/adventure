/**
 * Quest Level Component
 *
 * Reusable component for quest challenges.
 * Handles codeword submission with cryptographic verification.
 */

import { useState } from 'react';
import { QuestLevelProps } from '../lib/adventureTypes';
import { ADVENTURE_TEXT, LEVEL_ICONS } from '../lib/adventureConfig';
import { usePuzzleSigning } from '../hooks/usePuzzleSigning';
import { useAdventureContract } from '../hooks/useAdventureContract';

export function QuestLevel({ level, status, tokenId, onComplete }: QuestLevelProps) {
  const [codeword, setCodeword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { generateSignature, playerAddress } = usePuzzleSigning();
  const { completePuzzleLevel } = useAdventureContract();

  // Show codewords in dev mode
  const isDevMode = import.meta.env.VITE_CHAIN === 'dev' || !import.meta.env.VITE_CHAIN;

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
          <div className="text-4xl mb-2">{LEVEL_ICONS.quest}</div>
          <p className="font-semibold text-lg font-heading">{level.name}</p>
          <p className="text-sm text-temple-moss mt-1">{ADVENTURE_TEXT.levelCard.waypointDiscovered}</p>
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
      <div className="bg-temple-jade/20 border-2 border-temple-gold rounded-lg p-6 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-temple-gold/20 to-transparent"></div>
        <div className="relative text-center text-temple-gold">
          <div className="text-5xl mb-3">{LEVEL_ICONS.quest}</div>
          <p className="font-bold text-xl font-heading">{ADVENTURE_TEXT.questLevel.success}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-temple-dusk/40 border-2 border-temple-bronze rounded-lg p-6 shadow-xl relative overflow-hidden backdrop-blur-sm texture-parchment effect-embossed texture-grain">
      {/* Mystical background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-temple-seal/20 to-transparent pointer-events-none"></div>

      {/* Decorative corner ornaments */}
      <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-temple-gold/30 rounded-tl"></div>
      <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-temple-gold/30 rounded-tr"></div>
      <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-temple-gold/30 rounded-bl"></div>
      <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-temple-gold/30 rounded-br"></div>

      <div className="relative">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl glow-mystical">{LEVEL_ICONS.quest}</span>
            <h3 className="text-xl font-bold text-temple-gold font-heading" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.4)' }}>{level.name}</h3>
          </div>
          <p className="text-temple-parchment/80" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)' }}>{level.description}</p>
        </div>

        {/* Location */}
        <div className="bg-temple-shadow/60 border-2 border-temple-seal/30 rounded-lg p-4 mb-4 effect-carved texture-stone">
          <h4 className="font-semibold text-temple-ember mb-2 flex items-center gap-2">
            <span>📍</span>
            <span>{ADVENTURE_TEXT.questLevel.locationHeader}</span>
          </h4>
          <p className="text-temple-parchment/70 text-sm italic">{level.location}</p>
        </div>

        {/* Dev Mode: Show Codeword */}
        {isDevMode && (
          <div className="bg-temple-ember/20 border-2 border-temple-gold/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔧</span>
              <h4 className="font-semibold text-temple-gold">Dev Mode</h4>
            </div>
            <p className="text-sm text-temple-parchment/70 mb-2">Test codeword:</p>
            <p className="font-mono text-lg font-bold text-temple-gold bg-temple-shadow px-3 py-2 rounded border border-temple-bronze/40">
              {level.expectedCodeword}
            </p>
          </div>
        )}

        {/* Codeword Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="codeword"
              type="text"
              value={codeword}
              onChange={(e) => setCodeword(e.target.value)}
              placeholder={ADVENTURE_TEXT.questLevel.codewordPlaceholder}
              disabled={isVerifying}
              className="w-full px-4 py-3 border-2 border-temple-bronze bg-temple-shadow/50 text-temple-parchment rounded-lg focus:border-temple-gold focus:outline-none disabled:opacity-50 text-lg font-mono uppercase placeholder:text-temple-bronze/50"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || !codeword.trim()}
            className="w-full bg-gradient-to-r from-temple-seal to-temple-mystic hover:from-temple-mystic hover:to-temple-seal disabled:from-temple-shadow disabled:to-temple-shadow text-white font-ui font-semibold py-3 px-4 rounded-lg transition-all border-2 border-temple-bronze/50 hover:border-temple-gold disabled:border-temple-dusk shadow-lg uppercase tracking-wide effect-raised relative overflow-hidden"
          >
            <span className="relative z-10">{isVerifying ? ADVENTURE_TEXT.questLevel.verifying : ADVENTURE_TEXT.questLevel.submitButton}</span>
            <div className="absolute inset-0 effect-metallic pointer-events-none"></div>
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-temple-ember/20 border-2 border-temple-flame/50 rounded-lg p-3">
            <p className="text-temple-flame text-sm font-semibold">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
