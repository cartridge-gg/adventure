import { ControllerConnector } from "@cartridge/connector";
import { SessionPolicies } from "@cartridge/controller";

import {
  ADVENTURE_ADDRESS,
  MAP_ADDRESS,
  DEFAULT_CHAIN_ID,
  DEFAULT_RPC_URL,
} from "./config";

// Define session policies for gasless transactions
const policies: SessionPolicies = {
  contracts: {
    [ADVENTURE_ADDRESS]: {
      methods: [
        {
          name: "complete_challenge",
          entrypoint: "complete_challenge",
          description: "Complete an onchain game challenge",
        },
        {
          name: "complete_puzzle",
          entrypoint: "complete_puzzle",
          description: "Complete a puzzle with a codeword",
        },
      ],
    },
    [MAP_ADDRESS]: {
      methods: [
        {
          name: "mint",
          entrypoint: "mint",
          description: "Mint your Adventure Map NFT",
        },
      ],
    },
  },
};

// Create controller connector instance for the environment-specific chain
// Chain ID is automatically derived from the RPC URL by the Controller
const controller = new ControllerConnector({
  policies,
  chains: [{ rpcUrl: DEFAULT_RPC_URL }],
  defaultChainId: DEFAULT_CHAIN_ID,
});

export default controller;
