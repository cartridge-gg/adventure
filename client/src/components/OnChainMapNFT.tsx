/**
 * On-Chain Map NFT Component
 *
 * Fetches and displays the actual on-chain SVG from the NFT contract.
 * Simplified to only handle SVG fetching/rendering - no UI chrome.
 */

import { useState, useEffect, useMemo } from 'react';
import { useReadContract } from '@starknet-react/core';
import { Abi } from 'starknet';
import { MAP_ADDRESS } from '../lib/config';

// Import the ABI for the AdventureMap contract
import adventureMapAbi from '../abi/focg_adventure_AdventureMap.contract_class.json';

interface OnChainMapNFTProps {
  tokenId: string;
  onRefetchReady?: (refetch: () => void) => void;
}

export function OnChainMapNFT({ tokenId, onRefetchReady }: OnChainMapNFTProps) {
  const [error, setError] = useState<string>('');

  // Read token_uri from the contract
  const { data: tokenUriData, error: readError, isPending: isReading, refetch } = useReadContract({
    abi: adventureMapAbi.abi as Abi,
    address: MAP_ADDRESS as `0x${string}`,
    functionName: 'token_uri',
    args: [BigInt(tokenId)],
    enabled: !!tokenId && !!MAP_ADDRESS,
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

  // Loading state
  if (isReading) {
    return (
      <div className="relative rounded overflow-hidden">
        <div className="w-full aspect-[4/5] bg-temple-shadow/30 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-temple-gold mb-4"></div>
            <p className="text-temple-parchment text-sm">Loading on-chain SVG...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative rounded overflow-hidden">
        <div className="w-full aspect-[4/5] bg-red-500/20 border-2 border-red-400 rounded flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // SVG content
  if (svgContent) {
    return (
      <div className="relative rounded overflow-hidden">
        <div
          id="adventure-map-svg"
          className="w-full aspect-[4/5]"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    );
  }

  // No data state
  return (
    <div className="relative rounded overflow-hidden">
      <div className="w-full aspect-[4/5] bg-temple-shadow/30 flex items-center justify-center">
        <p className="text-temple-parchment text-sm">No SVG data available</p>
      </div>
    </div>
  );
}
