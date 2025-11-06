#!/bin/bash

# Script to deploy FOCG Adventure contracts to Sepolia or Mainnet
# Usage: ./deploy_network.sh <sepolia|mainnet>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get network argument
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Network argument required${NC}"
    echo -e "Usage: $0 <sepolia|mainnet>"
    exit 1
fi

NETWORK=$1

if [ "$NETWORK" != "sepolia" ] && [ "$NETWORK" != "mainnet" ]; then
    echo -e "${RED}Error: Invalid network. Use 'sepolia' or 'mainnet'${NC}"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONTRACTS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${GREEN}=== FOCG Adventure Deployment to $NETWORK ===${NC}"
echo -e "${BLUE}Contracts dir: $CONTRACTS_DIR${NC}\n"

# Check required tools
echo -e "${YELLOW}Checking required tools...${NC}"
for tool in sozo jq; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}Error: $tool not found${NC}"
        exit 1
    fi
    version=$($tool --version 2>&1 | head -n 1)
    echo -e "${GREEN}✓ $version found${NC}"
done

cd "$CONTRACTS_DIR"

# Step 1: Build contracts
echo -e "\n${YELLOW}Step 1: Building contracts...${NC}"
sozo build

# Step 2: Migrate world
echo -e "\n${YELLOW}Step 2: Migrating world to $NETWORK...${NC}"
sozo migrate --profile $NETWORK

# Get deployed addresses
MANIFEST_FILE="manifest_$NETWORK.json"
if [ ! -f "$MANIFEST_FILE" ]; then
    echo -e "${RED}Error: $MANIFEST_FILE not found${NC}"
    exit 1
fi

WORLD_ADDRESS=$(grep -o '"address": "0x[^"]*"' "$MANIFEST_FILE" | head -1 | cut -d'"' -f4)
echo -e "${GREEN}World deployed at: $WORLD_ADDRESS${NC}"

NFT_ADDRESS=$(jq -r '.external_contracts[] | select(.tag == "focg_adventure-adventure_map") | .address' "$MANIFEST_FILE")
if [ -z "$NFT_ADDRESS" ] || [ "$NFT_ADDRESS" == "null" ]; then
    echo -e "${RED}Error: AdventureMap NFT not found in manifest${NC}"
    exit 1
fi
echo -e "${GREEN}AdventureMap NFT deployed at: $NFT_ADDRESS${NC}"

ACTIONS_ADDRESS=$(jq -r '.contracts[] | select(.tag == "focg_adventure-actions") | .address' "$MANIFEST_FILE")
if [ -z "$ACTIONS_ADDRESS" ] || [ "$ACTIONS_ADDRESS" == "null" ]; then
    echo -e "${RED}Error: Actions contract not found in manifest${NC}"
    exit 1
fi
echo -e "${GREEN}Actions contract deployed at: $ACTIONS_ADDRESS${NC}"

# Step 3: Configure contracts
echo -e "\n${YELLOW}Step 3: Configuring contracts...${NC}"

# Grant owner permissions
DEPLOYER_ACCOUNT=$(grep "account_address" "dojo_$NETWORK.toml" | cut -d'"' -f2)
echo -e "${BLUE}Granting owner permissions...${NC}"
sozo auth grant --profile $NETWORK owner focg_adventure,"$DEPLOYER_ACCOUNT" --wait

# Configure NFT contract in actions
TOTAL_LEVELS=6
echo -e "${BLUE}Configuring NFT contract...${NC}"
sozo execute --profile $NETWORK --wait focg_adventure-actions set_nft_contract "$NFT_ADDRESS" "$TOTAL_LEVELS"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ NFT contract configured${NC}"
else
    echo -e "${RED}✗ Failed to configure NFT contract${NC}"
fi

# Set actions as minter
echo -e "${BLUE}Setting minter...${NC}"
sozo execute --profile $NETWORK --wait "$NFT_ADDRESS" set_minter "$ACTIONS_ADDRESS"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Minter configured${NC}"
else
    echo -e "${RED}✗ Failed to set minter${NC}"
fi

# Print deployment summary
echo -e "\n${GREEN}=== Deployment Complete ===${NC}"
echo -e "${BLUE}Network: $NETWORK${NC}"
echo -e "${BLUE}Deployed Contracts:${NC}"
echo -e "  World Address:    $WORLD_ADDRESS"
echo -e "  AdventureMap NFT: $NFT_ADDRESS"
echo -e "  Actions Contract: $ACTIONS_ADDRESS"
echo -e "\n${BLUE}Configuration:${NC}"
echo -e "  ✓ Owner permissions granted"
echo -e "  ✓ NFT contract configured in Actions"
echo -e "  ✓ Actions contract set as minter"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Configure levels via configure_adventure.sh (update for $NETWORK)"
echo -e "  2. Deploy verifier contracts for challenge levels"
echo -e "  3. Generate solution addresses for puzzle levels"
echo -e "\nSee IMPL.md for details"
