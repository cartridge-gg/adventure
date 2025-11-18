/**
 * Adventure Map NFT Component
 *
 * Wrapper component that provides UI chrome (title, share button, etc.)
 * and delegates SVG rendering to either OnChainMapNFT or OffChainMap.
 */

import { AdventureProgress } from '../lib/adventureTypes';
import { ADVENTURE_TEXT } from '../lib/adventureConfig';
import { MAP_ADDRESS, CHAIN_ENV } from '../lib/config';
import { OnChainMapNFT } from './OnChainMapNFT';
// import { OffChainMap } from './OffChainMap';

interface AdventureMapNFTProps {
  progress: AdventureProgress;
  onRefetchReady?: (refetch: () => void) => void;
}

export function AdventureMapNFT({ progress, onRefetchReady }: AdventureMapNFTProps) {
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
        {/* Title */}
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

        {/* Map SVG - render on-chain or off-chain based on prop */}
        <div className="mb-4">
          <OnChainMapNFT tokenId={progress.tokenId} onRefetchReady={onRefetchReady} />
          {/* <OffChainMap progress={progress} /> */}
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
              <SaveToPNGButton tokenId={progress.tokenId} />
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
      {/* X (Twitter) Logo */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span>Share on X</span>
    </button>
  );
}

/**
 * Save to PNG Button Component
 */
function SaveToPNGButton({ tokenId }: { tokenId: string }) {
  const handleSaveToPNG = async () => {
    const svgContainer = document.getElementById('adventure-map-svg');
    if (!svgContainer) {
      console.error('SVG container not found');
      return;
    }

    const svgElement = svgContainer.querySelector('svg');
    if (!svgElement) {
      console.error('SVG element not found');
      return;
    }

    try {
      // Get SVG dimensions
      const svgRect = svgElement.getBoundingClientRect();
      const width = svgRect.width || 800;
      const height = svgRect.height || 1000;

      // Create canvas
      const canvas = document.createElement('canvas');
      const scale = 2; // 2x for better quality
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      // Scale for high DPI
      ctx.scale(scale, scale);

      // Serialize SVG to string
      const svgString = new XMLSerializer().serializeToString(svgElement);

      // Create blob and object URL
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Load SVG as image
      const img = new Image();
      img.onload = () => {
        // Draw to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to PNG and download
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            const pngUrl = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            link.download = `adventure-map-${tokenId}.png`;
            link.href = pngUrl;
            link.click();

            // Cleanup
            URL.revokeObjectURL(pngUrl);
          }
        }, 'image/png');

        // Cleanup
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        console.error('Failed to load SVG as image');
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error('Error saving PNG:', error);
    }
  };

  return (
    <button
      onClick={handleSaveToPNG}
      className="w-full md:w-4/5 md:mx-auto lg:w-4/5 lg:mx-auto mb-4 bg-temple-shadow/80 hover:bg-temple-shadow text-temple-parchment font-ui font-medium py-3 px-4 transition-all border-b-2 border-temple-bronze/30 hover:border-temple-gold/50 flex items-center justify-center gap-3"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span>Download as PNG</span>
    </button>
  );
}
