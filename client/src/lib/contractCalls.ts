/**
 * Real Contract Call Functions
 *
 * This module provides functions for interacting with the Adventure contracts.
 * These functions use real Starknet/Dojo contract calls.
 */

import { Account } from 'starknet';

// Contract addresses (will be set from environment or config)
const ACTIONS_CONTRACT_ADDRESS = import.meta.env.VITE_ACTIONS_CONTRACT_ADDRESS;

/**
 * Complete a puzzle level with cryptographic signature
 *
 * @param account - The player's Starknet account
 * @param mapId - The NFT token ID
 * @param levelNumber - The level number to complete
 * @param signature - The signature array [r, s]
 * @returns Transaction hash
 */
export async function completePuzzleLevel(
  account: Account,
  mapId: string,
  levelNumber: number,
  signature: string[]
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!ACTIONS_CONTRACT_ADDRESS) {
      console.error('VITE_ACTIONS_CONTRACT_ADDRESS not configured');
      return { success: false, error: 'Contract address not configured' };
    }

    console.log('[Contract] Complete puzzle level:', {
      contract: ACTIONS_CONTRACT_ADDRESS,
      mapId,
      levelNumber,
      signature: signature.map(s => s.substring(0, 10) + '...')
    });

    // Execute the contract call
    const result = await account.execute([
      {
        contractAddress: ACTIONS_CONTRACT_ADDRESS,
        entrypoint: 'complete_puzzle_level',
        calldata: [
          mapId,          // map_id: u256 (BigInt will be split into low/high)
          levelNumber,    // level_number: u8
          signature.length, // signature array length
          ...signature    // signature data [r, s]
        ]
      }
    ]);

    console.log('[Contract] Transaction sent:', result.transaction_hash);

    // Wait for transaction to be accepted
    await account.waitForTransaction(result.transaction_hash);

    console.log('[Contract] Transaction confirmed:', result.transaction_hash);

    return {
      success: true,
      txHash: result.transaction_hash
    };

  } catch (error: any) {
    console.error('[Contract] Error completing puzzle level:', error);

    // Parse error message
    let errorMessage = 'Failed to complete level';
    if (error.message) {
      if (error.message.includes('Invalid solution')) {
        errorMessage = 'Invalid solution signature';
      } else if (error.message.includes('Level not found')) {
        errorMessage = 'Level configuration not found';
      } else if (error.message.includes('Level already complete')) {
        errorMessage = 'Level already completed';
      } else if (error.message.includes('Not map owner')) {
        errorMessage = 'You do not own this adventure map';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get player's token ID
 *
 * @param account - The player's Starknet account
 * @returns Token ID if player has minted, null otherwise
 */
export async function getPlayerTokenId(
  account: Account
): Promise<{ success: boolean; tokenId?: string; error?: string }> {
  try {
    if (!ACTIONS_CONTRACT_ADDRESS) {
      return { success: false, error: 'Contract address not configured' };
    }

    // This would call a view function on the contract
    // Implementation depends on your contract's interface
    // For now, this is a placeholder

    console.log('[Contract] Get player token ID not yet implemented');

    return {
      success: false,
      error: 'Not implemented'
    };

  } catch (error: any) {
    console.error('[Contract] Error getting token ID:', error);
    return {
      success: false,
      error: error.message || 'Failed to get token ID'
    };
  }
}
