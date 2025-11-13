/**
 * Type declarations for challengeContracts.mjs
 */

export interface DojoManifest {
  contracts: Array<{
    tag: string;
    address: string;
  }>;
  world?: {
    address: string;
  };
}

export const MANIFEST_REGISTRY: Record<string, Record<'mainnet' | 'sepolia', DojoManifest>>;

export function getContractAddress(
  manifestPath: string,
  network: 'mainnet' | 'sepolia',
  tag: string
): string | null;

export function getWorldAddress(
  manifestPath: string,
  network: 'mainnet' | 'sepolia'
): string | null;

export const numsManifestSepolia: DojoManifest;
export const numsManifestMainnet: DojoManifest;
export const deathMountainManifestSepolia: DojoManifest;
export const deathMountainManifestMainnet: DojoManifest;
export const dopewarsManifestSepolia: DojoManifest;
export const dopewarsManifestMainnet: DojoManifest;
