/**
 * Hook for Adventure contract interactions
 *
 * Provides functions to interact with the focg_adventure contracts
 */

import { useAccount, useContract } from '@starknet-react/core';
import { Call } from 'starknet';
import { ACTIONS_ADDRESS, ACTIONS_ABI, ADVENTURE_MAP_ADDRESS, ADVENTURE_MAP_ABI } from '../lib/config';

export function useAdventureContract() {
  const { account } = useAccount();

  // Actions contract (for gameplay)
  const { contract: actionsContract } = useContract({
    address: ACTIONS_ADDRESS,
    abi: ACTIONS_ABI,
  });

  // Adventure Map NFT contract
  const { contract: mapContract } = useContract({
    address: ADVENTURE_MAP_ADDRESS,
    abi: ADVENTURE_MAP_ABI,
  });

  /**
   * Mint a new Adventure Map NFT
   */
  const mintAdventureMap = async (username: string): Promise<{
    success: boolean;
    txHash?: string;
    tokenId?: string;
    error?: string;
  }> => {
    if (!account || !mapContract) {
      return { success: false, error: 'Wallet not connected or contract not loaded' };
    }

    try {
      console.log('[Contract] Minting Adventure Map:', { username });

      // Call the mint function
      const call: Call = {
        contractAddress: ADVENTURE_MAP_ADDRESS,
        entrypoint: 'mint',
        calldata: [username], // Adjust based on actual contract interface
      };

      const result = await account.execute([call]);
      console.log('[Contract] Mint transaction sent:', result.transaction_hash);

      // Wait for confirmation
      await account.waitForTransaction(result.transaction_hash);
      console.log('[Contract] Mint transaction confirmed');

      // TODO: Extract token ID from events
      // For now, return success without token ID
      return {
        success: true,
        txHash: result.transaction_hash,
      };
    } catch (error: any) {
      console.error('[Contract] Error minting:', error);
      return {
        success: false,
        error: error.message || 'Failed to mint Adventure Map',
      };
    }
  };

  /**
   * Complete a puzzle level with cryptographic signature
   */
  const completePuzzleLevel = async (
    mapId: string,
    levelNumber: number,
    signature: string[]
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> => {
    if (!account || !actionsContract) {
      return { success: false, error: 'Wallet not connected or contract not loaded' };
    }

    try {
      console.log('[Contract] Completing puzzle level:', {
        mapId,
        levelNumber,
        signatureLength: signature.length,
      });

      // Build the call
      const call: Call = {
        contractAddress: ACTIONS_ADDRESS,
        entrypoint: 'complete_puzzle_level',
        calldata: [
          mapId,                    // map_id: u256 (will be split into low/high)
          '0',                       // map_id high (u256 is 2 felts)
          levelNumber.toString(),    // level_number: u8
          signature.length.toString(), // signature span length
          ...signature,              // signature data [r, s]
        ],
      };

      const result = await account.execute([call]);
      console.log('[Contract] Puzzle completion transaction sent:', result.transaction_hash);

      // Wait for confirmation
      await account.waitForTransaction(result.transaction_hash);
      console.log('[Contract] Puzzle completion confirmed');

      return {
        success: true,
        txHash: result.transaction_hash,
      };
    } catch (error: any) {
      console.error('[Contract] Error completing puzzle:', error);

      // Parse error messages
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
        error: errorMessage,
      };
    }
  };

  /**
   * Complete an onchain game level
   */
  const completeOnchainLevel = async (
    mapId: string,
    levelNumber: number,
    proof: any
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> => {
    if (!account || !actionsContract) {
      return { success: false, error: 'Wallet not connected or contract not loaded' };
    }

    try {
      console.log('[Contract] Completing onchain level:', {
        mapId,
        levelNumber,
      });

      const call: Call = {
        contractAddress: ACTIONS_ADDRESS,
        entrypoint: 'complete_onchain_level',
        calldata: [
          mapId,
          '0', // u256 high
          levelNumber.toString(),
          // Add proof data here based on level requirements
        ],
      };

      const result = await account.execute([call]);
      console.log('[Contract] Onchain level transaction sent:', result.transaction_hash);

      await account.waitForTransaction(result.transaction_hash);
      console.log('[Contract] Onchain level confirmed');

      return {
        success: true,
        txHash: result.transaction_hash,
      };
    } catch (error: any) {
      console.error('[Contract] Error completing onchain level:', error);
      return {
        success: false,
        error: error.message || 'Failed to complete level',
      };
    }
  };

  /**
   * Get player's token ID (if they have minted)
   */
  const getPlayerTokenId = async (playerAddress: string): Promise<{
    success: boolean;
    tokenId?: string;
    error?: string;
  }> => {
    if (!mapContract) {
      return { success: false, error: 'Contract not loaded' };
    }

    try {
      // This depends on your NFT contract implementation
      // You might need to:
      // 1. Query a mapping of player -> token ID
      // 2. Check balance and enumerate tokens
      // 3. Use an indexer/events

      // Placeholder - implement based on your contract
      console.log('[Contract] Get player token ID not yet implemented');

      return {
        success: false,
        error: 'Not implemented - use indexer or events',
      };
    } catch (error: any) {
      console.error('[Contract] Error getting token ID:', error);
      return {
        success: false,
        error: error.message || 'Failed to get token ID',
      };
    }
  };

  /**
   * Check if a level is complete
   */
  const isLevelComplete = async (
    mapId: string,
    levelNumber: number
  ): Promise<{
    success: boolean;
    isComplete?: boolean;
    error?: string;
  }> => {
    if (!mapContract) {
      return { success: false, error: 'Contract not loaded' };
    }

    try {
      // Call the view function to check level completion
      const result = await mapContract.is_level_complete(mapId, levelNumber);

      return {
        success: true,
        isComplete: result as boolean,
      };
    } catch (error: any) {
      console.error('[Contract] Error checking level completion:', error);
      return {
        success: false,
        error: error.message || 'Failed to check level completion',
      };
    }
  };

  return {
    mintAdventureMap,
    completePuzzleLevel,
    completeOnchainLevel,
    getPlayerTokenId,
    isLevelComplete,
    isConnected: !!account,
    actionsContract,
    mapContract,
  };
}
