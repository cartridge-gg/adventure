/**
 * Torii query utilities
 *
 * Queries game sessions from external Dojo worlds using Torii's SQL endpoint.
 *
 * APPROACH:
 * Use Torii's /sql endpoint to query the token_balances table directly.
 * This gives us token ownership indexed by Torii without needing contract calls.
 *
 * Reference: Death Mountain client implementation
 * @see https://github.com/cartridge-gg/loot-survivor/blob/main/client/src/dojo/useGameTokens.ts
 */

/**
 * Add padding to StarkNet addresses (ensure 66 character format with 0x prefix)
 */
function addAddressPadding(address: string): string {
  const cleaned = address.toLowerCase().replace('0x', '');
  return '0x' + cleaned.padStart(64, '0');
}

/**
 * Query player's game session token IDs from Torii SQL endpoint
 *
 * Uses Torii's indexed token_balances table to find tokens owned by the player,
 * filtered by game name using token attributes.
 *
 * @param playerAddress - The player's wallet address
 * @param toriiUrl - Torii SQL endpoint URL
 * @param denshokanAddress - Denshokan NFT contract address
 * @param gameName - Game name to filter by (from token attributes)
 * @returns Array of token IDs owned by the player
 */
export async function queryPlayerGameTokenIds(
  playerAddress: string,
  toriiUrl: string,
  denshokanAddress: string,
  gameName: string
): Promise<string[]> {
  console.log('[Torii] Querying player tokens from:', toriiUrl);
  console.log('[Torii] Player:', playerAddress);
  console.log('[Torii] Denshokan:', denshokanAddress);
  console.log('[Torii] Game name:', gameName);

  try {
    const paddedPlayer = addAddressPadding(playerAddress);
    const paddedContract = addAddressPadding(denshokanAddress);

    const query = `
      SELECT DISTINCT tb.token_id
      FROM token_balances AS tb
      JOIN token_attributes AS ta ON ta.token_id = tb.token_id
      WHERE tb.account_address = "${paddedPlayer}"
      AND tb.contract_address = "${paddedContract}"
      AND ta.trait_name = "Game Name"
      AND ta.trait_value = "${gameName}"
    `;

    const url = `${toriiUrl}/sql?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Token IDs come in format "contract:tokenId", extract the tokenId part
    const tokenIds = data.map((row: any) => {
      const parts = row.token_id.split(':');
      return '0x' + parseInt(parts[1], 16).toString(16);
    });

    console.log(`[Torii] Found ${tokenIds.length} tokens owned by player`);
    return tokenIds;
  } catch (error) {
    console.error('[Torii] Error querying player tokens:', error);
    return [];
  }
}
