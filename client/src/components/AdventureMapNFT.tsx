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
        <h3 className="text-xl font-bold text-amber-900 mb-1">
          Adventure Map #{progress.tokenId}
        </h3>
        <p className="text-sm text-amber-700">
          Adventurer: {progress.username}
        </p>
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
            FOCG Adventure
          </text>

          {/* Map path - draws waypoints and connections */}
          {renderMapPath(progress.levelsCompleted, progress.totalLevels)}

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
            <p className="text-sm text-amber-800 mb-4">You have completed all levels</p>
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
 * Renders the map path with waypoints
 */
function renderMapPath(completedLevels: number[], totalLevels: number) {
  const waypoints = calculateWaypoints(totalLevels);
  const elements: React.ReactElement[] = [];

  // Draw paths between waypoints
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const isComplete = completedLevels.includes(i + 1);

    elements.push(
      <line
        key={`path-${i}`}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={isComplete ? '#15803d' : '#d6d3d1'}
        strokeWidth="3"
        strokeDasharray={isComplete ? '0' : '5,5'}
      />
    );
  }

  // Draw waypoints
  waypoints.forEach((point, index) => {
    const levelNum = index + 1;
    const isComplete = completedLevels.includes(levelNum);
    const isActive = !isComplete && (index === 0 || completedLevels.includes(levelNum - 1));

    elements.push(
      <g key={`waypoint-${index}`} transform={`translate(${point.x}, ${point.y})`}>
        {/* Waypoint circle */}
        <circle
          r="15"
          fill={isComplete ? '#15803d' : isActive ? '#fbbf24' : '#e7e5e4'}
          stroke="#78350f"
          strokeWidth="2"
        />
        {/* Level number */}
        <text
          textAnchor="middle"
          y="5"
          fill={isComplete ? '#fff' : '#78350f'}
          fontSize="14"
          fontWeight="bold"
        >
          {levelNum}
        </text>
        {/* Checkmark for completed */}
        {isComplete && (
          <text
            x="18"
            y="-10"
            fontSize="16"
          >
            ✓
          </text>
        )}
      </g>
    );
  });

  return <>{elements}</>;
}

/**
 * Calculate waypoint positions for a treasure map layout
 */
function calculateWaypoints(totalLevels: number): Array<{ x: number; y: number }> {
  const waypoints: Array<{ x: number; y: number }> = [];
  const startY = 80;
  const endY = 420;
  const verticalSpacing = (endY - startY) / (totalLevels - 1);
  const centerX = 200;
  const amplitude = 80; // How far waypoints swing left/right

  for (let i = 0; i < totalLevels; i++) {
    const y = startY + i * verticalSpacing;
    // Alternate left and right in a wave pattern
    const x = centerX + Math.sin(i) * amplitude;
    waypoints.push({ x, y });
  }

  return waypoints;
}
