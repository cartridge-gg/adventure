/**
 * Challenge configuration and utilities
 *
 * Loads challenge data from spec/challenges.json and dynamically resolves
 * contract addresses from deployment manifests in refs/.
 *
 * The challenges.json now stores only deployment-specific config (Torii URLs,
 * Denshokan addresses) while contract addresses are pulled from manifests.
 */

import challengesData from '../../../spec/challenges.json';
import { CHAIN_ENV } from './config';
import { getContractAddress, getWorldAddress } from './challengeContracts.mjs';

export interface DojoGameConfig {
  world_address: string;
  torii_url: string;
  torii_graphql: string;
  namespace: string;
  minigame_contract: string; // Minigame system contract address (implements IMinigameTokenData with game_over)
  denshokan_address: string; // ERC721 NFT contract for ownership (Denshokan standard)
}

/**
 * Network-specific deployment config (stored in challenges.json)
 */
interface DojoDeploymentConfig {
  torii_url: string;
  denshokan_address: string;
}

/**
 * Challenge data structure (from challenges.json)
 */
interface ChallengeData {
  level: number;
  game: string;
  description: string;
  location: string;
  manifest_path: string; // Path to manifest in refs/ (e.g., 'nums', 'death-mountain/contracts')
  minigame_tag: string; // Contract tag in manifest (e.g., 'NUMS-Minigame')
  namespace: string; // Dojo namespace
  dojo: {
    mainnet: DojoDeploymentConfig;
    sepolia: DojoDeploymentConfig;
    dev?: DojoGameConfig; // Optional for local development
  };
  notes?: string;
}

/**
 * Challenge with fully resolved config
 */
export interface Challenge {
  level: number;
  game: string;
  description: string;
  location: string;
  manifest_path: string;
  minigame_tag: string;
  namespace: string;
  dojo: {
    mainnet: DojoGameConfig;
    sepolia: DojoGameConfig;
    dev?: DojoGameConfig;
  };
  notes?: string;
}

export type ChallengesData = {
  challenges: ChallengeData[];
};

// Load raw challenges data
const rawChallenges = challengesData as ChallengesData;

/**
 * Build full DojoGameConfig by combining deployment config + manifest lookups
 */
function buildDojoConfig(
  deploymentConfig: DojoDeploymentConfig,
  manifestPath: string,
  minigameTag: string,
  namespace: string,
  network: 'mainnet' | 'sepolia'
): DojoGameConfig {
  const minigameAddress = getContractAddress(manifestPath, network, minigameTag);
  const worldAddress = getWorldAddress(manifestPath, network);

  if (!minigameAddress) {
    console.warn(
      `Failed to resolve minigame contract for ${manifestPath}/${network}/${minigameTag}`
    );
  }

  if (!worldAddress) {
    console.warn(`Failed to resolve world address for ${manifestPath}/${network}`);
  }

  return {
    world_address: worldAddress || '0x0',
    torii_url: deploymentConfig.torii_url,
    torii_graphql: `${deploymentConfig.torii_url}/graphql`,
    namespace,
    minigame_contract: minigameAddress || '0x0',
    denshokan_address: deploymentConfig.denshokan_address,
  };
}

/**
 * Resolve all challenges with full DojoGameConfig
 */
function resolveChallenges(): Challenge[] {
  return rawChallenges.challenges.map((c) => ({
    level: c.level,
    game: c.game,
    description: c.description,
    location: c.location,
    manifest_path: c.manifest_path,
    minigame_tag: c.minigame_tag,
    namespace: c.namespace,
    dojo: {
      mainnet: buildDojoConfig(c.dojo.mainnet, c.manifest_path, c.minigame_tag, c.namespace, 'mainnet'),
      sepolia: buildDojoConfig(c.dojo.sepolia, c.manifest_path, c.minigame_tag, c.namespace, 'sepolia'),
      dev: c.dojo.dev,
    },
    notes: c.notes,
  }));
}

// Export resolved challenges
export const CHALLENGES: { challenges: Challenge[] } = {
  challenges: resolveChallenges(),
};

/**
 * Get challenge configuration for a specific level
 */
export function getChallengeByLevel(level: number): Challenge | undefined {
  return CHALLENGES.challenges.find((c) => c.level === level);
}

/**
 * Get the Dojo configuration for the current environment
 * Returns undefined for dev/sepolia environments (uses MockGame contracts without Torii)
 * Returns full config for mainnet (uses real game Denshokan contracts with Torii)
 */
export function getDojoConfigForChallenge(challenge: Challenge): DojoGameConfig | undefined {
  if (CHAIN_ENV === 'dev' || CHAIN_ENV === 'sepolia') {
    // Dev and Sepolia use MockGame contracts without Torii indexers
    // Return undefined to skip Torii queries and use hardcoded test game_id=1
    return challenge.dojo.dev; // undefined for external games, uses MockGame
  }
  // Mainnet uses real game contracts with Torii indexers
  return challenge.dojo.mainnet;
}

