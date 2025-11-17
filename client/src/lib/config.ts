// Consolidated configuration for The Rōnin's Pact
// Environment-based chain configuration - set VITE_CHAIN to 'dev', 'sepolia', or 'mainnet'

import { constants } from "starknet";
import manifestDev from "../../../contracts/manifest_dev.json" with { type: 'json' };
import manifestSepolia from "../../../contracts/manifest_sepolia.json" with { type: 'json' };
import manifestMainnet from "../../../contracts/manifest_mainnet.json" with { type: 'json' };

// ============================================================================
// ENVIRONMENT-BASED CHAIN SELECTION
// ============================================================================
// Set via VITE_CHAIN environment variable: 'dev', 'sepolia', or 'mainnet'
// Example: VITE_CHAIN=sepolia pnpm build

export const CHAIN_ENV = import.meta.env.VITE_CHAIN || 'dev';

// ============================================================================
// CHAIN CONFIGURATION
// ============================================================================

export const KATANA_CHAIN_ID = "0x4b4154414e41"; // "KATANA" hex-encoded
export const KATANA_URL = "http://localhost:5050";

export const SEPOLIA_CHAIN_ID = constants.StarknetChainId.SN_SEPOLIA;
export const SEPOLIA_URL = "https://api.cartridge.gg/x/starknet/sepolia";

export const MAINNET_CHAIN_ID = constants.StarknetChainId.SN_MAIN;
export const MAINNET_URL = "https://api.cartridge.gg/x/starknet/mainnet";
export const MAINNET_DENSHOKAN_ADDRESS = "0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd";

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

// Find the Adventure contract (Dojo game logic)
const adventureContract = manifest.contracts?.find((c: any) => c.tag === "focg_adventure-actions");
export const ADVENTURE_ADDRESS = adventureContract?.address || '0x0';

// Find ABIs from the separate abis array
// In newer Dojo versions, ABIs are in manifest.abis with .items containing the actual ABI entries
const adventureAbiEntry = manifest.abis?.find((a: any) => a.name === "focg_adventure::systems::actions::IAdventureActions");
export const ADVENTURE_ABI = adventureAbiEntry?.items;

// Find the Map NFT contract (state storage)
const mapContract = manifest.external_contracts?.find((c: any) => c.tag === "focg_adventure-adventure_map");
export const MAP_ADDRESS = mapContract?.address || '0x0';

// Find the Map NFT ABI from the separate abis array
const mapAbiEntry = manifest.abis?.find((a: any) => a.name === "focg_adventure::token::map::IAdventureMap");
export const MAP_ABI = mapAbiEntry?.items;

// ============================================================================
// LOGGING
// ============================================================================

console.log('Configuration loaded:');
console.log('  Environment:', CHAIN_ENV);
console.log('  Chain ID:', DEFAULT_CHAIN_ID);
console.log('  World:', WORLD_ADDRESS);
console.log('  Adventure:', ADVENTURE_ADDRESS);
console.log('  Map:', MAP_ADDRESS);
