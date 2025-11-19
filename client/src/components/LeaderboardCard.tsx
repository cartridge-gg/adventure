/**
 * Leaderboard Card Component
 *
 * Pseudo-level card that links to the leaderboard page.
 * Styled similarly to level cards but serves as a navigation element.
 */

import { ADVENTURE_TEXT } from '../lib/adventureConfig';

interface LeaderboardCardProps {
  onNavigate: () => void;
}

export function LeaderboardCard({ onNavigate }: LeaderboardCardProps) {
  return (
    <div className="relative">
      {/* Trophy Badge */}
      <div className="absolute -top-3 -left-3 z-10">
        <div className="bg-gradient-to-br from-temple-gold/80 to-temple-ember/80 w-8 h-8 rounded-full flex items-center justify-center shadow-xl border-2 border-temple-gold/60 relative texture-stone effect-raised backdrop-blur-sm">
          <div className="absolute inset-0 rounded-full bg-temple-gold/30 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full effect-metallic"></div>
          <span className="text-sm relative z-10" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 8px rgba(212, 175, 55, 0.6)' }}>🏆</span>
        </div>
      </div>

      {/* Card Content */}
      <button
        onClick={onNavigate}
        className="w-full bg-temple-dusk/40 border-2 border-temple-bronze hover:border-temple-gold rounded-lg p-6 shadow-xl relative overflow-hidden backdrop-blur-sm texture-stone effect-embossed texture-grain transition-all hover:scale-[1.02]"
      >
        {/* Mystical background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-temple-gold/20 to-transparent pointer-events-none"></div>

        {/* Decorative corner ornaments */}
        <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-temple-gold/30 rounded-tl"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-temple-gold/30 rounded-tr"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-temple-gold/30 rounded-bl"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-temple-gold/30 rounded-br"></div>

        <div className="relative text-center">
          {/* Icon */}
          <div className="text-5xl mb-3 glow-mystical">🏆</div>

          {/* Title */}
          <h3 className="text-xl font-bold text-temple-gold font-heading mb-2" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.4)' }}>
            {ADVENTURE_TEXT.leaderboard.title}
          </h3>

          {/* Button */}
          <div className="inline-block bg-gradient-to-r from-temple-gold to-temple-ember text-temple-void font-ui font-semibold py-2 px-6 rounded-lg transition-all border-2 border-temple-bronze/50 hover:border-temple-gold shadow-lg uppercase tracking-wide effect-raised relative overflow-hidden">
            <span className="relative z-10">{ADVENTURE_TEXT.leaderboard.viewButton}</span>
            <div className="absolute inset-0 effect-metallic pointer-events-none"></div>
          </div>
        </div>
      </button>
    </div>
  );
}
