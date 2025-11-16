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
