/**
 * Adventure Map NFT Preview Component
 *
 * Displays a mocked SVG treasure map that updates as levels are completed.
 * This will be replaced with actual onchain SVG calls later.
 */

import React from 'react';
import { AdventureProgress } from '../lib/adventureTypes';

interface AdventureMapNFTProps {
  progress: AdventureProgress;
}

export function AdventureMapNFT({ progress }: AdventureMapNFTProps) {
  const completionPercentage = (progress.levelsCompleted.length / progress.totalLevels) * 100;
  const isComplete = progress.levelsCompleted.length === progress.totalLevels;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 shadow-lg border-2 border-amber-300">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-amber-900">
          Adventure Map #{progress.tokenId}
        </h3>
      </div>

      {/* Mock SVG Treasure Map */}
      <div className="relative bg-amber-50 rounded border-2 border-amber-400 overflow-hidden">
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
            strokeDasharray="10,5"
          />

          {/* Title */}
          <text
            x="200"
            y="40"
            textAnchor="middle"
            fill="#78350f"
            fontSize="24"
            fontWeight="bold"
            fontFamily="serif"
          >
            Adventure Map
          </text>

          {/* Compass decoration */}
          <g transform="translate(350, 70)">
            {/* Compass rose background circle */}
            <circle r="25" fill="#fef3c7" stroke="#92400e" strokeWidth="2" />
            {/* North arrow (red) */}
            <polygon points="0,-20 -4,0 0,-3 4,0" fill="#dc2626" stroke="#78350f" strokeWidth="1" />
            {/* South arrow (white) */}
            <polygon points="0,20 -4,0 0,3 4,0" fill="#f5f5f4" stroke="#78350f" strokeWidth="1" />
            {/* East/West markers */}
            <polygon points="20,0 0,-4 3,0 0,4" fill="#f5f5f4" stroke="#78350f" strokeWidth="1" />
            <polygon points="-20,0 0,-4 -3,0 0,4" fill="#f5f5f4" stroke="#78350f" strokeWidth="1" />
            {/* Center circle */}
            <circle r="4" fill="#92400e" />
            {/* N marker */}
            <text x="0" y="-28" textAnchor="middle" fill="#78350f" fontSize="10" fontWeight="bold">N</text>
          </g>

          {/* Map path - draws waypoints and connections */}
          {renderMapPath(progress.levelsCompleted, progress.totalLevels, parseInt(progress.tokenId) || 1)}

          {/* Treasure chest at the end */}
          {isComplete && (
            <g transform="translate(200, 440)">
              {/* Treasure chest */}
              <rect x="-30" y="-20" width="60" height="40" fill="#92400e" stroke="#451a03" strokeWidth="2" rx="5" />
              <rect x="-25" y="-15" width="50" height="10" fill="#fbbf24" />
              <circle cx="0" cy="-5" r="5" fill="#fbbf24" />
              {/* Sparkles */}
              <text x="-40" y="-30" fontSize="20">✨</text>
              <text x="25" y="-30" fontSize="20">✨</text>
              <text x="-15" y="-40" fontSize="20">⭐</text>
            </g>
          )}

          {/* Completion text */}
          {isComplete && (
            <text
              x="200"
              y="475"
              textAnchor="middle"
              fill="#78350f"
              fontSize="16"
              fontWeight="bold"
              fontFamily="serif"
            >
              Journey Complete!
            </text>
          )}

          {/* Username in lower-right corner */}
          <text
            x="360"
            y="470"
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

      {/* Progress indicator */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-amber-800 mb-1">
          <span>Progress</span>
          <span>{Math.round(completionPercentage)}%</span>
        </div>
        <div className="w-full bg-amber-200 rounded-full h-2.5">
          <div
            className="bg-amber-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Journey Complete Section */}
      {isComplete && (
        <div className="mt-4 pt-4 border-t border-amber-300">
          <div className="text-center">
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-xl font-bold text-amber-900 mb-2">Journey Complete!</h3>
            <ShareButton progress={progress} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Share Button Component
 */
function ShareButton({ progress }: { progress: AdventureProgress }) {
  const handleShare = () => {
    const message = `🎉 I just completed the FOCG Adventure! ${progress.levelsCompleted.length}/${progress.totalLevels} levels conquered! #FOCGAdventure #DevConnect #Starknet`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleShare}
      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
    >
      <span>Share on X</span>
      <span>🐦</span>
    </button>
  );
}

/**
 * Pseudorandom number generator (seeded)
 * Uses simple LCG algorithm for deterministic randomness
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate pseudorandom number in range [min, max]
 */
function randomInRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

/**
 * Fisher-Yates shuffle with deterministic seed
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
 * Generate pseudorandom level-to-vertex assignments
 * Each level is assigned to a random polygon vertex
 */
function generateLevelAssignments(tokenId: number, totalLevels: number): Map<number, number> {
  const seed = tokenId * 12345; // Hash token ID
  const vertices = Array.from({ length: totalLevels }, (_, i) => i);
  const shuffled = shuffleWithSeed(vertices, seed);

  return new Map(
    Array.from({ length: totalLevels }, (_, level) => [level, shuffled[level]])
  );
}

/**
 * Calculate position for a level on the polygon
 */
interface Point {
  x: number;
  y: number;
}

function getLevelPosition(
  level: number,
  vertexIndex: number,
  totalLevels: number,
  centerX: number,
  centerY: number,
  radius: number
): Point {
  // Base angle for this vertex (evenly distributed around polygon)
  const angle = (2 * Math.PI * vertexIndex) / totalLevels - Math.PI / 2; // Start at top

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

/**
 * Renders the procedurally generated map with polygon layout
 */
function renderMapPath(completedLevels: number[], totalLevels: number, tokenId: number) {
  const centerX = 200;
  const centerY = 250;
  const radius = 150;

  const elements: React.ReactElement[] = [];

  // Generate level-to-vertex assignments
  const levelAssignments = generateLevelAssignments(tokenId, totalLevels);

  // Calculate positions for all levels
  const levelPositions = new Map<number, Point>();
  for (let level = 0; level < totalLevels; level++) {
    const vertexIndex = levelAssignments.get(level)!;
    const pos = getLevelPosition(level, vertexIndex, totalLevels, centerX, centerY, radius);
    levelPositions.set(level, pos);
  }

  // Draw paths between consecutive completed levels
  for (let i = 0; i < totalLevels - 1; i++) {
    const currentLevel = i;
    const nextLevel = i + 1;

    // Only show path if both levels are complete
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

      // Add arrowhead at end
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const arrowSize = 10;
      const arrowX = end.x - arrowSize * Math.cos(angle);
      const arrowY = end.y - arrowSize * Math.sin(angle);

      elements.push(
        <polygon
          key={`arrow-${i}`}
          points={`${end.x},${end.y} ${arrowX - arrowSize * Math.sin(angle) / 2},${arrowY + arrowSize * Math.cos(angle) / 2} ${arrowX + arrowSize * Math.sin(angle) / 2},${arrowY - arrowSize * Math.cos(angle) / 2}`}
          fill="#8B4513"
          opacity="0.7"
        />
      );
    }
  }

  // Draw all level icons (completed and unexplored)
  for (let level = 0; level < totalLevels; level++) {
    const levelNum = level + 1;
    const isComplete = completedLevels.includes(levelNum);
    const pos = levelPositions.get(level)!;

    if (isComplete) {
      // Completed treasure icon
      elements.push(
        <g key={`treasure-${level}`} transform={`translate(${pos.x}, ${pos.y})`}>
          {/* Treasure icon - gold circle with treasure chest */}
          <circle
            r="20"
            fill="#fbbf24"
            stroke="#92400e"
            strokeWidth="2"
          />
          {/* Simple treasure chest icon */}
          <rect x="-8" y="-6" width="16" height="12" fill="#92400e" rx="2" />
          <rect x="-6" y="-4" width="12" height="3" fill="#fef3c7" />
          <circle cx="0" cy="-1" r="2" fill="#fef3c7" />

          {/* Level number badge */}
          <g transform="translate(16, -16)">
            <circle r="12" fill="#15803d" stroke="#fff" strokeWidth="2" />
            <text
              textAnchor="middle"
              y="4"
              fill="#fff"
              fontSize="11"
              fontWeight="bold"
            >
              {levelNum}
            </text>
          </g>
        </g>
      );
    } else {
      // Unexplored location icon
      elements.push(
        <g key={`unexplored-${level}`} transform={`translate(${pos.x}, ${pos.y})`}>
          {/* Mysterious location - gray circle with question mark */}
          <circle
            r="20"
            fill="#d6d3d1"
            stroke="#78350f"
            strokeWidth="2"
            opacity="0.5"
          />
          {/* Question mark */}
          <text
            textAnchor="middle"
            y="8"
            fill="#78350f"
            fontSize="24"
            fontWeight="bold"
            opacity="0.6"
          >
            ?
          </text>
        </g>
      );
    }
  }

  return <>{elements}</>;
}
