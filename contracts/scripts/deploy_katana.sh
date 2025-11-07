#!/bin/bash

# Script to deploy FOCG Adventure contracts locally
# Starts Katana and migrates the focg_adventure world
# All services shut down on script exit

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store PIDs for cleanup
KATANA_PID=""

# Cleanup function to kill all services
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"

    if [ ! -z "$KATANA_PID" ] && kill -0 $KATANA_PID 2>/dev/null; then
        echo -e "${BLUE}Stopping Katana (PID: $KATANA_PID)...${NC}"
        kill $KATANA_PID 2>/dev/null || true
        wait $KATANA_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}All services stopped${NC}"
    exit 0
}

# Set up trap to call cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Get script directory and contracts root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONTRACTS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${GREEN}=== FOCG Adventure Local Deployment ===${NC}"
echo -e "${BLUE}Contracts dir: $CONTRACTS_DIR${NC}\n"

# Check required tools
echo -e "${YELLOW}Checking required tools...${NC}"
for tool in katana sozo jq; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}Error: $tool not found. Please install required tools.${NC}"
        exit 1
    fi
    version=$($tool --version 2>&1 | head -n 1)
    echo -e "${GREEN}✓ $version found${NC}"
done

# Navigate to contracts directory
cd "$CONTRACTS_DIR"

# Step 1: Start Katana with Cartridge controller support
echo -e "\n${YELLOW}Step 1: Starting Katana...${NC}"
katana --config katana.toml --explorer > /tmp/katana.log 2>&1 &
KATANA_PID=$!
echo -e "${GREEN}Katana started (PID: $KATANA_PID)${NC}"

# Wait for Katana to be ready
echo -e "${YELLOW}Waiting for Katana to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5050 > /dev/null 2>&1; then
        echo -e "${GREEN}Katana is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Katana failed to start${NC}"
        cat /tmp/katana.log
        exit 1
    fi
    sleep 1
done

# Step 2: Build and migrate contracts
echo -e "\n${YELLOW}Step 2: Building contracts...${NC}"
sozo build

echo -e "\n${YELLOW}Step 3: Migrating world...${NC}"
sozo migrate --profile dev

# Get the world address from the manifest
WORLD_ADDRESS=$(grep -o '"address": "0x[^"]*"' "$CONTRACTS_DIR/manifest_dev.json" | head -1 | cut -d'"' -f4)
echo -e "${GREEN}World deployed at: $WORLD_ADDRESS${NC}"

# Get the AdventureMap NFT contract address
NFT_ADDRESS=$(jq -r '.external_contracts[] | select(.tag == "focg_adventure-adventure_map") | .address' "$CONTRACTS_DIR/manifest_dev.json")
if [ -z "$NFT_ADDRESS" ] || [ "$NFT_ADDRESS" == "null" ]; then
    echo -e "${RED}Error: AdventureMap NFT not found in manifest${NC}"
    exit 1
fi
echo -e "${GREEN}AdventureMap NFT deployed at: $NFT_ADDRESS${NC}"

# Get the actions contract address
ACTIONS_ADDRESS=$(jq -r '.contracts[] | select(.tag == "focg_adventure-actions") | .address' "$CONTRACTS_DIR/manifest_dev.json")
if [ -z "$ACTIONS_ADDRESS" ] || [ "$ACTIONS_ADDRESS" == "null" ]; then
    echo -e "${RED}Error: Actions contract not found in manifest${NC}"
    exit 1
fi
echo -e "${GREEN}Actions contract deployed at: $ACTIONS_ADDRESS${NC}"

# Step 4: Configure contracts
echo -e "\n${YELLOW}Step 4: Configuring contracts...${NC}"

# Grant owner permissions to the deployer account
DEPLOYER_ACCOUNT=$(grep "account_address" "$CONTRACTS_DIR/dojo_dev.toml" | cut -d'"' -f2)
echo -e "${BLUE}Granting owner permissions to deployer account...${NC}"
sozo auth grant --profile dev owner focg_adventure,"$DEPLOYER_ACCOUNT" --wait
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Owner permissions granted${NC}"
else
    echo -e "${YELLOW}Could not grant owner permissions (may already exist)${NC}"
fi

# Set NFT contract in actions
TOTAL_LEVELS=6
echo -e "${BLUE}Configuring NFT contract in actions...${NC}"
sozo execute --profile dev --wait focg_adventure-actions set_nft_contract "$NFT_ADDRESS" "$TOTAL_LEVELS"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ NFT contract configured with $TOTAL_LEVELS levels${NC}"
else
    echo -e "${RED}✗ Failed to configure NFT contract${NC}"
fi

# Set actions as minter on NFT
echo -e "${BLUE}Setting minter on NFT contract...${NC}"
sozo execute --profile dev --wait "$NFT_ADDRESS" set_minter "$ACTIONS_ADDRESS"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Minter configured${NC}"
else
    echo -e "${RED}✗ Failed to set minter${NC}"
fi

# Step 4.5: Configure levels from spec files
echo -e "\n${YELLOW}Step 4.5: Configuring adventure levels from spec files...${NC}"

# Get MockGame addresses from manifest
mock_1=$(jq -r '.external_contracts[] | select(.tag == "focg_adventure-mock_1") | .address' "$CONTRACTS_DIR/manifest_dev.json")
mock_3=$(jq -r '.external_contracts[] | select(.tag == "focg_adventure-mock_3") | .address' "$CONTRACTS_DIR/manifest_dev.json")
mock_5=$(jq -r '.external_contracts[] | select(.tag == "focg_adventure-mock_5") | .address' "$CONTRACTS_DIR/manifest_dev.json")

echo -e "${GREEN}MockGame contracts deployed:${NC}"
echo -e "  Level 1: $mock_1"
echo -e "  Level 3: $mock_3"
echo -e "  Level 5: $mock_5"

# Read spec files
CHALLENGE_FILE="../spec/challenges.json"
PUZZLE_FILE="../spec/puzzles.json"

if [ ! -f "$CHALLENGE_FILE" ]; then
    echo -e "${RED}Error: challenges.json not found${NC}"
    exit 1
fi

if [ ! -f "$PUZZLE_FILE" ]; then
    echo -e "${RED}Error: puzzles.json not found${NC}"
    exit 1
fi

# Configure challenge levels
echo -e "${BLUE}Configuring challenge levels...${NC}"
CHALLENGE_COUNT=$(jq '.challenges | length' "$CHALLENGE_FILE")

for i in $(seq 0 $((CHALLENGE_COUNT - 1))); do
    LEVEL=$(jq -r ".challenges[$i].level" "$CHALLENGE_FILE")
    GAME_NAME=$(jq -r ".challenges[$i].game" "$CHALLENGE_FILE")
    MIN_SCORE=$(jq -r ".challenges[$i].minimum_score" "$CHALLENGE_FILE")

    # Get the appropriate MockGame address
    case $LEVEL in
        1) GAME_CONTRACT=$mock_1 ;;
        3) GAME_CONTRACT=$mock_3 ;;
        5) GAME_CONTRACT=$mock_5 ;;
        *)
            echo -e "${RED}Unknown level $LEVEL${NC}"
            continue
            ;;
    esac

    echo -e "${YELLOW}Configuring challenge level $LEVEL ($GAME_NAME)...${NC}"
    # set_challenge(level_number, game_contract, minimum_score)
    sozo execute --profile dev --wait focg_adventure-actions set_challenge \
        "$LEVEL" \
        "$GAME_CONTRACT" \
        "$MIN_SCORE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Challenge level $LEVEL configured${NC}"

        # Configure test game using complete_game(game_id, score)
        echo -e "${BLUE}  Configuring test game in MockGame...${NC}"
        sozo execute --profile dev --wait "$GAME_CONTRACT" complete_game 1 "$MIN_SCORE"
        echo -e "${GREEN}  ✓ Test game ready (game_id=1, score=$MIN_SCORE, completed=true)${NC}"
    else
        echo -e "${RED}✗ Failed to configure challenge level $LEVEL${NC}"
    fi
done

# Configure puzzle levels
echo -e "${BLUE}Configuring puzzle levels...${NC}"
PUZZLE_COUNT=$(jq '.puzzles | length' "$PUZZLE_FILE")

for i in $(seq 0 $((PUZZLE_COUNT - 1))); do
    LEVEL=$(jq -r ".puzzles[$i].level" "$PUZZLE_FILE")
    PUZZLE_NAME=$(jq -r ".puzzles[$i].name" "$PUZZLE_FILE")
    CODEWORD=$(jq -r ".puzzles[$i].codeword" "$PUZZLE_FILE")

    # For local testing, use a deterministic placeholder address derived from level
    # In production, this would be derived from the codeword via Poseidon hash
    # Each puzzle gets a unique solution address
    SOLUTION_ADDRESS="0x$(printf '%062d' $LEVEL)00"

    echo -e "${YELLOW}Configuring puzzle level $LEVEL ($PUZZLE_NAME)...${NC}"
    echo -e "${BLUE}  Codeword: $CODEWORD (solution_address: $SOLUTION_ADDRESS)${NC}"

    # set_puzzle(level_number, solution_address)
    sozo execute --profile dev --wait focg_adventure-actions set_puzzle \
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
sozo execute --profile dev --wait focg_adventure-actions mint sstr:deployer
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Initial NFT minted${NC}"
else
    echo -e "${YELLOW}Warning: Failed to mint initial NFT (may already exist)${NC}"
fi

# Print status
echo -e "\n${GREEN}=== Deployment Complete ===${NC}"
echo -e "${BLUE}Services running:${NC}"
echo -e "  Katana RPC:     http://localhost:5050"
echo -e "\n${BLUE}Deployed Contracts:${NC}"
echo -e "  World Address:    $WORLD_ADDRESS"
echo -e "  AdventureMap NFT: $NFT_ADDRESS"
echo -e "  Actions Contract: $ACTIONS_ADDRESS"
echo -e "  MockGame Level 1: $mock_1"
echo -e "  MockGame Level 3: $mock_3"
echo -e "  MockGame Level 5: $mock_5"
echo -e "\n${BLUE}Configuration:${NC}"
echo -e "  ✓ Owner permissions granted to deployer"
echo -e "  ✓ NFT contract configured in Actions with 6 levels"
echo -e "  ✓ Actions contract set as minter on NFT"
echo -e "  ✓ Challenge levels 1, 3, 5 configured with MockGame contracts"
echo -e "  ✓ Puzzle levels 2, 4, 6 configured with solution addresses"
echo -e "  ✓ MockGame contracts pre-configured with test game (game_id=1)"
echo -e "  ✓ Initial NFT minted from deployer account"
echo -e "\n${BLUE}Testing:${NC}"
echo -e "  To test challenge completion: sozo execute focg_adventure-actions complete_challenge_level <map_id> <level> 1"
echo -e "  To test puzzle completion:    sozo execute focg_adventure-actions complete_puzzle_level <map_id> <level> <signature>"
echo -e "\n${BLUE}Logs:${NC}"
echo -e "  Katana: /tmp/katana.log"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Keep script running and monitor services
while true; do
    if ! kill -0 $KATANA_PID 2>/dev/null; then
        echo -e "${RED}Error: Katana process died${NC}"
        exit 1
    fi
    sleep 5
done
