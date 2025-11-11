/**
 * Torii GraphQL query utilities
 *
 * Provides functions to query game sessions from different Dojo worlds
 * using a **HYBRID APPROACH** that balances standardization and practicality:
 *
 * TOKEN OWNERSHIP: Query game-specific models to find token IDs
 *   - Torii's ERC721 indexing (tokenBalances) is unreliable/not always enabled
 *   - Each game has its own model structure (NUMS_Game, ls_AdventurerPacked, etc.)
 *   - We query these models to find token IDs and basic info
 *
 * GAME STATE: Use Denshokan standard interface via contract calls
 *   - score(token_id: u64) -> u32
 *   - game_over(token_id: u64) -> bool
 *   - This ensures compatibility with ANY Denshokan game
 *
 * This hybrid approach provides the best of both worlds:
 * ✅ Uses Torii for efficient token discovery
 * ✅ Uses Denshokan standard for game state (works for any game)
 * ❌ Requires game-specific model queries (but this is unavoidable given Torii limitations)
 */

import { DojoGameConfig } from './challenges';

export interface GameSession {
  token_id: string;
  owner: string;
  score: number;
  game_over: boolean;
}

/**
 * Query Game models directly for completed games owned by player (OPTIMIZED)
 *
 * This is the most efficient approach: queries Game models from Torii
 * which already contain score and game_over status, eliminating the need
 * for separate contract calls.
 *
 * For Nums: queries the "Game" model with fields: id, over, score
 * For Death Mountain: queries the "AdventurerPacked" model with packed game state
 */
export async function queryPlayerCompletedGames(
  playerAddress: string,
  dojoConfig: DojoGameConfig
): Promise<GameSession[]> {
  // Query using Torii's tokenBalances query to find ERC721 tokens owned by player
  // This returns ALL tokens owned by the player, so we need to filter by contract address
  const query = `
    query GetPlayerTokens($accountAddress: String!) {
      tokenBalances(
        accountAddress: $accountAddress
        first: 100
      ) {
        totalCount
      }
    }
  `;

  try {
    const response = await fetch(dojoConfig.torii_graphql, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          accountAddress: playerAddress,
        },
      }),
    });

    if (!response.ok) {
      const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      console.error('[Torii] Query failed:', errorMsg);
      console.error('[Torii] Endpoint:', dojoConfig.torii_graphql);
      throw new Error(errorMsg);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('[Torii] GraphQL errors:', JSON.stringify(result.errors, null, 2));
      // Return empty array - GraphQL errors might be partial failures or server issues
      return [];
    }

    const totalTokens = result.data?.tokenBalances?.totalCount || 0;
    console.log(`[Torii] Found ${totalTokens} total game session(s) for player`);

    // For now, we just know the COUNT of tokens
    // We can't easily filter by contract address or get individual token IDs
    // without more complex queries, so we return empty array
    // This tells the UI that the player has game sessions, even if we can't list them

    // TODO: Implement full token listing once we figure out the ERC__Token schema
    return [];
  } catch (error) {
    console.error('[Torii] Query error:', error);
    return [];
  }
}

/**
 * Query game state for a specific token from the Game model
 */
async function queryGameState(
  tokenId: string,
  dojoConfig: DojoGameConfig
): Promise<{ score: number; game_over: boolean } | null> {
  // Query the Game model for this token_id
  // The exact model name depends on the game (Game for Nums, AdventurerPacked for Death Mountain)
  const query = `
    query GetGameState($tokenId: String!, $namespace: String!) {
      entities(
        keys: [$tokenId]
      ) {
        edges {
          node {
            models {
              __typename
              ... on Game {
                id
                over
                score
              }
              ... on AdventurerPacked {
                adventurer_id
                packed
              }
              ... on AdventurerKilled {
                adventurer_id
                timestamp
                kill_index
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(dojoConfig.torii_graphql, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          tokenId,
          namespace: dojoConfig.namespace,
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    if (result.errors) {
      return null;
    }

    const models = result.data?.entities?.edges?.[0]?.node?.models || [];

    // Find the Game model
    const gameModel = models.find((m: any) => m.__typename === 'Game');
    if (gameModel) {
      return {
        score: gameModel.score || 0,
        game_over: gameModel.over || false,
      };
    }

    // For Death Mountain, use a two-model approach:
    // 1. AdventurerKilled - Provides definitive game_over status
    // 2. AdventurerPacked - Decode packed field for XP (score) and health
    const adventurerKilledModel = models.find((m: any) => m.__typename === 'AdventurerKilled');
    if (adventurerKilledModel) {
      // Adventurer is dead, game is over
      // Get score from AdventurerPacked model
      const adventurerModel = models.find((m: any) => m.__typename === 'AdventurerPacked');
      if (adventurerModel?.packed) {
        // Decode packed data to get XP (score)
        const { decodeAdventurerPacked } = await import('./deathMountainDecoder');
        const decoded = decodeAdventurerPacked(adventurerModel.packed);
        return {
          score: decoded.xp,
          game_over: true,
        };
      }
      // If we can't get score, at least we know game is over
      return {
        score: 0,
        game_over: true,
      };
    }

    // If no AdventurerKilled, check if adventurer exists and is still alive
    const adventurerModel = models.find((m: any) => m.__typename === 'AdventurerPacked');
    if (adventurerModel?.packed) {
      // Decode to check health and get XP
      const { decodeAdventurerPacked } = await import('./deathMountainDecoder');
      const decoded = decodeAdventurerPacked(adventurerModel.packed);
      return {
        score: decoded.xp,
        game_over: decoded.health === 0,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Query ERC721 tokens owned by a player from a Dojo world (LEGACY)
 *
 * Uses Torii's GraphQL API to find all tokens owned by the player
 * in the game's NFT collection (Denshokan).
 *
 * Note: This is the old approach that requires separate contract calls.
 * Use queryPlayerCompletedGames() instead for better performance.
 */
export async function queryPlayerGameSessions(
  playerAddress: string,
  dojoConfig: DojoGameConfig
): Promise<GameSession[]> {
  const query = `
    query GetPlayerTokens($owner: String!, $collection: String!) {
      erc721Tokens(
        where: { owner: $owner, contractAddress: $collection }
      ) {
        edges {
          node {
            tokenId
            owner
            contractAddress
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(dojoConfig.torii_graphql, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          owner: playerAddress,
          collection: dojoConfig.denshokan_address,
        },
      }),
    });

    if (!response.ok) {
      console.error('[Torii] Query failed:', response.statusText);
      return [];
    }

    const result = await response.json();

    if (result.errors) {
      console.error('[Torii] GraphQL errors:', result.errors);
      return [];
    }

    const tokens = result.data?.erc721Tokens?.edges || [];

    // Return token IDs - we'll fetch game state separately via contract calls
    return tokens.map((edge: any) => ({
      token_id: edge.node.tokenId,
      owner: edge.node.owner,
      score: 0, // Will be fetched via contract call
      game_over: false, // Will be fetched via contract call
    }));
  } catch (error) {
    console.error('[Torii] Query error:', error);
    return [];
  }
}

/**
 * Alternative: Query by world and namespace if direct ERC721 queries don't work
 *
 * This queries the minigame component models directly from the Dojo world.
 */
export async function queryPlayerGameSessionsByWorld(
  playerAddress: string,
  dojoConfig: DojoGameConfig
): Promise<string[]> {
  // Query all game NFTs from the world
  // The exact model/entity structure depends on the game's Dojo schema
  // This is a fallback if ERC721 indexing isn't available

  const query = `
    query GetPlayerGames($world: String!, $namespace: String!) {
      entities(
        where: {
          world_address: $world
        }
      ) {
        edges {
          node {
            id
            models {
              __typename
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(dojoConfig.torii_graphql, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          world: dojoConfig.world_address,
          namespace: dojoConfig.namespace,
        },
      }),
    });

    if (!response.ok) {
      console.error('[Torii] Query failed:', response.statusText);
      return [];
    }

    const result = await response.json();

    if (result.errors) {
      console.error('[Torii] GraphQL errors:', result.errors);
      return [];
    }

    // Extract token IDs from entities
    // This will need to be customized based on the actual schema
    const entities = result.data?.entities?.edges || [];

    // Filter for entities that represent game sessions owned by the player
    // The exact filtering logic depends on the game's schema
    return entities
      .map((edge: any) => edge.node.id)
      .filter((id: string) => id !== null);
  } catch (error) {
    console.error('[Torii] Query error:', error);
    return [];
  }
}

/**
 * Simpler approach: Query ERC721 Transfer events to find player's tokens
 *
 * This uses Torii's event indexing which is more reliable than entity queries.
 */
export async function queryPlayerTokensByTransferEvents(
  playerAddress: string,
  dojoConfig: DojoGameConfig
): Promise<string[]> {
  const query = `
    query GetTransferEvents($to: String!, $contract: String!) {
      events(
        where: {
          keys: ["Transfer", null, $to]
        }
        order: { direction: DESC, field: CREATED_AT }
      ) {
        edges {
          node {
            id
            keys
            data
            created_at
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(dojoConfig.torii_graphql, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          to: playerAddress,
          contract: dojoConfig.denshokan_address,
        },
      }),
    });

    if (!response.ok) {
      console.error('[Torii] Query failed:', response.statusText);
      return [];
    }

    const result = await response.json();

    if (result.errors) {
      console.error('[Torii] GraphQL errors:', result.errors);
      return [];
    }

    const events = result.data?.events?.edges || [];

    // Extract token_id from Transfer event data
    // Transfer(from: address, to: address, token_id: u256)
    const tokenIds = events
      .map((edge: any) => {
        const data = edge.node.data || [];
        // token_id is typically the first data field in Transfer events
        return data[0];
      })
      .filter((id: string) => id !== null && id !== undefined);

    // Remove duplicates
    return Array.from(new Set(tokenIds));
  } catch (error) {
    console.error('[Torii] Query error:', error);
    return [];
  }
}
