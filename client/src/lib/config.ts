// Consolidated configuration for The Rōnin's Pact
// Environment-based chain configuration - set VITE_CHAIN to 'dev', 'sepolia', or 'mainnet'

import { constants } from "starknet";
import manifestDev from "../../../contracts/manifest_dev.json";
import manifestSepolia from "../../../contracts/manifest_sepolia.json";
import manifestMainnet from "../../../contracts/manifest_mainnet.json";

// ============================================================================
// ENVIRONMENT-BASED CHAIN SELECTION
// ============================================================================
// Set via VITE_CHAIN environment variable: 'dev', 'sepolia', or 'mainnet'
// Example: VITE_CHAIN=sepolia pnpm build

const CHAIN_ENV = import.meta.env.VITE_CHAIN || 'dev';

// ============================================================================
// CHAIN CONFIGURATION
// ============================================================================

export const KATANA_CHAIN_ID = "0x4b4154414e41"; // "KATANA" hex-encoded
export const KATANA_URL = "http://localhost:5050";

export const SEPOLIA_CHAIN_ID = constants.StarknetChainId.SN_SEPOLIA;
export const SEPOLIA_URL = "https://api.cartridge.gg/x/starknet/sepolia";

export const MAINNET_CHAIN_ID = constants.StarknetChainId.SN_MAIN;
export const MAINNET_URL = "https://api.cartridge.gg/x/starknet/mainnet";

// ============================================================================
// MANIFEST SELECTION
// ============================================================================
// Select manifest based on environment variable

function getManifestForEnv(env: string) {
  switch (env) {
    case 'sepolia':
      return manifestSepolia;
    case 'mainnet':
      return manifestMainnet;
    case 'dev':
    default:
      return manifestDev;
  }
}

function getChainIdForEnv(env: string) {
  switch (env) {
    case 'sepolia':
      return SEPOLIA_CHAIN_ID;
    case 'mainnet':
      return MAINNET_CHAIN_ID;
    case 'dev':
    default:
      return KATANA_CHAIN_ID;
  }
}

function getRpcUrlForEnv(env: string) {
  switch (env) {
    case 'sepolia':
      return SEPOLIA_URL;
    case 'mainnet':
      return MAINNET_URL;
    case 'dev':
    default:
      return KATANA_URL;
  }
}

const manifest = getManifestForEnv(CHAIN_ENV);
export const DEFAULT_CHAIN_ID = getChainIdForEnv(CHAIN_ENV);
export const DEFAULT_RPC_URL = getRpcUrlForEnv(CHAIN_ENV);

// ============================================================================
// CONTRACT ADDRESSES AND ABIS FROM MANIFEST
// ============================================================================

export const WORLD_ADDRESS = manifest.world.address;

// Find the Adventure Actions contract
const actionsContract = manifest.contracts?.find((c: any) => c.tag === "focg_adventure-actions");
export const ACTIONS_ADDRESS = actionsContract?.address || '0x0';
export const ACTIONS_ABI = actionsContract?.abi;

// Find the Adventure Map NFT contract
const adventureMapContract = manifest.external_contracts?.find((c: any) => c.tag === "focg_adventure-AdventureMap");
export const ADVENTURE_MAP_ADDRESS = adventureMapContract?.address || '0x0';
export const ADVENTURE_MAP_ABI = adventureMapContract?.abi;

// ============================================================================
// LOGGING
// ============================================================================

console.log('Configuration loaded:');
console.log('  Environment:', CHAIN_ENV);
console.log('  Chain ID:', DEFAULT_CHAIN_ID);
console.log('  World:', WORLD_ADDRESS);
console.log('  Actions:', ACTIONS_ADDRESS);
console.log('  Adventure Map:', ADVENTURE_MAP_ADDRESS);
