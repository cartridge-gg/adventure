// Consolidated configuration for The Rōnin's Pact
// Environment-based chain configuration - set VITE_CHAIN to 'dev', 'sepolia', or 'mainnet'

import { constants } from "starknet";
import manifestDev from "../../../contracts/manifest_dev.json";
import manifestSepolia from "../../../contracts/manifest_sepolia.json";
import manifestMainnet from "../../../contracts/manifest_mainnet.json";
import wazaConfig from "../../../spec/waza.json";
import { AllowlistedCollection } from "./types";

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

// Find the Quest Manager (actions) contract
const questManagerContract = manifest.contracts?.find((c: any) => c.tag === "ronin_quest-actions");
export const QUEST_MANAGER_ADDRESS = questManagerContract?.address || '0x0';
export const QUEST_MANAGER_ABI = questManagerContract?.abi;

// Find the Ronin Pact NFT contract
const roninPactContract = manifest.external_contracts?.find((c: any) => c.tag === "ronin_quest-ronin_pact");
export const RONIN_PACT_ADDRESS = roninPactContract?.address || '0x0';
export const RONIN_PACT_ABI = roninPactContract?.abi;

// ============================================================================
// ALLOWLISTED COLLECTIONS
// ============================================================================
// Filter collections based on environment

export const ALLOWLISTED_COLLECTIONS: AllowlistedCollection[] = wazaConfig.collections
  .filter((collection: any) => collection.environments.includes(CHAIN_ENV))
  .map((collection: any) => ({
    name: collection.name,
    displayName: collection.displayName,
    address: collection.address === 'self' ? RONIN_PACT_ADDRESS : collection.address,
  }));

// ============================================================================
// LOGGING
// ============================================================================

console.log('Configuration loaded:');
console.log('  Environment:', CHAIN_ENV);
console.log('  Chain ID:', DEFAULT_CHAIN_ID);
console.log('  World:', WORLD_ADDRESS);
console.log('  Quest Manager:', QUEST_MANAGER_ADDRESS);
console.log('  Ronin Pact:', RONIN_PACT_ADDRESS);
console.log('  Allowlisted Collections:', ALLOWLISTED_COLLECTIONS.length);

// Trial metadata - imported from centralized UI text configuration
export { TRIAL_METADATA as TRIALS } from './uiText';
export type TrialName = keyof typeof import('./uiText').TRIAL_METADATA;
