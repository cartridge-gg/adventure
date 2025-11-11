/**
 * Death Mountain Adventurer Packed Data Decoder
 *
 * Decodes the packed felt252 from AdventurerPacked model to extract
 * health and XP without making contract calls.
 *
 * NOTE: For game_over detection, prefer checking the AdventurerKilled model
 * first (see toriiQueries.ts). This decoder is used to:
 * 1. Extract XP (score) from AdventurerPacked
 * 2. Fallback health check if AdventurerKilled is not available
 *
 * Based on Death Mountain's adventurer.cairo packing logic:
 * - Bits 0-9:    health (10 bits)
 * - Bits 10-24:  xp (15 bits)
 * - Bits 25-33:  gold (9 bits)
 * - Bits 34-43:  beast_health (10 bits)
 * - ... (rest not needed for game_over check)
 */

export interface DecodedAdventurer {
  health: number;
  xp: number;
  gold: number;
  beast_health: number;
}

/**
 * Decode Death Mountain packed adventurer data
 *
 * @param packedHex - The packed felt252 as a hex string (e.g., "0x1234...")
 * @returns Decoded adventurer data with health and XP
 */
export function decodeAdventurerPacked(packedHex: string): DecodedAdventurer {
  // Convert hex string to BigInt
  const packed = BigInt(packedHex);

  // Extract fields using bit masks and shifts
  // health: bits 0-9 (10 bits, mask: 0x3FF)
  const health = Number(packed & 0x3FFn);

  // xp: bits 10-24 (15 bits, shift by 10, mask: 0x7FFF)
  const xp = Number((packed >> 10n) & 0x7FFFn);

  // gold: bits 25-33 (9 bits, shift by 25, mask: 0x1FF)
  const gold = Number((packed >> 25n) & 0x1FFn);

  // beast_health: bits 34-43 (10 bits, shift by 34, mask: 0x3FF)
  const beast_health = Number((packed >> 34n) & 0x3FFn);

  return {
    health,
    xp,
    gold,
    beast_health,
  };
}

/**
 * Check if Death Mountain game is over
 *
 * Game is over when adventurer health == 0
 *
 * @param packedHex - The packed felt252 as a hex string
 * @returns True if game is over (health == 0)
 */
export function isDeathMountainGameOver(packedHex: string): boolean {
  const { health } = decodeAdventurerPacked(packedHex);
  return health === 0;
}

/**
 * Get Death Mountain game score (XP)
 *
 * @param packedHex - The packed felt252 as a hex string
 * @returns The adventurer's XP (score)
 */
export function getDeathMountainScore(packedHex: string): number {
  const { xp } = decodeAdventurerPacked(packedHex);
  return xp;
}

/**
 * Validate packed data is reasonable
 *
 * Performs sanity checks to ensure decoded values are within expected ranges
 */
export function validateDecodedAdventurer(decoded: DecodedAdventurer): boolean {
  const MAX_HEALTH = 1023; // 10 bits = 2^10 - 1
  const MAX_XP = 32767; // 15 bits = 2^15 - 1
  const MAX_GOLD = 511; // 9 bits = 2^9 - 1
  const MAX_BEAST_HEALTH = 1023; // 10 bits

  return (
    decoded.health <= MAX_HEALTH &&
    decoded.xp <= MAX_XP &&
    decoded.gold <= MAX_GOLD &&
    decoded.beast_health <= MAX_BEAST_HEALTH
  );
}

/**
 * Example usage:
 *
 * const packed = "0x1234567890abcdef...";
 * const adventurer = decodeAdventurerPacked(packed);
 * console.log(`Health: ${adventurer.health}, XP: ${adventurer.xp}`);
 *
 * const gameOver = isDeathMountainGameOver(packed);
 * const score = getDeathMountainScore(packed);
 */
