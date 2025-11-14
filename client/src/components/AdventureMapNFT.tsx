/**
 * Adventure Map NFT Preview Component
 *
 * Displays a mocked SVG treasure map that updates as levels are completed.
 * This will be replaced with actual onchain SVG calls later.
 */

import React from 'react';
import { AdventureProgress } from '../lib/adventureTypes';
import { ADVENTURE_TEXT } from '../lib/adventureConfig';

// Import SVG assets (in Cairo, these would be stored as ByteArrays or felt252 arrays)
import RiverSvg from '../../assets/River.svg?raw';
import DojoSvg from '../../assets/Dojo.svg?raw';
import MountainSvg from '../../assets/Mountain.svg?raw';
import CompassSvg from '../../assets/Compass.svg?raw';
import CircleSvg from '../../assets/Circle.svg?raw';
import CheckSvg from '../../assets/Check.svg?raw';
import QuestionMarkSvg from '../../assets/Question Mark.svg?raw';

// ============================================================================
// CONSTANTS - Can be easily translated to Cairo constants
// ============================================================================

const SVG_WIDTH = 400;
const SVG_HEIGHT = 500;
const WAYPOINT_CIRCLE_RADIUS = 25;
const WAYPOINT_SIZE = 50;
const LEVEL_BADGE_RADIUS = 10;
const PATH_STROKE_WIDTH = 3;

// Colors
const BG_COLOR = '#fef3c7';
const BORDER_COLOR = '#92400e';
const PATH_COLOR = '#8B4513';
const COMPLETE_ICON_COLOR = '#5a8a5a';
const INCOMPLETE_ICON_COLOR = '#8b6f47';
const COMPLETE_BADGE_COLOR = '#15803d';
const INCOMPLETE_BADGE_COLOR = '#78350f';

interface AdventureMapNFTProps {
  progress: AdventureProgress;
}

export function AdventureMapNFT({ progress }: AdventureMapNFTProps) {
  const completionPercentage = (progress.levelsCompleted.length / progress.totalLevels) * 100;
  const isComplete = progress.levelsCompleted.length === progress.totalLevels;

  return (
    <div className="bg-temple-dusk/40 rounded-lg p-6 shadow-xl border-2 border-temple-bronze backdrop-blur-sm relative overflow-hidden texture-parchment effect-embossed texture-grain effect-weathered">
      {/* Mystical background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-temple-mystic/20 to-transparent pointer-events-none"></div>

      {/* Decorative corner ornaments */}
      <div className="absolute top-2 left-2 w-10 h-10 border-l-2 border-t-2 border-temple-gold/40 rounded-tl"></div>
      <div className="absolute top-2 right-2 w-10 h-10 border-r-2 border-t-2 border-temple-gold/40 rounded-tr"></div>
      <div className="absolute bottom-2 left-2 w-10 h-10 border-l-2 border-b-2 border-temple-gold/40 rounded-bl"></div>
      <div className="absolute bottom-2 right-2 w-10 h-10 border-r-2 border-b-2 border-temple-gold/40 rounded-br"></div>

      <div className="relative">
        <div className="mb-4 text-center">
          <h3 className="text-xl font-bold text-temple-gold font-heading" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.4)' }}>
            {ADVENTURE_TEXT.map.title} #{progress.tokenId}
          </h3>
        </div>

        {/* Mock SVG Treasure Map */}
        <div className="relative rounded overflow-hidden mb-4">
        <svg
          viewBox="0 0 400 500"
          className="w-full h-auto"
          style={{ maxHeight: '500px' }}
        >
          {/* Background texture */}
          <defs>
            <pattern
              id="paper-texture"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <rect width="100" height="100" fill="#fef3c7" />
              <circle cx="10" cy="10" r="1" fill="#d97706" opacity="0.1" />
              <circle cx="50" cy="50" r="1" fill="#d97706" opacity="0.1" />
              <circle cx="90" cy="30" r="1" fill="#d97706" opacity="0.1" />
            </pattern>
          </defs>

          <rect width="400" height="500" fill="url(#paper-texture)" />

          {/* Border decoration */}
          <rect
            x="10"
            y="10"
            width="380"
            height="480"
            fill="none"
            stroke="#92400e"
            strokeWidth="3"
          />

          {/* Map path - draws waypoints and connections */}
          {renderMapPath(progress.levelsCompleted, progress.totalLevels, parseInt(progress.tokenId) || 1, isComplete)}

          {/* Username in lower-right corner */}
          <text
            x="375"
            y="475"
            textAnchor="end"
            fill="#92400e"
            fontSize="14"
            fontFamily="serif"
            fontStyle="italic"
          >
            {progress.username}
          </text>
        </svg>
      </div>

        {/* Journey Complete Section */}
        {isComplete && (
          <div className="mt-4 pt-4 border-t border-temple-bronze/50">
            <div className="text-center">
              <div className="text-5xl mb-3">⛩️</div>
              <h3 className="text-xl font-bold text-temple-gold mb-2 font-heading">{ADVENTURE_TEXT.map.completedTitle}</h3>
              <ShareButton progress={progress} />
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
function ShareButton({ progress }: { progress: AdventureProgress }) {
  const handleShare = () => {
    const message = ADVENTURE_TEXT.map.shareMessage(progress.levelsCompleted.length, progress.totalLevels);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleShare}
      className="w-full bg-gradient-to-r from-temple-ember to-temple-flame hover:from-temple-flame hover:to-temple-ember text-white font-ui font-semibold py-2 px-4 rounded-lg transition-all border-2 border-temple-bronze/50 hover:border-temple-gold shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide"
    >
      <span>{ADVENTURE_TEXT.map.shareButton}</span>
    </button>
  );
}

// ============================================================================
// SVG UTILITY FUNCTIONS - For parsing SVG assets
// In Cairo: These would be pre-processed and stored as structured data
// ============================================================================

/**
 * Extract SVG content and viewBox from raw SVG string
 * Cairo equivalent: Store viewBox as struct { x: u32, y: u32, width: u32, height: u32 }
 *                   Store content as ByteArray
 */
function extractSvgContent(svgString: string): { content: string; viewBox: string } {
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';

  const contentMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  const content = contentMatch ? contentMatch[1] : '';

  return { content, viewBox };
}

// ============================================================================
// WAYPOINT RENDERING
// Cairo: This would be a function that builds SVG strings
// ============================================================================

/**
 * Render a single waypoint with Circle background and overlay
 *
 * Cairo translation notes:
 * - Use ByteArray for SVG string building
 * - Colors selected via if/else based on isComplete boolean
 * - Position is (x, y) coordinates as u32 values
 */
function renderWaypoint(
  level: number,
  levelNum: number,
  isComplete: boolean,
  pos: Point,
  circle: { content: string; viewBox: string },
  check: { content: string; viewBox: string },
  questionMark: { content: string; viewBox: string }
): React.ReactElement {
  // Select colors based on completion status - circles use icon colors with opacity
  const iconColor = isComplete ? COMPLETE_ICON_COLOR : INCOMPLETE_ICON_COLOR;

  return (
    <g key={`waypoint-${level}`} transform={`translate(${pos.x}, ${pos.y})`}>
      {/* Background circle to cover lines - matches the SVG background color */}
      {/* <circle r="22" fill="#fef3c7" /> */}

      {/* Circle.svg as background - uses icon color with lower opacity */}
      <g fill={iconColor} opacity="0.4">
        <svg
          x="-25"
          y="-25"
          width="50"
          height="50"
          viewBox={circle.viewBox}
          dangerouslySetInnerHTML={{ __html: circle.content }}
        />
      </g>

      {/* Overlay: Check.svg for completed, Question Mark.svg for incomplete - larger to extend past circle */}
      <g fill={iconColor}>
        {isComplete ? (
          <svg
            x="-18"
            y="-40"
            width="50"
            height="50"
            viewBox={check.viewBox}
            dangerouslySetInnerHTML={{ __html: check.content }}
          />
        ) : (
          <svg
            x="-25"
            y="-40"
            width="50"
            height="50"
            viewBox={questionMark.viewBox}
            dangerouslySetInnerHTML={{ __html: questionMark.content }}
          />
        )}
      </g>

      {/* Level number badge */}
      <g transform="translate(20, -20)">
        <circle r="10" fill={isComplete ? "#15803d" : "#78350f"} stroke="#fff" strokeWidth="2" />
        <text
          textAnchor="middle"
          y="3.5"
          fill="#fff"
          fontSize="10"
          fontWeight="bold"
        >
          {levelNum}
        </text>
      </g>
    </g>
  );
}

// ============================================================================
// MATH UTILITIES - Deterministic positioning for waypoints
// Cairo: Use fixed-point math for trigonometry, LCG for randomness
// ============================================================================

/**
 * Point struct for 2D coordinates
 * Cairo: struct Point { x: u32, y: u32 }
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Seeded random number generator
 * Uses simple sin-based algorithm for deterministic randomness
 *
 * Cairo implementation notes:
 * - Use Linear Congruential Generator (LCG): (a * seed + c) % m
 * - Constants: a = 1103515245, c = 12345, m = 2^31
 * - Return value normalized to [0, 1) range
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Fisher-Yates shuffle with deterministic seed
 *
 * Cairo implementation:
 * - Use Array<u8> for small arrays
 * - Iterate backwards: for i in (total_levels - 1)..0
 * - Swap elements using tuple assignment
 */
function shuffleWithSeed(array: number[], seed: number): number[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate level-to-vertex mapping (deterministic based on token ID)
 *
 * Cairo implementation:
 * - Input: token_id (u256), total_levels (u8)
 * - Output: Array<u8> where index is level, value is vertex position
 * - Seed calculation: token_id * 12345 (use overflow-safe multiplication)
 */
function generateLevelAssignments(tokenId: number, totalLevels: number): Map<number, number> {
  const seed = tokenId * 12345;
  const vertices = Array.from({ length: totalLevels }, (_, i) => i);
  const shuffled = shuffleWithSeed(vertices, seed);

  return new Map(
    Array.from({ length: totalLevels }, (_, level) => [level, shuffled[level]])
  );
}

/**
 * Calculate waypoint position on circular layout
 *
 * Cairo implementation notes:
 * - Use fixed-point arithmetic for trigonometry
 * - Angles in radians: angle = (2 * PI * vertex_index) / total_levels - PI/2
 * - Pre-compute sin/cos lookup tables for efficiency
 * - Return Point { x: center_x + radius * cos(angle), y: center_y + radius * sin(angle) }
 */
function getLevelPosition(
  level: number,
  vertexIndex: number,
  totalLevels: number,
  centerX: number,
  centerY: number,
  radius: number
): Point {
  const angle = (2 * Math.PI * vertexIndex) / totalLevels - Math.PI / 2;

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

// ============================================================================
// MAIN SVG GENERATION FUNCTION
// Cairo: This would be the main `token_uri` function
// ============================================================================

/**
 * Generate the complete adventure map SVG
 *
 * Cairo implementation structure:
 * 1. Build SVG header with viewBox
 * 2. Add background and decorative elements (static)
 * 3. Generate waypoint positions (deterministic from token_id)
 * 4. Draw connecting paths between completed waypoints
 * 5. Draw waypoint circles and icons
 * 6. Add username text
 * 7. Close SVG tags
 *
 * Input:
 * - completed_levels: Array<u8> of completed level numbers (1-indexed)
 * - total_levels: u8 (typically 3-10)
 * - token_id: u256 (for deterministic positioning)
 * - is_complete: bool (whether all levels are completed)
 *
 * Output: ByteArray containing complete SVG string
 */
function renderMapPath(completedLevels: number[], totalLevels: number, tokenId: number, isComplete: boolean) {
  // Waypoint layout parameters (Cairo: use constants)
  const centerX = 200;  // SVG_WIDTH / 2
  const centerY = 310;  // Slightly below center for visual balance
  const radius = 130;    // Radius of circular waypoint layout

  const elements: React.ReactElement[] = [];

  // Cairo: Pre-load all SVG assets as ByteArray constants
  const river = extractSvgContent(RiverSvg);
  const dojo = extractSvgContent(DojoSvg);
  const mountain = extractSvgContent(MountainSvg);
  const compass = extractSvgContent(CompassSvg);
  const circle = extractSvgContent(CircleSvg);
  const check = extractSvgContent(CheckSvg);
  const questionMark = extractSvgContent(QuestionMarkSvg);

  // ========== LAYER 1: Background Decorations (static) ==========
  // Cairo: Append these as literal strings to the output ByteArray
  elements.push(
    <g key="river-background" opacity="0.2">
      <svg
        x="50"
        y="150"
        width="300"
        height="300"
        viewBox={river.viewBox}
        dangerouslySetInnerHTML={{ __html: river.content }}
      />
    </g>
  );

  // ========== LAYER 2: Top Decorative Elements (static) ==========
  // Cairo: These positions are constants

  // Dojo at top center with yellow glow (only when complete)
  elements.push(
    <g key="dojo-decoration">
      {/* Yellow glow behind Dojo - only shown when adventure is complete */}
      {isComplete && (
        <>
          <defs>
            <radialGradient id="dojo-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#d97706" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glow circle - larger and brighter */}
          <circle
            cx="200"
            cy="70"
            r="80"
            fill="url(#dojo-glow)"
          />
        </>
      )}

      {/* Dojo SVG */}
      <svg
        x="150"
        y="20"
        width="100"
        height="100"
        viewBox={dojo.viewBox}
        dangerouslySetInnerHTML={{ __html: dojo.content }}
      />
    </g>
  );

  // Mountain - left side (top area)
  elements.push(
    <g key="mountain-left">
      <svg
        x="20"
        y="10"
        width="150"
        height="150"
        viewBox={mountain.viewBox}
        dangerouslySetInnerHTML={{ __html: mountain.content }}
      />
    </g>
  );

  elements.push(
    <g key="mountain-left-2" opacity="0.2">
      <svg
        x="80"
        y="20"
        width="100"
        height="100"
        viewBox={mountain.viewBox}
        dangerouslySetInnerHTML={{ __html: mountain.content }}
      />
    </g>
  );

  // Mountain - right side (top area, mirrored)
  elements.push(
    <g key="mountain-right" transform="scale(-1, 1)">
      <svg
        x="-380"
        y="10"
        width="150"
        height="150"
        viewBox={mountain.viewBox}
        dangerouslySetInnerHTML={{ __html: mountain.content }}
      />
    </g>
  );

  elements.push(
    <g key="mountain-right-2" transform="scale(-1, 1)" opacity="0.2">
      <svg
        x="-320"
        y="20"
        width="100"
        height="100"
        viewBox={mountain.viewBox}
        dangerouslySetInnerHTML={{ __html: mountain.content }}
      />
    </g>
  );

    // Compass - upper-right corner
    elements.push(
      <g key="compass-decoration">
        <svg
          x="330"
          y="20"
          width="50"
          height="50"
          viewBox={compass.viewBox}
          dangerouslySetInnerHTML={{ __html: compass.content }}
        />
      </g>
    );

  // ========== Calculate Waypoint Positions (deterministic) ==========
  // Cairo: Call generate_level_assignments(token_id, total_levels)
  const levelAssignments = generateLevelAssignments(tokenId, totalLevels);

  // Cairo: Pre-compute all positions into an Array<Point>
  const levelPositions = new Map<number, Point>();
  for (let level = 0; level < totalLevels; level++) {
    const vertexIndex = levelAssignments.get(level)!;
    const pos = getLevelPosition(level, vertexIndex, totalLevels, centerX, centerY, radius);
    levelPositions.set(level, pos);
  }

  // ========== LAYER 3: Connection Paths (dynamic) ==========
  // Cairo: Loop through completed levels and draw lines
  // Only draw line if BOTH current and next level are complete
  for (let i = 0; i < totalLevels - 1; i++) {
    const currentLevel = i;
    const nextLevel = i + 1;

    // Cairo: Check if level exists in completed_levels array
    // Note: levels are 1-indexed in the array
    if (completedLevels.includes(currentLevel + 1) && completedLevels.includes(nextLevel + 1)) {
      const start = levelPositions.get(currentLevel)!;
      const end = levelPositions.get(nextLevel)!;

      elements.push(
        <line
          key={`path-${i}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="#8B4513"
          strokeWidth="3"
          strokeDasharray="5,5"
          opacity="0.7"
        />
      );
    }
  }

  // ========== LAYER 4: Waypoint Markers (dynamic) ==========
  // Cairo: Loop through all levels and render each waypoint
  // Color and icon depend on completion status
  for (let level = 0; level < totalLevels; level++) {
    const levelNum = level + 1;  // Convert to 1-indexed
    const isComplete = completedLevels.includes(levelNum);
    const pos = levelPositions.get(level)!;

    // Cairo: Call render_waypoint function for each level
    elements.push(
      renderWaypoint(level, levelNum, isComplete, pos, circle, check, questionMark)
    );
  }

  return <>{elements}</>;
}
