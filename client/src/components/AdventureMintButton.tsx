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
        onMintSuccess();
      } else {
        setError(result.error || 'Failed to mint NFT');
      }
    } catch (err) {
      console.error('Mint error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-lg p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-3xl font-bold mb-2">{ADVENTURE_TEXT.mint.title}</h2>
        </div>

        <form onSubmit={handleMint} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border-2 border-red-300 rounded-lg p-3">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isMinting || isLoadingUsername}
            className="w-full bg-white text-purple-600 font-bold py-4 px-6 rounded-lg hover:bg-gray-100 disabled:bg-gray-400 disabled:text-gray-600 transition-colors text-lg"
          >
            {isMinting ? 'Minting...' : isLoadingUsername ? 'Loading...' : ADVENTURE_TEXT.mint.buttonText}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-white/10 border border-white/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="text-sm text-blue-100">
              <p className="mb-2">
                <strong>Your Adventure Map</strong> is a dynamic NFT that updates as you complete levels.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>One NFT per wallet</li>
                <li>Uses your Controller username</li>
                <li>Tracks your progress onchain</li>
                <li>Visual treasure map updates automatically</li>
                <li>Free to mint (only gas fees)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Preview of the adventure */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
        <h3 className="font-bold text-gray-900 mb-4">What's ahead:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎮</span>
            <div>
              <h4 className="font-semibold text-gray-900">Onchain Games</h4>
              <p className="text-sm text-gray-600">
                Complete challenges in browser-based fully onchain games
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-3xl">🗺️</span>
            <div>
              <h4 className="font-semibold text-gray-900">IRL Quests</h4>
              <p className="text-sm text-gray-600">
                Visit community hubs and solve puzzles to find codewords
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
