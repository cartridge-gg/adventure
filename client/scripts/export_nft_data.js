/**
 * Export NFT Data to CSV
 *
 * Queries the Adventure Map NFT contract on Starknet mainnet and exports:
 * - Token ID
 * - Username
 * - Timestamp (when minted)
 * - Highest level completed (0-5)
 */

import { RpcProvider, CallData } from 'starknet';
import fs from 'fs';

// Configuration
const MAP_ADDRESS = '0x1aec82a183d97504e8ee6c3cf1f7c3f7b9aad291b5f467df33441493884ac4b';
const RPC_URL = 'https://api.cartridge.gg/x/starknet/mainnet';
const TOTAL_LEVELS = 5;
const BATCH_SIZE = 20;
const MAX_TOKENS = 500;
const MAX_CONSECUTIVE_ERRORS = 5;

/**
 * Decode username from felt252
 */
function decodeUsername(usernameFelt) {
  try {
    const feltBigInt = BigInt(usernameFelt);
    if (feltBigInt === 0n) return 'Anonymous';

    // Convert felt to hex string and decode as Cairo short string
    const hex = feltBigInt.toString(16);
    // Pad to even length
    const paddedHex = hex.length % 2 ? '0' + hex : hex;
    const bytes = paddedHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
    const username = String.fromCharCode(...bytes.filter(b => b !== 0));

    return username || 'Anonymous';
  } catch (error) {
    console.error('Error decoding username:', error);
    return 'Anonymous';
  }
}

/**
 * Get highest level completed from progress bitmap
 */
function getHighestLevel(progressBitmap) {
  let highest = 0;
  const progressBI = BigInt(progressBitmap);
  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    const mask = 1n << BigInt(level);
    if ((progressBI & mask) !== 0n) {
      highest = level;
    }
  }
  return highest;
}

/**
 * Convert number to u256 Cairo struct
 */
function toU256(value) {
  const val = BigInt(value);
  return {
    low: val & ((1n << 128n) - 1n),
    high: val >> 128n,
  };
}

/**
 * Format timestamp as readable date
 */
function formatTimestamp(unixTimestamp) {
  const timestamp = Number(unixTimestamp);
  if (timestamp === 0) return '';
  const date = new Date(timestamp * 1000);
  return date.toISOString();
}

/**
 * Load data for a single token using direct RPC calls
 */
async function loadTokenData(provider, tokenId) {
  try {
    const tokenU256 = toU256(tokenId);

    // Try to get owner_of (will fail if token doesn't exist)
    try {
      await provider.callContract({
        contractAddress: MAP_ADDRESS,
        entrypoint: 'owner_of',
        calldata: CallData.compile({ token_id: tokenU256 }),
      });
    } catch (error) {
      // Token doesn't exist
      return null;
    }

    // Token exists, get its data in parallel
    const [usernameResult, progressResult, timestampResult] = await Promise.all([
      provider.callContract({
        contractAddress: MAP_ADDRESS,
        entrypoint: 'get_username',
        calldata: CallData.compile({ token_id: tokenU256 }),
      }),
      provider.callContract({
        contractAddress: MAP_ADDRESS,
        entrypoint: 'get_progress',
        calldata: CallData.compile({ token_id: tokenU256 }),
      }),
      provider.callContract({
        contractAddress: MAP_ADDRESS,
        entrypoint: 'get_timestamp',
        calldata: CallData.compile({ token_id: tokenU256 }),
      }),
    ]);

    // Parse results
    const username = decodeUsername(usernameResult[0]);
    const progress = progressResult[0];
    const timestamp = timestampResult[0];
    const highestLevel = getHighestLevel(progress);

    return {
      tokenId: tokenId.toString(),
      username,
      timestamp: formatTimestamp(timestamp),
      highestLevel,
    };
  } catch (error) {
    // Token doesn't exist or error occurred
    console.error(`Error loading token ${tokenId}:`, error.message);
    return null;
  }
}

/**
 * Main function to export data
 */
async function exportData() {
  console.log('Connecting to Starknet mainnet...');

  // Setup provider
  const provider = new RpcProvider({ nodeUrl: RPC_URL });

  console.log('Querying NFT data...');
  const allEntries = [];
  let tokenId = 0n;
  let consecutiveErrors = 0;

  while (tokenId < MAX_TOKENS && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
    // Create batch of token IDs
    const batchTokenIds = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      batchTokenIds.push(tokenId + BigInt(i));
    }

    // Query batch in parallel
    const batchResults = await Promise.all(
      batchTokenIds.map(id => loadTokenData(provider, id))
    );

    // Process results
    let foundInBatch = false;
    for (const entry of batchResults) {
      if (entry) {
        allEntries.push(entry);
        foundInBatch = true;
        consecutiveErrors = 0;
      }
    }

    // Update progress
    tokenId += BigInt(BATCH_SIZE);
    console.log(`Progress: Found ${allEntries.length} tokens (checked up to ${tokenId})...`);

    // If no tokens found in batch, increment error counter
    if (!foundInBatch) {
      consecutiveErrors++;
    }
  }

  console.log(`\nTotal tokens found: ${allEntries.length}`);

  // Create CSV
  const csvLines = [
    'Token ID,Username,Timestamp,Highest Level',
    ...allEntries.map(entry =>
      `${entry.tokenId},${entry.username},${entry.timestamp},${entry.highestLevel}`
    )
  ];

  const csv = csvLines.join('\n');

  // Write to file
  const outputPath = 'nft_data.csv';
  fs.writeFileSync(outputPath, csv);

  console.log(`\nData exported to ${outputPath}`);
  console.log(`\nPreview (first 10 entries):`);
  console.log(csvLines.slice(0, 11).join('\n'));

  return csv;
}

// Run the export
exportData()
  .then(() => {
    console.log('\nExport completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
