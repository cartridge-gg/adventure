import { PropsWithChildren } from "react";

import { Chain, sepolia, mainnet } from "@starknet-react/chains";
import { StarknetConfig, jsonRpcProvider, cartridge } from "@starknet-react/core";

import {
  DEFAULT_CHAIN_ID,
  DEFAULT_RPC_URL,
  KATANA_CHAIN_ID,
  SEPOLIA_CHAIN_ID,
  MAINNET_CHAIN_ID,
  KATANA_URL,
} from "@/lib/config";
import controller from "@/lib/ControllerConnector";

// Starknet provider and connector configuration
// Simplified for local Katana development
export function StarknetProvider({ children }: PropsWithChildren) {
  // Katana chain definition for Starknet React
  const katana: Chain = {
    id: BigInt(KATANA_CHAIN_ID),
    name: "Katana",
    network: "katana",
    testnet: true,
    nativeCurrency: {
      address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      name: "Stark",
      symbol: "STRK",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [KATANA_URL] },
      public: { http: [KATANA_URL] },
    },
    paymasterRpcUrls: {
      avnu: { http: [KATANA_URL] },
    },
  };

  function getChainForEnv(chainId: string): Chain {
    switch (chainId) {
      case KATANA_CHAIN_ID:
        return katana;
      case SEPOLIA_CHAIN_ID:
        return sepolia;
      case MAINNET_CHAIN_ID:
        return mainnet;
      default:
        return katana;
    }
  }

  const chain = getChainForEnv(DEFAULT_CHAIN_ID);

  // Configure RPC provider for the environment-specific chain
  const provider = jsonRpcProvider({
    rpc: () => ({ nodeUrl: DEFAULT_RPC_URL }),
  });

  return (
    <StarknetConfig
      autoConnect
      defaultChainId={chain.id}
      chains={[chain]}
      connectors={[controller]}
      provider={provider}
      explorer={cartridge}
    >
      {children}
    </StarknetConfig>
  );
}
