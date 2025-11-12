/**
 * Map Visualization Test Page
 *
 * Shows multiple Adventure Maps with different token IDs and completion states
 * to visualize the procedural generation.
 */

import React from 'react';
import { AdventureMapNFT } from '../components/AdventureMapNFT';
import { AdventureProgress } from '../lib/adventureTypes';

export function MapTest() {
  // Test with different token IDs and completion states
  const testMaps: AdventureProgress[] = [
    {
      tokenId: '42',
      username: 'Alice',
      levelsCompleted: [1, 2],
      totalLevels: 6,
      completionPercentage: 33,
    },
    {
      tokenId: '123',
      username: 'Bob',
      levelsCompleted: [1, 2, 3, 4],
      totalLevels: 6,
      completionPercentage: 67,
    },
    {
      tokenId: '777',
      username: 'Charlie',
      levelsCompleted: [1, 2, 3, 4, 5, 6],
      totalLevels: 6,
      completionPercentage: 100,
    },
    {
      tokenId: '999',
      username: 'Diana',
      levelsCompleted: [1],
      totalLevels: 6,
      completionPercentage: 17,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-amber-50 mb-8 text-center">
          Adventure Map Gallery
        </h1>
        <p className="text-amber-100 mb-8 text-center">
          Each map has a unique layout based on its token ID. Same token ID always generates the same map!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testMaps.map((progress) => (
            <div key={progress.tokenId}>
              <AdventureMapNFT progress={progress} />
            </div>
          ))}
        </div>

        <div className="mt-12 bg-amber-100 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">How It Works</h2>
          <ul className="space-y-2 text-amber-800">
            <li>• <strong>Polygon Layout:</strong> Levels are arranged on vertices of a regular polygon (6 levels = hexagon)</li>
            <li>• <strong>Pseudorandom Assignment:</strong> Each token ID determines which level appears at which vertex</li>
            <li>• <strong>Criss-Cross Paths:</strong> Players traverse levels in order (1→2→3...), creating unique path patterns</li>
            <li>• <strong>Medium Jitter:</strong> Each location has a small random offset (±20px, ±4.6°) for organic feel</li>
            <li>• <strong>Hidden Locks:</strong> Incomplete levels are hidden until unlocked</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
