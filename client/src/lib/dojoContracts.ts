/**
 * Dojo Contract Addresses from Deployment Manifests
 *
 * This file imports contract addresses directly from the refs/ deployment manifests.
 * When the submodules are updated, the addresses automatically update.
 *
 * To update contract addresses:
 * 1. cd to the project root
 * 2. git submodule update --remote refs/nums refs/death-mountain
 * 3. The imported addresses will automatically reflect the latest deployments
 *
 * The refs are git submodules pointing to the actual game repositories:
 * - refs/nums -> https://github.com/cartridge-gg/nums
 * - refs/death-mountain -> https://github.com/cartridge-gg/loot-survivor
 */

// Import manifests from refs
import numsManifestSepolia from '../../../refs/nums/manifest_sepolia.json';
import numsManifestMainnet from '../../../refs/nums/manifest_mainnet.json';
import deathMountainManifestSepolia from '../../../refs/death-mountain/contracts/manifest_sepolia.json';
import deathMountainManifestMainnet from '../../../refs/death-mountain/contracts/manifest_mainnet.json';

/**
 * Manifest structure for Dojo contracts
 */
interface DojoManifest {
  contracts: Array<{
    tag: string;
    address: string;
  }>;
}

/**
 * Find contract address by tag in manifest
 */
function findContractAddress(manifest: DojoManifest, tag: string): string | null {
  const contract = manifest.contracts.find((c) => c.tag === tag);
  return contract?.address || null;
}

/**
 * Nums Minigame Contract Addresses
 */
export const NUMS_MINIGAME = {
  sepolia: findContractAddress(numsManifestSepolia as DojoManifest, 'NUMS-Minigame'),
  mainnet: findContractAddress(numsManifestMainnet as DojoManifest, 'NUMS-Minigame'),
};

/**
 * Death Mountain Game Token Systems Contract Addresses
 */
export const DEATH_MOUNTAIN_GAME_TOKEN_SYSTEMS = {
  sepolia: findContractAddress(
    deathMountainManifestSepolia as DojoManifest,
    'ls_0_0_9-game_token_systems'
  ),
  mainnet: findContractAddress(
    deathMountainManifestMainnet as DojoManifest,
    'ls_0_0_9-game_token_systems'
  ),
};

/**
 * Validate that all addresses were found
 */
if (!NUMS_MINIGAME.sepolia) {
  console.warn('Warning: NUMS-Minigame address not found in sepolia manifest');
}
if (!NUMS_MINIGAME.mainnet) {
  console.warn('Warning: NUMS-Minigame address not found in mainnet manifest');
}
if (!DEATH_MOUNTAIN_GAME_TOKEN_SYSTEMS.sepolia) {
  console.warn('Warning: ls_0_0_9-game_token_systems address not found in sepolia manifest');
}
if (!DEATH_MOUNTAIN_GAME_TOKEN_SYSTEMS.mainnet) {
  console.warn('Warning: ls_0_0_9-game_token_systems address not found in mainnet manifest');
}
