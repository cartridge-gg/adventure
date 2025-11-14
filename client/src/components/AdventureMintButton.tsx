/**
 * Adventure Mint Button Component
 *
 * Allows users to mint their Adventure Map NFT to begin the journey.
 */

import { useState, useEffect } from 'react';
import { useAccount, useConnect } from '@starknet-react/core';
import { ControllerConnector } from '@cartridge/connector';
import { ADVENTURE_TEXT } from '../lib/adventureConfig';
import { useAdventureContract } from '../hooks/useAdventureContract';

interface AdventureMintButtonProps {
  onMintSuccess: () => void;
}

export function AdventureMintButton({ onMintSuccess }: AdventureMintButtonProps) {
  const { address } = useAccount();
  const { connectors } = useConnect();
  const { mintAdventureMap } = useAdventureContract();
  const [username, setUsername] = useState<string>('');
  const [isMinting, setIsMinting] = useState(false);
  const [isLoadingUsername, setIsLoadingUsername] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get username from Cartridge Controller
  useEffect(() => {
    async function fetchUsername() {
      if (!address) return;

      setIsLoadingUsername(true);
      try {
        const controller = connectors[0] as ControllerConnector;
        if (controller?.controller) {
          const controllerUsername = await controller.controller.username();
          if (controllerUsername) {
            setUsername(controllerUsername);
          }
        }
      } catch (err) {
        console.error('Failed to fetch username:', err);
        // Set a default if we can't get the username
        setUsername('Adventurer');
      } finally {
        setIsLoadingUsername(false);
      }
    }

    fetchUsername();
  }, [address, connectors]);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalUsername = username.trim() || 'Adventurer';

    setIsMinting(true);
    setError(null);

    try {
      const result = await mintAdventureMap(finalUsername);

      if (result.success) {
        console.log('NFT minted successfully:', result.txHash);

        // Reload the page to show the dashboard with fresh contract data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(result.error || 'Failed to mint NFT');
        setIsMinting(false);
      }
    } catch (err) {
      console.error('Mint error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsMinting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-temple-dusk/40 border-2 border-temple-bronze rounded-lg p-8 shadow-xl backdrop-blur-sm relative overflow-hidden texture-parchment effect-embossed texture-grain">
        {/* Mystical background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-temple-mystic/20 to-transparent pointer-events-none"></div>

        {/* Decorative corner ornaments */}
        <div className="absolute top-3 left-3 w-12 h-12 border-l-2 border-t-2 border-temple-gold/40 rounded-tl"></div>
        <div className="absolute top-3 right-3 w-12 h-12 border-r-2 border-t-2 border-temple-gold/40 rounded-tr"></div>
        <div className="absolute bottom-3 left-3 w-12 h-12 border-l-2 border-b-2 border-temple-gold/40 rounded-bl"></div>
        <div className="absolute bottom-3 right-3 w-12 h-12 border-r-2 border-b-2 border-temple-gold/40 rounded-br"></div>

        <div className="relative">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-3xl font-bold mb-2 text-temple-gold font-heading">{ADVENTURE_TEXT.mint.title}</h2>
          </div>

          <form onSubmit={handleMint} className="space-y-6">
            {error && (
              <div className="bg-temple-ember/20 border-2 border-temple-flame/50 rounded-lg p-3">
                <p className="text-temple-flame text-sm font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isMinting || isLoadingUsername}
              className="w-full bg-gradient-to-r from-temple-ember to-temple-flame hover:from-temple-flame hover:to-temple-ember disabled:from-temple-shadow disabled:to-temple-shadow text-white font-ui font-bold py-4 px-6 rounded-lg transition-all border-2 border-temple-bronze/50 hover:border-temple-gold disabled:border-temple-dusk shadow-lg text-lg uppercase tracking-wide effect-raised relative overflow-hidden"
            >
              <span className="relative z-10">{isMinting ? 'Minting...' : isLoadingUsername ? 'Loading...' : ADVENTURE_TEXT.mint.buttonText}</span>
              <div className="absolute inset-0 effect-metallic pointer-events-none"></div>
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-temple-shadow/60 border-2 border-temple-bronze/40 rounded-lg p-4 text-center text-sm text-temple-parchment/80">
            <strong className="text-temple-gold">Your Adventure Map</strong> {ADVENTURE_TEXT.mint.nftDescription}
          </div>
        </div>
      </div>

      {/* Preview of the adventure */}
      <div className="mt-8 bg-temple-dusk/40 border-2 border-temple-bronze rounded-lg p-6 shadow-xl backdrop-blur-sm relative overflow-hidden texture-stone effect-embossed texture-grain">
        {/* Mystical background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-temple-seal/20 to-transparent pointer-events-none"></div>

        {/* Decorative corner ornaments */}
        <div className="absolute top-2 left-2 w-10 h-10 border-l-2 border-t-2 border-temple-bronze/30 rounded-tl"></div>
        <div className="absolute top-2 right-2 w-10 h-10 border-r-2 border-t-2 border-temple-bronze/30 rounded-tr"></div>
        <div className="absolute bottom-2 left-2 w-10 h-10 border-l-2 border-b-2 border-temple-bronze/30 rounded-bl"></div>
        <div className="absolute bottom-2 right-2 w-10 h-10 border-r-2 border-b-2 border-temple-bronze/30 rounded-br"></div>

        <div className="relative">
          <h3 className="font-bold text-temple-gold mb-4 font-heading text-center">{ADVENTURE_TEXT.mint.whatAwaitsTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚔️</span>
              <div>
                <h4 className="font-semibold text-temple-ember">{ADVENTURE_TEXT.mint.trials.title}</h4>
                <p className="text-sm text-temple-parchment/70">
                  {ADVENTURE_TEXT.mint.trials.description}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-3xl">🔮</span>
              <div>
                <h4 className="font-semibold text-temple-ember">{ADVENTURE_TEXT.mint.waypoints.title}</h4>
                <p className="text-sm text-temple-parchment/70">
                  {ADVENTURE_TEXT.mint.waypoints.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
