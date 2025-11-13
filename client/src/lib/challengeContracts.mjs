/**
 * Challenge Game Contract Addresses from Deployment Manifests (JavaScript/ESM)
 *
 * This provides access to external Dojo game manifests (Nums, Death Mountain, etc.)
 * for challenge verification in JavaScript/Node scripts.
 *
 * When the submodules are updated, the addresses automatically update.
 */

// Import manifests from refs
import numsManifestSepolia from '../../../refs/nums/manifest_sepolia.json' with { type: 'json' };
import numsManifestMainnet from '../../../refs/nums/manifest_mainnet.json' with { type: 'json' };
import dopewarsManifestSepolia from '../../../refs/dopewars/manifest_provable-dw.json' with { type: 'json' };
import dopewarsManifestMainnet from '../../../refs/dopewars/manifest_mainnet.json' with { type: 'json' };
import deathMountainManifestSepolia from '../../../refs/death-mountain/contracts/manifest_sepolia.json' with { type: 'json' };
import deathMountainManifestMainnet from '../../../refs/death-mountain/contracts/manifest_mainnet.json' with { type: 'json' };

// Export manifests for direct use
export {
  numsManifestSepolia,
  numsManifestMainnet,
  deathMountainManifestSepolia,
  deathMountainManifestMainnet,
  dopewarsManifestSepolia,
  dopewarsManifestMainnet,
};

/**
 * Manifest registry - maps manifest_path to actual manifest imports
 */
export const MANIFEST_REGISTRY = {
  nums: {
    mainnet: numsManifestMainnet,
    sepolia: numsManifestSepolia,
  },
  'death-mountain/contracts': {
    mainnet: deathMountainManifestMainnet,
    sepolia: deathMountainManifestSepolia,
  },
  dopewars: {
    mainnet: dopewarsManifestMainnet,
    sepolia: dopewarsManifestSepolia,
  },
};

/**
 * Find contract address by tag in manifest
 */
function findContractAddress(manifest, tag) {
  const contract = manifest.contracts.find((c) => c.tag === tag);
  return contract?.address || null;
}

/**
 * Get contract address from manifest by path, network, and tag
 *
 * @param {string} manifestPath - Path to manifest (e.g., 'nums', 'death-mountain/contracts')
 * @param {'mainnet' | 'sepolia'} network - Network to use
 * @param {string} tag - Contract tag to find (e.g., 'NUMS-Minigame', 'ls_0_0_9-game_token_systems')
 * @returns {string | null} Contract address or null if not found
 */
export function getContractAddress(manifestPath, network, tag) {
  const manifests = MANIFEST_REGISTRY[manifestPath];
  if (!manifests) {
    console.warn(`Manifest path "${manifestPath}" not found in registry`);
    return null;
  }

  const manifest = manifests[network];
  if (!manifest) {
    console.warn(`Network "${network}" not found for manifest path "${manifestPath}"`);
    return null;
  }

  return findContractAddress(manifest, tag);
}

/**
 * Get world address from manifest
 *
 * @param {string} manifestPath - Path to manifest
 * @param {'mainnet' | 'sepolia'} network - Network to use
 * @returns {string | null} World address or null if not found
 */
export function getWorldAddress(manifestPath, network) {
  const manifests = MANIFEST_REGISTRY[manifestPath];
  if (!manifests) {
    console.warn(`Manifest path "${manifestPath}" not found in registry`);
    return null;
  }

  const manifest = manifests[network];
  if (!manifest) {
    console.warn(`Network "${network}" not found for manifest path "${manifestPath}"`);
    return null;
  }

  return manifest.world?.address || null;
}
