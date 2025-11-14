/**
 * Map Test Page
 *
 * Displays the AdventureMapNFT component with different total level counts
 * to showcase how polygon shapes change: 3=triangle, 4=square, 5=pentagon, 7=heptagon
 */

import { AdventureMapNFT } from '../components/AdventureMapNFT';
import { AdventureProgress } from '../lib/adventureTypes';

function MapTestPage() {
  // Generate test progress states with different total levels to show different polygon shapes
  const testProgresses: Array<AdventureProgress & { shape: string }> = [
    {
      tokenId: '42',
      username: 'Alice',
      levelsCompleted: [1, 2, 3],
      totalLevels: 3,
      completionPercentage: 100,
      shape: 'Triangle',
    },
    {
      tokenId: '123',
      username: 'Bob',
      levelsCompleted: [1, 2, 3, 4],
      totalLevels: 4,
      completionPercentage: 100,
      shape: 'Square',
    },
    {
      tokenId: '777',
      username: 'Charlie',
      levelsCompleted: [1, 2, 3, 4, 5],
      totalLevels: 5,
      completionPercentage: 100,
      shape: 'Pentagon',
    },
    {
      tokenId: '999',
      username: 'Diana',
      levelsCompleted: [1, 2, 3, 4, 5, 6, 7],
      totalLevels: 7,
      completionPercentage: 100,
      shape: 'Heptagon',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-void via-temple-shadow to-temple-dusk texture-grain">
      <div className="min-h-screen bg-temple-void/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-12 text-center">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-temple-gold via-temple-ember to-temple-flame mb-2"
                style={{ filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.5))' }}>
              🗺️ Adventure Map Gallery
            </h1>
            <p className="text-temple-parchment text-lg opacity-90">
              Different polygon layouts: 3-level triangle, 4-level square, 5-level pentagon, 7-level heptagon
            </p>
          </header>

          {/* Map Gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {testProgresses.map((progress) => (
              <div key={progress.tokenId}>
                <div className="mb-4 text-center">
                  <h2 className="text-temple-gold font-heading text-2xl mb-1">
                    {progress.shape} Map - Token #{progress.tokenId}
                  </h2>
                  <p className="text-temple-parchment/80">
                    {progress.totalLevels} levels • {progress.username}
                  </p>
                </div>
                <AdventureMapNFT progress={progress} />
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="max-w-4xl mx-auto bg-temple-dusk/40 border-2 border-temple-bronze rounded-lg p-6 shadow-xl backdrop-blur-sm relative overflow-hidden texture-stone effect-embossed texture-grain">
            <div className="absolute inset-0 bg-gradient-to-br from-temple-mystic/20 to-transparent pointer-events-none"></div>

            <div className="relative">
              <h2 className="font-heading text-2xl font-bold text-temple-gold mb-4">
                How Procedural Maps Work
              </h2>
              <ul className="space-y-2 text-temple-parchment/90">
                <li className="flex items-start gap-2">
                  <span className="text-temple-ember">•</span>
                  <span><strong>Polygon Shapes:</strong> The number of levels determines the polygon shape (3=triangle, 4=square, 5=pentagon, 7=heptagon)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-temple-ember">•</span>
                  <span><strong>Unique Layouts:</strong> Each token ID generates a unique arrangement using seeded randomization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-temple-ember">•</span>
                  <span><strong>Criss-Cross Paths:</strong> Players traverse levels in order (1→2→3...), creating unique path patterns across the polygon</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-temple-ember">•</span>
                  <span><strong>Dynamic Icons:</strong> Completed levels show check marks with green badges, while incomplete levels show question marks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-temple-ember">•</span>
                  <span><strong>Consistent Generation:</strong> Same token ID and total levels always generate the same map layout</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-temple-gold hover:text-temple-ember transition-colors font-semibold underline"
            >
              ← Back to Adventure
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapTestPage;
