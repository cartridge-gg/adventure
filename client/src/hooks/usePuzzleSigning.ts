/**
 * Hook for puzzle signing operations
 *
 * Provides utilities for generating and verifying puzzle signatures
 * using the cryptographic replay protection system.
 */

import { useAccount } from '@starknet-react/core';
import {
  addressFromSolution,
  signatureFromSolution,
  formatSignatureForContract
} from '../signing/puzzleSigning';

export function usePuzzleSigning() {
  const { address } = useAccount();

  /**
   * Generate a signature for puzzle completion
   * @param codeword - The puzzle solution codeword
   * @returns Signature formatted for contract call, or null if no wallet connected
   */
  const generateSignature = (codeword: string): string[] | null => {
    if (!address) {
      console.error('No wallet connected');
      return null;
    }

    try {
      const signature = signatureFromSolution(codeword, address);
      return formatSignatureForContract(signature);
    } catch (error) {
      console.error('Error generating signature:', error);
      return null;
    }
  };

  /**
   * Get the solution address (public key) for a codeword
   * @param codeword - The puzzle solution codeword
   * @returns Solution address (public key derived from codeword)
   */
  const getSolutionAddress = (codeword: string): string => {
    try {
      return addressFromSolution(codeword);
    } catch (error) {
      console.error('Error deriving solution address:', error);
      throw error;
    }
  };

  return {
    generateSignature,
    getSolutionAddress,
    playerAddress: address,
  };
}
