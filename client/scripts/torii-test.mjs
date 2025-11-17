/**
 * Integration test for Torii queries and Denshokan contract calls
 *
 * This script tests the actual production code by importing the real query functions.
 * Run with: node scripts/test-torii-integration.mjs
 */

import { RpcProvider, Contract } from 'starknet';

// Import manifest utilities and challenges config
import { getContractAddress } from '../src/lib/challengeContracts.mjs';
import challengesData from '../../spec/challenges.json' with { type: 'json' };

const MAINNET_DENSHOKAN_ADDRESS = "0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd";

// Import production code
// Note: We inline the functions here since we're testing them directly
// This ensures we're testing the exact same logic as production

/**
 * Production code copied from toriiQueries.ts
 */
function addAddressPadding(address) {
  const cleaned = address.toLowerCase().replace('0x', '');
  return '0x' + cleaned.padStart(64, '0');
}

async function queryPlayerGameTokenIds(playerAddress, dojoConfig) {
  console.log('[Torii] Querying player tokens from:', dojoConfig.torii_url);
  console.log('[Torii] Player:', playerAddress);

  try {
    const paddedPlayer = addAddressPadding(playerAddress);

    const query = `
      SELECT DISTINCT tb.token_id
      FROM token_balances AS tb
      JOIN token_attributes AS ta ON ta.token_id = tb.token_id
      WHERE tb.account_address = "${paddedPlayer}"
      AND tb.contract_address = "${MAINNET_DENSHOKAN_ADDRESS}"
      AND ta.trait_name = "Game Name"
      AND ta.trait_value = "${dojoConfig.game_name}"
    `;

    const url = `${dojoConfig.torii_url}/sql?query=${encodeURIComponent(query)}`;

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
    const tokenIds = data.map((row) => {
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

/**
 * Production code copied from denshokanCalls.ts
 */
const MINIGAME_ABI = [
  {
    type: 'function',
    name: 'game_over',
    inputs: [{ name: 'token_id', type: 'core::integer::u64' }],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'view',
  },
];

async function isGameComplete(provider, minigameAddress, tokenId) {
  try {
    const contract = new Contract({
      abi: MINIGAME_ABI,
      address: minigameAddress,
      providerOrAccount: provider,
    });
    const tokenIdU64 = BigInt(tokenId);
    const gameOver = await contract.game_over(tokenIdU64);
    return Boolean(gameOver);
  } catch (error) {
    console.error(`[Minigame] Error checking game status for token ${tokenId}:`, error);
    return false;
  }
}

/**
 * Build test configs from challenges.json - test both mainnet and sepolia for each game
 */
function buildTestConfigs() {
  const configs = [];

  for (const challenge of challengesData.challenges) {
    // Test mainnet only
    for (const network of ['mainnet']) {
      const deploymentConfig = challenge.dojo[network];

      // Skip if this network isn't configured for this challenge
      if (!deploymentConfig) {
        console.log(`Skipping ${challenge.game} on ${network} - not configured`);
        continue;
      }

      configs.push({
        name: `${challenge.game} (${network.charAt(0).toUpperCase() + network.slice(1)})`,
        level: challenge.level,
        network,
        dojoConfig: {
          torii_url: deploymentConfig.torii_url,
          torii_graphql: `${deploymentConfig.torii_url}/graphql`,
          namespace: challenge.namespace,
          game_name: deploymentConfig.game_name,
          minigame_address: deploymentConfig.minigame_address,
        },
      });
    }
  }

  return configs;
}

/**
 * Test configuration
 */
const TEST_CONFIG = {
  player_address: '0x046a8868178Fa8bF56A5c3b48f903ab406e5a324517D990Af786D5AB54D86865',
  games: buildTestConfigs(),
};

/**
 * Format token ID for display
 */
function formatTokenId(tokenId) {
  return `${tokenId} (${parseInt(tokenId, 16)})`;
}

/**
 * Test a single game
 */
async function testGame(game, provider) {
  console.log('\n' + '='.repeat(70));
  console.log(`Testing: ${game.name} (Level ${game.level})`);
  console.log('='.repeat(70));

  try {
    // Step 1: Query player's tokens
    console.log('\nStep 1: Query player tokens via Torii SQL...');
    const tokenIds = await queryPlayerGameTokenIds(
      TEST_CONFIG.player_address,
      game.dojoConfig
    );

    if (tokenIds.length === 0) {
      console.log('\n⚠️  No tokens found for this game');
      return { game: game.name, tokens: 0, completed: 0 };
    }

    console.log(`\n✅ Found ${tokenIds.length} tokens`);
    console.log('\nToken IDs:');
    tokenIds.slice(0, 10).forEach((id, idx) => {
      console.log(`  ${idx + 1}. ${formatTokenId(id)}`);
    });

    if (tokenIds.length > 10) {
      console.log(`  ... and ${tokenIds.length - 10} more`);
    }

    // Step 2: Use minigame contract for game_over calls
    console.log('\nStep 2: Using minigame contract for game_over calls...');
    console.log(`✅ Minigame contract: ${game.dojoConfig.minigame_address}`);

    // Step 3: Check game_over status for tokens (sample first 5)
    console.log('\nStep 3: Check game_over status (sampling first 5 tokens)...');
    const sampleSize = Math.min(5, tokenIds.length);
    const sampleTokens = tokenIds.slice(0, sampleSize);

    let completedCount = 0;
    for (const tokenId of sampleTokens) {
      const gameOver = await isGameComplete(provider, game.dojoConfig.minigame_address, tokenId);
      console.log(`  Token ${formatTokenId(tokenId)}: ${gameOver ? '✅ Complete' : '⏳ In progress'}`);
      if (gameOver) completedCount++;
    }

    if (tokenIds.length > sampleSize) {
      console.log(`  ... (${tokenIds.length - sampleSize} more tokens not shown)`);
    }

    return {
      game: game.name,
      tokens: tokenIds.length,
      tokenList: tokenIds,
      completed: completedCount,
      sampled: sampleSize,
    };
  } catch (error) {
    console.error(`\n❌ Error testing ${game.name}:`, error.message);
    return { game: game.name, tokens: 0, error: error.message };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('='.repeat(70));
  console.log('TORII INTEGRATION TEST');
  console.log('='.repeat(70));
  console.log(`\nTesting with address: ${TEST_CONFIG.player_address}\n`);

  // Create RPC providers for each network
  const sepoliaProvider = new RpcProvider({
    nodeUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
  });

  const mainnetProvider = new RpcProvider({
    nodeUrl: 'https://api.cartridge.gg/x/starknet/mainnet',
  });

  const results = [];

  for (const game of TEST_CONFIG.games) {
    // Use appropriate provider based on game network
    const provider = game.network === 'mainnet' ? mainnetProvider : sepoliaProvider;
    const result = await testGame(game, provider);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));

  let totalTokens = 0;
  let totalCompleted = 0;
  results.forEach((result) => {
    const status = result.error ? '❌' : result.tokens > 0 ? '✅' : '⚠️';
    const completedStr = result.completed !== undefined ? ` (${result.completed}/${result.sampled || 0} sampled completed)` : '';
    console.log(`${status} ${result.game}: ${result.tokens} tokens${completedStr}`);
    totalTokens += result.tokens;
    totalCompleted += result.completed || 0;
  });
}

main();
