#!/bin/bash

# Script to deploy Dojo contracts locally
# Starts Katana and migrates the ronin_pact world
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

echo -e "${GREEN}=== Dojo Local Deployment ===${NC}"
echo -e "${BLUE}Contracts dir: $CONTRACTS_DIR${NC}\n"

# Check required tools
echo -e "${YELLOW}Checking required tools...${NC}"
for tool in katana sozo; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}Error: $tool not found. Please install Dojo toolchain.${NC}"
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

# Get the RoninPact token contract address from the manifest (external_contracts section)
TOKEN_ADDRESS=$(jq -r '.external_contracts[] | select(.tag == "ronin_quest-ronin_pact") | .address' "$CONTRACTS_DIR/manifest_dev.json")
if [ -z "$TOKEN_ADDRESS" ] || [ "$TOKEN_ADDRESS" == "null" ]; then
    echo -e "${RED}Error: RoninPact NFT not found in manifest${NC}"
    exit 1
fi
echo -e "${GREEN}RoninPact NFT deployed at: $TOKEN_ADDRESS${NC}"

# Get the actions contract address from the manifest
ACTIONS_ADDRESS=$(jq -r '.contracts[] | select(.tag == "ronin_quest-actions") | .address' "$CONTRACTS_DIR/manifest_dev.json")
if [ -z "$ACTIONS_ADDRESS" ] || [ "$ACTIONS_ADDRESS" == "null" ]; then
    echo -e "${RED}Error: Actions contract not found in manifest${NC}"
    exit 1
fi
echo -e "${GREEN}Actions contract deployed at: $ACTIONS_ADDRESS${NC}"

# Step 4: Configure contracts
echo -e "\n${YELLOW}Step 4: Configuring contracts...${NC}"

# Get deployer account from config
DEPLOYER_ACCOUNT=$(grep "account_address" "$CONTRACTS_DIR/dojo_dev.toml" | cut -d'"' -f2)

# Grant owner permissions to the deployer account on the ronin_quest namespace
# This allows the deployer account to write to models for configuration
echo -e "${BLUE}Granting owner permissions to deployer account...${NC}"
sozo auth grant --profile dev owner ronin_quest,"$DEPLOYER_ACCOUNT" --wait
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Owner permissions granted to deployer account${NC}"
else
    echo -e "${YELLOW}Could not grant owner permissions (may already exist)${NC}"
fi

# Set the minter on the NFT contract to be the actions contract
echo -e "${BLUE}Setting minter on NFT contract...${NC}"
sozo execute --profile dev --wait "$TOKEN_ADDRESS" set_minter "$ACTIONS_ADDRESS"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Minter configured on NFT contract${NC}"
else
    echo -e "${RED}✗ Failed to set minter on NFT contract${NC}"
fi

# Configure Waza trial with whitelisted games from waza.json
echo -e "${BLUE}Whitelisting game collections for Waza trial...${NC}"
WAZA_JSON="$CONTRACTS_DIR/../spec/waza.json"
if [ -f "$WAZA_JSON" ]; then
    # Get collections enabled for 'dev' environment
    COLLECTIONS=$(jq -c '.collections[] | select(.environments | contains(["dev"]))' "$WAZA_JSON")

    if [ ! -z "$COLLECTIONS" ]; then
        WHITELIST_COUNT=0
        while IFS= read -r collection; do
            COLLECTION_NAME=$(echo "$collection" | jq -r '.name')
            COLLECTION_ADDR=$(echo "$collection" | jq -r '.address')

            # Replace 'self' with the deployed Pact NFT address
            if [ "$COLLECTION_ADDR" == "self" ]; then
                COLLECTION_ADDR="$TOKEN_ADDRESS"
            fi

            echo -e "${YELLOW}Whitelisting: $COLLECTION_NAME${NC}"
            sozo execute --profile dev --wait ronin_quest-actions set_game "$COLLECTION_ADDR" 1
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ $COLLECTION_NAME whitelisted${NC}"
                WHITELIST_COUNT=$((WHITELIST_COUNT + 1))
            else
                echo -e "${RED}✗ Failed to whitelist $COLLECTION_NAME${NC}"
            fi
        done <<< "$COLLECTIONS"

        echo -e "${GREEN}✓ Waza trial configured with $WHITELIST_COUNT collection(s)${NC}"
    else
        echo -e "${YELLOW}Warning: No collections found for 'dev' environment in waza.json${NC}"
    fi
else
    echo -e "${YELLOW}Warning: waza.json not found at $WAZA_JSON${NC}"
fi

# Configure Chi trial quiz answers
echo -e "${BLUE}Setting Chi trial quiz answers...${NC}"
# Read answer hashes from chi.json in the spec directory
CHI_JSON="$CONTRACTS_DIR/../spec/chi.json"
if [ -f "$CHI_JSON" ]; then
    # Count number of questions
    QUESTION_COUNT=$(jq '.questions | length' "$CHI_JSON")
    # Extract answer_hash values using jq and convert to space-separated list
    ANSWER_HASHES=$(jq -r '.questions[].answer_hash' "$CHI_JSON" | tr '\n' ' ')

    if [ ! -z "$ANSWER_HASHES" ]; then
        # Execute set_quiz with array length first, then the answer hashes
        # Cairo arrays need length as first parameter
        sozo execute --profile dev --wait ronin_quest-actions set_quiz $QUESTION_COUNT $ANSWER_HASHES
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Chi trial quiz configured with $QUESTION_COUNT questions${NC}"
        else
            echo -e "${RED}✗ Failed to set quiz answers${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: No answer hashes found in chi.json${NC}"
    fi
else
    echo -e "${YELLOW}Warning: chi.json not found at $CHI_JSON${NC}"
fi

echo -e "${GREEN}Contract configuration complete!${NC}"

# Configure the actions contract with the NFT address and time lock (60 seconds for testing)
echo -e "${BLUE}Setting Pact NFT address and time lock in actions contract...${NC}"
sozo execute --profile dev --wait ronin_quest-actions set_pact "$TOKEN_ADDRESS" 60
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Pact NFT address configured with 60-second time lock (for testing)${NC}"
else
    echo -e "${RED}✗ Failed to set Pact address${NC}"
fi

# Step 5: Mint initial NFT from deployer account
echo -e "\n${YELLOW}Step 5: Minting initial NFT from deployer account...${NC}"
sozo execute --profile dev --wait ronin_quest-actions mint sstr:deployer
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Initial NFT minted from deployer account${NC}"
else
    echo -e "${YELLOW}Warning: Failed to mint initial NFT (may already exist)${NC}"
fi

# Print status
echo -e "\n${GREEN}=== Deployment Complete ===${NC}"
echo -e "${BLUE}Services running:${NC}"
echo -e "  Katana RPC:     http://localhost:5050"
echo -e "\n${BLUE}Deployed Contracts:${NC}"
echo -e "  World Address:    $WORLD_ADDRESS"
echo -e "  RoninPact NFT:    $TOKEN_ADDRESS"
echo -e "  Actions Contract: $ACTIONS_ADDRESS"
echo -e "\n${BLUE}Configuration:${NC}"
echo -e "  ✓ Owner permissions granted to deployer"
echo -e "  ✓ NFT minter set to Actions contract"
echo -e "  ✓ Actions contract configured with NFT address"
echo -e "  ✓ Initial NFT minted from deployer account"
echo -e "\n${BLUE}Logs:${NC}"
echo -e "  Katana: /tmp/katana.log"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Keep script running and monitor services
while true; do
    # Check if Katana is still running
    if ! kill -0 $KATANA_PID 2>/dev/null; then
        echo -e "${RED}Error: Katana process died${NC}"
        exit 1
    fi

    sleep 5
done
