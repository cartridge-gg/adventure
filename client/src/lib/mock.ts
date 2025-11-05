/**
 * Mock Contract Call System
 *
 * This module provides a mock implementation of contract calls that can be easily
 * swapped for real contract interactions. The interface is designed to match the
 * eventual real contract call structure.
 *
 * Usage:
 * - Set USE_MOCK_MODE to false to switch to real contract calls
 * - Each function accepts the same arguments as the real contract call
 * - Responses are customizable via the mock functions
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const USE_MOCK_MODE = true;

// Mock delay to simulate network latency (in ms)
const MOCK_DELAY = 800;

// ============================================================================
// MOCK STATE
// ============================================================================

interface MockState {
  playerTokenId: string | null;
  levelsCompleted: Set<number>;
  username: string | null;
}

// In-memory mock state (would be replaced by actual contract state)
const mockState: MockState = {
  playerTokenId: null,
  levelsCompleted: new Set(),
  username: null,
};

// Reset function for development
export function resetMockState() {
  mockState.playerTokenId = null;
  mockState.levelsCompleted.clear();
  mockState.username = null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simulates network delay
 */
async function mockDelay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulates transaction hash
 */
function generateMockTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Simulates token ID
 */
function generateMockTokenId(): string {
  return Math.floor(Math.random() * 1000000).toString();
}

// ============================================================================
// MOCK CONTRACT CALL INTERFACE
// ============================================================================

export interface MockContractCallOptions<TArgs, TResponse> {
  contractAddress: string;
  entrypoint: string;
  calldata?: TArgs;
  mockResponse?: TResponse;
  mockError?: string;
  mockDelay?: number;
}

/**
 * Generic mock contract call wrapper
 * Can be easily replaced with real contract calls
 */
async function mockContractCall<TArgs, TResponse>(
  options: MockContractCallOptions<TArgs, TResponse>
): Promise<{ success: boolean; data?: TResponse; error?: string; txHash?: string }> {
  console.log('[MOCK] Contract call:', {
    contract: options.contractAddress,
    entrypoint: options.entrypoint,
    calldata: options.calldata,
  });

  await mockDelay(options.mockDelay);

  if (options.mockError) {
    console.error('[MOCK] Error:', options.mockError);
    return { success: false, error: options.mockError };
  }

  const txHash = generateMockTxHash();
  console.log('[MOCK] Success:', { data: options.mockResponse, txHash });

  return {
    success: true,
    data: options.mockResponse,
    txHash,
  };
}

// ============================================================================
// ADVENTURE CONTRACT FUNCTIONS
// ============================================================================

/**
 * Mint Adventure Map NFT
 */
export async function mockMintNFT(
  username: string,
  mockResponse?: { tokenId: string }
): Promise<{ success: boolean; tokenId?: string; error?: string; txHash?: string }> {
  const result = await mockContractCall({
    contractAddress: '0xMOCK_ADVENTURE_CONTRACT',
    entrypoint: 'mint',
    calldata: { username },
    mockResponse: mockResponse || { tokenId: generateMockTokenId() },
  });

  if (result.success && result.data) {
    mockState.playerTokenId = result.data.tokenId;
    mockState.username = username;
    return { success: true, tokenId: result.data.tokenId, txHash: result.txHash };
  }

  return { success: false, error: result.error };
}

/**
 * Complete a level
 */
export async function mockCompleteLevel(
  tokenId: string,
  levelNumber: number,
  proofData: any,
  mockResponse?: { success: boolean }
): Promise<{ success: boolean; error?: string; txHash?: string }> {
  const result = await mockContractCall({
    contractAddress: '0xMOCK_ADVENTURE_CONTRACT',
    entrypoint: 'complete_level',
    calldata: { tokenId, levelNumber, proofData },
    mockResponse: mockResponse || { success: true },
  });

  if (result.success) {
    mockState.levelsCompleted.add(levelNumber);
    return { success: true, txHash: result.txHash };
  }

  return { success: false, error: result.error || 'Failed to complete level' };
}

/**
 * Get player's token ID
 */
export async function mockGetPlayerTokenId(
  playerAddress: string,
  mockResponse?: string
): Promise<{ success: boolean; tokenId?: string; error?: string }> {
  await mockDelay();

  const tokenId = mockResponse || mockState.playerTokenId;

  console.log('[MOCK] Get player token ID:', { playerAddress, tokenId });

  if (tokenId) {
    return { success: true, tokenId };
  }

  return { success: false, error: 'No NFT minted' };
}

/**
 * Get level completion status
 */
export async function mockGetLevelStatus(
  tokenId: string,
  levelNumber: number,
  mockResponse?: boolean
): Promise<{ success: boolean; isComplete?: boolean; error?: string }> {
  await mockDelay(200); // Faster for frequent checks

  const isComplete = mockResponse !== undefined
    ? mockResponse
    : mockState.levelsCompleted.has(levelNumber);

  console.log('[MOCK] Get level status:', { tokenId, levelNumber, isComplete });

  return { success: true, isComplete };
}

/**
 * Get progress bitmap
 */
export async function mockGetProgress(
  tokenId: string,
  mockResponse?: string
): Promise<{ success: boolean; progress?: string; error?: string }> {
  await mockDelay(300);

  // Convert Set to bitmap string (for demo purposes)
  let bitmap = 0;
  mockState.levelsCompleted.forEach(level => {
    bitmap |= (1 << level);
  });

  const progress = mockResponse || '0x' + bitmap.toString(16);

  console.log('[MOCK] Get progress:', { tokenId, progress, levelsCompleted: Array.from(mockState.levelsCompleted) });

  return { success: true, progress };
}

/**
 * Get NFT metadata URI
 */
export async function mockGetTokenURI(
  tokenId: string,
  mockResponse?: string
): Promise<{ success: boolean; uri?: string; error?: string }> {
  await mockDelay(300);

  const uri = mockResponse || `data:application/json;base64,${btoa(JSON.stringify({
    name: `Adventure Map #${tokenId}`,
    description: 'FOCG Adventure Map NFT',
    image: 'mock-svg-data',
    attributes: Array.from(mockState.levelsCompleted).map(level => ({
      trait_type: `Level ${level}`,
      value: 'Complete',
    })),
  }))}`;

  console.log('[MOCK] Get token URI:', { tokenId, uri });

  return { success: true, uri };
}

// ============================================================================
// CODEWORD VERIFICATION (IRL Quests)
// ============================================================================

/**
 * Verify codeword for IRL quests
 * In production, this would derive a wallet from the codeword and sign
 */
export async function mockVerifyCodeword(
  tokenId: string,
  levelNumber: number,
  codeword: string,
  expectedCodeword: string,
  mockResponse?: { success: boolean; error?: string }
): Promise<{ success: boolean; error?: string; txHash?: string }> {
  await mockDelay();

  console.log('[MOCK] Verify codeword:', { tokenId, levelNumber, codeword });

  // Simulate codeword verification
  const isCorrect = codeword.trim().toLowerCase() === expectedCodeword.trim().toLowerCase();

  if (mockResponse) {
    if (mockResponse.success) {
      mockState.levelsCompleted.add(levelNumber);
      return { success: true, txHash: generateMockTxHash() };
    } else {
      return { success: false, error: mockResponse.error };
    }
  }

  if (isCorrect) {
    mockState.levelsCompleted.add(levelNumber);
    return { success: true, txHash: generateMockTxHash() };
  }

  return { success: false, error: 'Incorrect codeword' };
}

// ============================================================================
// EXPORT STATE FOR DEBUGGING
// ============================================================================

export function getMockState(): Readonly<MockState> {
  return {
    playerTokenId: mockState.playerTokenId,
    levelsCompleted: new Set(mockState.levelsCompleted),
    username: mockState.username,
  };
}
