/**
 * On-Chain Adventure Map NFT Component
 *
 * Fetches and displays the actual on-chain SVG from the NFT contract.
 */

import { useState, useEffect, useMemo } from 'react';
import { useReadContract } from '@starknet-react/core';
import { Abi } from 'starknet';
import { AdventureProgress } from '../lib/adventureTypes';
import { ADVENTURE_TEXT } from '../lib/adventureConfig';
import { MAP_ADDRESS, CHAIN_ENV } from '../lib/config';

// Import the ABI for the AdventureMap contract
import adventureMapAbi from '../../../contracts/target/dev/focg_adventure_AdventureMap.contract_class.json';

interface OnChainMapNFTProps {
  progress: AdventureProgress;
  onRefetchReady?: (refetch: () => void) => void;
}

export function OnChainMapNFT({ progress, onRefetchReady }: OnChainMapNFTProps) {
  const [error, setError] = useState<string>('');

  // Read token_uri from the contract
  const { data: tokenUriData, error: readError, isPending: isReading, refetch } = useReadContract({
    abi: adventureMapAbi.abi as Abi,
    address: MAP_ADDRESS as `0x${string}`,
    functionName: 'token_uri',
    args: [BigInt(progress.tokenId)],
    enabled: !!progress.tokenId && !!MAP_ADDRESS,
  });

  // Expose refetch function to parent
  useEffect(() => {
    if (refetch && onRefetchReady) {
      onRefetchReady(refetch);
    }
  }, [refetch, onRefetchReady]);

  // Parse and extract SVG from tokenURI (matching ronins-pact implementation)
  const svgContent = useMemo(() => {
    if (!tokenUriData) return null;

    try {
      const dataURI = tokenUriData as string;

      // Check if it's an SVG data URI directly
      if (dataURI.startsWith('data:image/svg+xml;utf8,')) {
        return dataURI.substring('data:image/svg+xml;utf8,'.length);
      }

      // Otherwise expect format: data:application/json;base64,<base64_encoded_json>
      if (dataURI.startsWith('data:application/json;base64,')) {
        const base64Data = dataURI.split(',')[1];
        const jsonStr = atob(base64Data);
        const metadata = JSON.parse(jsonStr);

        // Extract SVG from image field
        if (metadata.image && metadata.image.startsWith('data:image/svg+xml;base64,')) {
          const svgBase64 = metadata.image.split(',')[1];
          return atob(svgBase64);
        }
      }

      return null;
    } catch (err) {
      console.error('Error processing token_uri:', err);
      return null;
    }
  }, [tokenUriData]);

  useEffect(() => {
    if (readError) {
      console.error('Error reading token_uri:', readError);
      setError('Failed to load on-chain NFT');
    }
  }, [readError]);

  const isComplete = progress.levelsCompleted.length === progress.totalLevels;

  // Generate explorer URL based on environment
  const getExplorerUrl = () => {
    if (CHAIN_ENV === 'mainnet') {
      return `https://starkscan.co/contract/${MAP_ADDRESS}`;
    } else if (CHAIN_ENV === 'sepolia') {
      return `https://sepolia.starkscan.co/contract/${MAP_ADDRESS}`;
    } else {
      // Dev/Katana - link to local explorer
      return `http://localhost:5050/explorer/contract/${MAP_ADDRESS}`;
    }
  };

  const explorerUrl = getExplorerUrl();

  return (
    <div className="bg-temple-dusk/40 rounded-lg p-6 shadow-xl border-2 border-temple-bronze backdrop-blur-sm relative overflow-hidden texture-stone effect-embossed texture-grain">
      {/* Mystical background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-temple-mystic/20 to-transparent pointer-events-none"></div>

      {/* Decorative corner ornaments */}
      <div className="absolute top-2 left-2 w-10 h-10 border-l-2 border-t-2 border-temple-gold/40 rounded-tl"></div>
      <div className="absolute top-2 right-2 w-10 h-10 border-r-2 border-t-2 border-temple-gold/40 rounded-tr"></div>
      <div className="absolute bottom-2 left-2 w-10 h-10 border-l-2 border-b-2 border-temple-gold/40 rounded-bl"></div>
      <div className="absolute bottom-2 right-2 w-10 h-10 border-r-2 border-b-2 border-temple-gold/40 rounded-br"></div>

      <div className="relative">
        <div className="mb-4 text-center">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-bold text-temple-gold font-heading hover:text-temple-ember transition-colors underline"
            style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.4)' }}
          >
            {ADVENTURE_TEXT.map.title} #{progress.tokenId}
          </a>
        </div>

        {/* On-Chain SVG Display */}
        <div className="relative rounded overflow-hidden mb-4">
          {isReading ? (
            <div className="w-full aspect-[4/5] bg-temple-shadow/30 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-temple-gold mb-4"></div>
                <p className="text-temple-parchment text-sm">Loading on-chain SVG...</p>
              </div>
            </div>
          ) : error ? (
            <div className="w-full aspect-[4/5] bg-red-500/20 border-2 border-red-400 rounded flex items-center justify-center p-4">
              <div className="text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          ) : svgContent ? (
            // Render the SVG content directly (matching ronins-pact implementation)
            <div
              className="w-full aspect-[4/5]"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="w-full aspect-[4/5] bg-temple-shadow/30 flex items-center justify-center">
              <p className="text-temple-parchment text-sm">No SVG data available</p>
            </div>
          )}
        </div>

        {/* Support Link */}
        <div className="mt-4 text-center">
          <a
            href={ADVENTURE_TEXT.support.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-temple-gold hover:text-temple-ember transition-colors text-xs font-semibold underline"
          >
            {ADVENTURE_TEXT.support.text}
          </a>
        </div>

        {/* Journey Complete Section */}
        {isComplete && (
          <div className="mt-8 pt-8 border-t border-temple-bronze/50">
            <div className="text-center">
              <div className="text-5xl mb-3">⛩️</div>
              <h3 className="text-xl font-bold text-temple-gold mb-6 font-heading">{ADVENTURE_TEXT.map.completedTitle}</h3>
              <ShareButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Share Button Component
 */
function ShareButton() {
  const handleShare = () => {
    const message = ADVENTURE_TEXT.map.shareMessage;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleShare}
      className="w-full md:w-4/5 md:mx-auto lg:w-4/5 lg:mx-auto mb-4 bg-gradient-to-r from-temple-ember to-temple-flame hover:from-temple-flame hover:to-temple-ember text-white font-ui font-semibold py-2 px-4 rounded-lg transition-all border-2 border-temple-bronze/50 hover:border-temple-gold shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide"
    >
      <span>{ADVENTURE_TEXT.map.shareButton}</span>
    </button>
  );
}
