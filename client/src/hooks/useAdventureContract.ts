/**
 * Hook for Adventure contract interactions
 *
 * Provides functions to interact with the focg_adventure contracts
 */

import { useAccount, useContract } from '@starknet-react/core';
import { CallData, shortString } from 'starknet';
import { ADVENTURE_ADDRESS, ADVENTURE_ABI, MAP_ADDRESS, MAP_ABI } from '../lib/config';
import { executeTx, parseContractError, splitTokenIdToU256 } from '../lib/utils';

export function useAdventureContract() {
  const { account } = useAccount();

  // Adventure contract (Dojo game logic)
  const { contract: adventureContract } = useContract({
    address: ADVENTURE_ADDRESS as `0x${string}`,
    abi: ADVENTURE_ABI as any,
  });

  // Map NFT contract (state storage)
  const { contract: mapContract } = useContract({
    address: MAP_ADDRESS as `0x${string}`,
    abi: MAP_ABI as any,
  });

  /**
   * Mint a new Adventure Map NFT
   * Calls the mint function on the Adventure (Actions) contract
   */
  const mintAdventureMap = async (username: string): Promise<{
    success: boolean;
    txHash?: string;
    tokenId?: string;
    error?: string;
  }> => {
    if (!account) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // Encode username as felt252 (Cairo short string)
      // Truncate to 31 characters max for felt252 compatibility
      const usernameFelt = shortString.encodeShortString(username.slice(0, 31));

      // Call the mint function on the Adventure contract
      const result = await executeTx(
        account,
        {
          contractAddress: ADVENTURE_ADDRESS,
          entrypoint: 'mint',
          calldata: CallData.compile([usernameFelt]),
        },
        'Mint Adventure Map'
      );

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
        error: parseContractError(error),
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
    if (!account || !adventureContract) {
      return { success: false, error: 'Wallet not connected or contract not loaded' };
    }

    try {
      console.log('[Contract] Completing puzzle level:', {
        mapId,
        levelNumber,
        signatureLength: signature.length,
      });

      // Split map_id into u256 components
      const { low, high } = splitTokenIdToU256(mapId);

      // Build the call
      const result = await executeTx(
        account,
        {
          contractAddress: ADVENTURE_ADDRESS,
          entrypoint: 'complete_puzzle_level',
          calldata: CallData.compile({
            map_id: { low, high },
            level_number: levelNumber,
            signature: signature,
          }),
        },
        'Complete Puzzle Level'
      );

      return {
        success: true,
        txHash: result.transaction_hash,
      };
    } catch (error: any) {
      console.error('[Contract] Error completing puzzle:', error);
      return {
        success: false,
        error: parseContractError(error),
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
    if (!account || !adventureContract) {
      return { success: false, error: 'Wallet not connected or contract not loaded' };
    }

    try {
      console.log('[Contract] Completing onchain level:', {
        mapId,
        levelNumber,
        proof,
      });

      // Split map_id into u256 components
      const { low, high } = splitTokenIdToU256(mapId);

      // Build the call with game_id from proof
      const result = await executeTx(
        account,
        {
          contractAddress: ADVENTURE_ADDRESS,
          entrypoint: 'complete_challenge_level',
          calldata: CallData.compile({
            map_id: { low, high },
            level_number: levelNumber,
            game_id: proof.game_id || 1, // game_id for verification
          }),
        },
        'Complete Challenge Level'
      );

      return {
        success: true,
        txHash: result.transaction_hash,
      };
    } catch (error: any) {
      console.error('[Contract] Error completing onchain level:', error);
      return {
        success: false,
        error: parseContractError(error),
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
    isLevelComplete,
  };
}
