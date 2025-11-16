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
echo -e "\n${YELLOW}Step 1: Building contracts for $NETWORK...${NC}"
sozo build --profile $NETWORK

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

# Step 4: Configure levels from spec files
echo -e "\n${YELLOW}Step 4: Configuring adventure levels from spec files...${NC}"

# Configure challenge levels
CHALLENGE_FILE="../spec/challenges.json"

if [ ! -f "$CHALLENGE_FILE" ]; then
    echo -e "${RED}Error: challenges.json not found${NC}"
    exit 1
fi

echo -e "${BLUE}Configuring challenge levels...${NC}"
CHALLENGE_COUNT=$(jq '.challenges | length' "$CHALLENGE_FILE")

for i in $(seq 0 $((CHALLENGE_COUNT - 1))); do
    LEVEL=$(jq -r ".challenges[$i].level" "$CHALLENGE_FILE")
    GAME_NAME=$(jq -r ".challenges[$i].game" "$CHALLENGE_FILE")

    # Use mock contracts for Sepolia, real Denshokan contracts for Mainnet
    if [ "$NETWORK" == "sepolia" ]; then
        # Look up mock contract from manifest
        GAME_CONTRACT=$(jq -r '.external_contracts[] | select(.tag == "focg_adventure-mock_'$LEVEL'") | .address' "$MANIFEST_FILE")

        if [ -z "$GAME_CONTRACT" ] || [ "$GAME_CONTRACT" == "null" ]; then
            echo -e "${YELLOW}Warning: No MockGame contract found for level $LEVEL${NC}"
            continue
        fi

        echo -e "${YELLOW}Configuring challenge level $LEVEL ($GAME_NAME) with MockGame...${NC}"
        echo -e "${BLUE}  Mock Contract: $GAME_CONTRACT${NC}"
    else
        # Get real Denshokan contract address from spec file for mainnet
        GAME_CONTRACT=$(jq -r ".challenges[$i].dojo.$NETWORK.denshokan_address" "$CHALLENGE_FILE")

        if [ -z "$GAME_CONTRACT" ] || [ "$GAME_CONTRACT" == "null" ]; then
            echo -e "${YELLOW}Warning: No Denshokan address found for level $LEVEL in $NETWORK config${NC}"
            continue
        fi

        echo -e "${YELLOW}Configuring challenge level $LEVEL ($GAME_NAME)...${NC}"
        echo -e "${BLUE}  Denshokan Contract: $GAME_CONTRACT${NC}"
    fi

    # set_challenge(level_number, game_contract)
    # Note: game_contract is either MockGame (sepolia) or Denshokan NFT contract (mainnet)
    sozo execute --profile $NETWORK --wait focg_adventure-actions set_challenge \
        "$LEVEL" \
        "$GAME_CONTRACT"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Challenge level $LEVEL configured${NC}"

        # For Sepolia, pre-configure test game in MockGame
        if [ "$NETWORK" == "sepolia" ]; then
            echo -e "${BLUE}  Configuring test game in MockGame...${NC}"
            sozo execute --profile $NETWORK --wait "$GAME_CONTRACT" set_game_over 1 1
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}  ✓ Test game ready (game_id=1, game_over=true)${NC}"
            else
                echo -e "${YELLOW}  Warning: Could not configure test game${NC}"
            fi
        fi
    else
        echo -e "${RED}✗ Failed to configure challenge level $LEVEL${NC}"
    fi
done

# Configure puzzle levels
PUZZLE_FILE="../spec/puzzles.json"

if [ ! -f "$PUZZLE_FILE" ]; then
    echo -e "${RED}Error: puzzles.json not found${NC}"
    exit 1
fi

echo -e "${BLUE}Configuring puzzle levels...${NC}"
PUZZLE_COUNT=$(jq '.puzzles | length' "$PUZZLE_FILE")

for i in $(seq 0 $((PUZZLE_COUNT - 1))); do
    LEVEL=$(jq -r ".puzzles[$i].level" "$PUZZLE_FILE")
    PUZZLE_NAME=$(jq -r ".puzzles[$i].name" "$PUZZLE_FILE")
    CODEWORD=$(jq -r ".puzzles[$i].codeword" "$PUZZLE_FILE")

    # Check if node is available for codeword2address
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}Warning: node not found, skipping puzzle level $LEVEL configuration${NC}"
        echo -e "${BLUE}  You can configure this later using: sozo execute focg_adventure-actions set_puzzle $LEVEL <solution_address>${NC}"
        continue
    fi

    # Derive solution address from codeword using the codeword2address utility
    SOLUTION_ADDRESS=$(node "$SCRIPT_DIR/../../client/scripts/codeword2address.mjs" "$CODEWORD")

    if [ -z "$SOLUTION_ADDRESS" ]; then
        echo -e "${RED}✗ Failed to compute solution address for level $LEVEL${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Configuring puzzle level $LEVEL ($PUZZLE_NAME)...${NC}"
    echo -e "${BLUE}  Codeword: $CODEWORD (solution_address: $SOLUTION_ADDRESS)${NC}"

    # set_puzzle(level_number, solution_address)
    sozo execute --profile $NETWORK --wait focg_adventure-actions set_puzzle \
        "$LEVEL" \
        "$SOLUTION_ADDRESS"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Puzzle level $LEVEL configured${NC}"
    else
        echo -e "${RED}✗ Failed to configure puzzle level $LEVEL${NC}"
    fi
done

# Step 5: Mint initial NFT
echo -e "\n${YELLOW}Step 5: Minting initial NFT...${NC}"
sozo execute --profile $NETWORK --wait focg_adventure-actions mint sstr:deployer
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Initial NFT minted${NC}"
else
    echo -e "${YELLOW}Warning: Failed to mint initial NFT (may already exist)${NC}"
fi

# Print deployment summary
echo -e "\n${GREEN}=== Deployment Complete ===${NC}"
echo -e "${BLUE}Network: $NETWORK${NC}"
echo -e "${BLUE}Deployed Contracts:${NC}"
echo -e "  World Address:    $WORLD_ADDRESS"
echo -e "  AdventureMap NFT: $NFT_ADDRESS"
echo -e "  Actions Contract: $ACTIONS_ADDRESS"
echo -e "\n${BLUE}Configuration:${NC}"
echo -e "  ✓ Owner permissions granted to deployer"
echo -e "  ✓ NFT contract configured in Actions with 6 levels"
echo -e "  ✓ Actions contract set as minter on NFT"

if [ "$NETWORK" == "sepolia" ]; then
    echo -e "  ✓ Challenge levels configured with MockGame contracts (testnet mode)"
    echo -e "  ✓ MockGame contracts pre-configured with test game (game_id=1)"
else
    echo -e "  ✓ Challenge levels configured with real game Denshokan contracts"
fi

echo -e "  ✓ Puzzle levels configured from spec/puzzles.json"
echo -e "  ✓ Initial NFT minted to deployer account"

echo -e "\n${YELLOW}Next steps:${NC}"
if [ "$NETWORK" == "sepolia" ]; then
    echo -e "  1. Test challenge completion with: sozo execute focg_adventure-actions complete_challenge_level <map_id> <level> 1"
    echo -e "  2. MockGame contracts can be controlled with: sozo execute <mock_address> set_game_over <token_id> <0|1>"
    echo -e "  3. Game names and descriptions match mainnet for realistic testing"
else
    echo -e "  1. Verify game contract addresses in spec/challenges.json match deployed games"
    echo -e "  2. Test challenge completion with real game sessions"
fi

echo -e "\nSee IMPL.md and spec/SPEC.md for details"
