#!/bin/bash

# Unified deployment script for Dojo contracts to Sepolia or Mainnet
# Usage: ./deploy_network.sh {sepolia|mainnet}

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and contracts root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONTRACTS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Parse and validate network argument
NETWORK=$1
if [ "$NETWORK" != "sepolia" ] && [ "$NETWORK" != "mainnet" ]; then
    echo -e "${RED}Error: Invalid network '$NETWORK'${NC}"
    echo -e "${YELLOW}Usage: $0 {sepolia|mainnet}${NC}"
    echo -e "${YELLOW}Supported networks: sepolia, mainnet${NC}"
    exit 1
fi

# Network-specific configuration
if [ "$NETWORK" == "mainnet" ]; then
    TIME_LOCK=86400  # 24 hours
    NETWORK_NAME="Starknet Mainnet"
    RPC_URL="https://api.cartridge.gg/x/starknet/mainnet"
    EXPLORER_URL="https://starkscan.co"
else
    TIME_LOCK=3600  # 1 hour
    NETWORK_NAME="Starknet Sepolia"
    RPC_URL="https://api.cartridge.gg/x/starknet/sepolia"
    EXPLORER_URL="https://sepolia.starkscan.co"
fi

echo -e "${GREEN}=== Dojo $NETWORK_NAME Deployment ===${NC}"
if [ "$NETWORK" == "mainnet" ]; then
    echo -e "${RED}WARNING: You are about to deploy to MAINNET${NC}"
fi
echo -e "${BLUE}Contracts dir: $CONTRACTS_DIR${NC}\n"

# Navigate to contracts directory
cd "$CONTRACTS_DIR"

# Check required tools
echo -e "${YELLOW}Checking required tools...${NC}"
for tool in sozo jq; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}Error: $tool not found. Please install required tools.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ Required tools found${NC}"

# Read configuration from dojo config file
CONFIG_FILE="$CONTRACTS_DIR/dojo_$NETWORK.toml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Config file not found at $CONFIG_FILE${NC}"
    exit 1
fi

# Extract account address from TOML constructor_data
DOJO_ACCOUNT_ADDRESS=$(grep "^account_address" "$CONFIG_FILE" | grep -o "0x[0-9a-fA-F]\{1,\}")
if [ -z "$DOJO_ACCOUNT_ADDRESS" ]; then
    echo -e "${RED}Error: Account address not configured in $CONFIG_FILE${NC}"
    echo -e "${YELLOW}Please set your account address in the constructor_data field:${NC}"
    exit 1
fi

echo -e "${BLUE}Deploying with account: $DOJO_ACCOUNT_ADDRESS${NC}\n"

# Mainnet-specific safety confirmation
if [ "$NETWORK" == "mainnet" ]; then
    echo -e "${YELLOW}You are about to deploy to MAINNET.${NC}"
    echo -e "${YELLOW}This will use real STRK and the deployment cannot be undone.${NC}"
    read -p "Are you sure you want to continue? (type 'yes' to proceed): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 0
    fi
fi

# Step 1: Build contracts
echo -e "\n${YELLOW}Step 1: Building contracts...${NC}"
sozo -P "$NETWORK" build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Step 2: Migrate world
echo -e "\n${YELLOW}Step 2: Migrating world to $NETWORK_NAME...${NC}"
echo -e "${BLUE}This may take several minutes...${NC}"
sozo -P "$NETWORK" migrate -vvv
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Migration failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Migration successful${NC}"

# Step 3: Extract contract addresses from manifest
echo -e "\n${YELLOW}Step 3: Extracting contract addresses...${NC}"

MANIFEST_FILE="$CONTRACTS_DIR/manifest_$NETWORK.json"
if [ ! -f "$MANIFEST_FILE" ]; then
    echo -e "${RED}Error: Manifest file not found at $MANIFEST_FILE${NC}"
    exit 1
fi

# Get the world address from the manifest
WORLD_ADDRESS=$(jq -r '.world.address' "$MANIFEST_FILE")
if [ -z "$WORLD_ADDRESS" ] || [ "$WORLD_ADDRESS" == "null" ]; then
    echo -e "${RED}Error: World address not found in manifest${NC}"
    exit 1
fi
echo -e "${GREEN}World deployed at: $WORLD_ADDRESS${NC}"

# Get the RoninPact token contract address from the manifest (it's an external contract)
TOKEN_ADDRESS=$(jq -r '.external_contracts[] | select(.tag == "ronin_quest-ronin_pact") | .address' "$MANIFEST_FILE")
if [ -z "$TOKEN_ADDRESS" ] || [ "$TOKEN_ADDRESS" == "null" ]; then
    echo -e "${RED}Error: RoninPact NFT not found in manifest${NC}"
    exit 1
fi
echo -e "${GREEN}RoninPact NFT deployed at: $TOKEN_ADDRESS${NC}"

# Get the actions contract address from the manifest
ACTIONS_ADDRESS=$(jq -r '.contracts[] | select(.tag == "ronin_quest-actions") | .address' "$MANIFEST_FILE")
if [ -z "$ACTIONS_ADDRESS" ] || [ "$ACTIONS_ADDRESS" == "null" ]; then
    echo -e "${RED}Error: Actions contract not found in manifest${NC}"
    exit 1
fi
echo -e "${GREEN}Actions contract deployed at: $ACTIONS_ADDRESS${NC}"

# Step 4: Update dojo config file with world address
echo -e "\n${YELLOW}Step 4: Updating dojo_$NETWORK.toml with world address...${NC}"
CONFIG_FILE="$CONTRACTS_DIR/dojo_$NETWORK.toml"
sed -i.bak "s|# world_address = \"0x...\"|world_address = \"$WORLD_ADDRESS\"|" "$CONFIG_FILE"
rm -f "$CONFIG_FILE.bak"
echo -e "${GREEN}✓ dojo_$NETWORK.toml updated${NC}"

# Step 5: Configure contracts
echo -e "\n${YELLOW}Step 5: Configuring contracts...${NC}"

# Grant owner permissions to the deployer account on the ronin_quest namespace
echo -e "${BLUE}Granting owner permissions to deployer account...${NC}"
sozo -P "$NETWORK" auth grant owner ronin_quest,"$DOJO_ACCOUNT_ADDRESS" --wait
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Owner permissions granted to deployer account${NC}"
else
    echo -e "${YELLOW}Could not grant owner permissions (may already exist)${NC}"
fi

# Set the minter on the NFT contract to be the actions contract
echo -e "${BLUE}Setting minter on NFT contract...${NC}"
sozo -P "$NETWORK" execute --wait "$TOKEN_ADDRESS" set_minter "$ACTIONS_ADDRESS"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Minter configured on NFT contract${NC}"
else
    echo -e "${RED}✗ Failed to set minter on NFT contract${NC}"
    exit 1
fi

# Configure Waza trial with whitelisted games from waza.json
echo -e "${BLUE}Whitelisting game collections for Waza trial...${NC}"
WAZA_JSON="$CONTRACTS_DIR/../spec/waza.json"
if [ -f "$WAZA_JSON" ]; then
    # Get collections enabled for current network environment
    COLLECTIONS=$(jq -c ".collections[] | select(.environments | contains([\"$NETWORK\"]))" "$WAZA_JSON")

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
            sozo -P "$NETWORK" execute --wait ronin_quest-actions set_game "$COLLECTION_ADDR" 1
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ $COLLECTION_NAME whitelisted${NC}"
                WHITELIST_COUNT=$((WHITELIST_COUNT + 1))
            else
                echo -e "${RED}✗ Failed to whitelist $COLLECTION_NAME${NC}"
                exit 1
            fi
        done <<< "$COLLECTIONS"

        echo -e "${GREEN}✓ Waza trial configured with $WHITELIST_COUNT collection(s)${NC}"
    else
        echo -e "${YELLOW}Warning: No collections found for '$NETWORK' environment in waza.json${NC}"
    fi
else
    echo -e "${YELLOW}Warning: waza.json not found at $WAZA_JSON${NC}"
    echo -e "${RED}Error: Cannot configure Waza trial without waza.json${NC}"
    exit 1
fi

# Configure Chi trial quiz answers
echo -e "${BLUE}Setting Chi trial quiz answers...${NC}"
CHI_JSON="$CONTRACTS_DIR/../spec/chi.json"
if [ -f "$CHI_JSON" ]; then
    # Count number of questions
    QUESTION_COUNT=$(jq '.questions | length' "$CHI_JSON")
    # Extract answer_hash values using jq and convert to space-separated list
    ANSWER_HASHES=$(jq -r '.questions[].answer_hash' "$CHI_JSON" | tr '\n' ' ')

    if [ ! -z "$ANSWER_HASHES" ]; then
        # Execute set_quiz with array length first, then the answer hashes
        sozo -P "$NETWORK" execute --wait ronin_quest-actions set_quiz $QUESTION_COUNT $ANSWER_HASHES
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Chi trial quiz configured with $QUESTION_COUNT questions${NC}"
        else
            echo -e "${RED}✗ Failed to set quiz answers${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Warning: No answer hashes found in chi.json${NC}"
    fi
else
    echo -e "${YELLOW}Warning: chi.json not found at $CHI_JSON${NC}"
fi

# Configure the actions contract with the NFT address and time lock
TIME_LOCK_HOURS=$((TIME_LOCK / 3600))
echo -e "${BLUE}Setting Pact NFT address and time lock in actions contract...${NC}"
sozo -P "$NETWORK" execute --wait ronin_quest-actions set_pact "$TOKEN_ADDRESS" "$TIME_LOCK"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Pact NFT address configured with ${TIME_LOCK_HOURS}-hour time lock${NC}"
else
    echo -e "${RED}✗ Failed to set Pact address${NC}"
    exit 1
fi

echo -e "${GREEN}Contract configuration complete!${NC}"

# Step 6: Mint initial NFT from deployer account
echo -e "\n${YELLOW}Step 6: Minting initial NFT from deployer account...${NC}"
sozo -P "$NETWORK" execute --wait ronin_quest-actions mint sstr:deployer
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Initial NFT minted from deployer account${NC}"
else
    echo -e "${YELLOW}Warning: Failed to mint initial NFT (may already exist)${NC}"
fi

# Print deployment summary
echo -e "\n${GREEN}=== $NETWORK_NAME Deployment Complete ===${NC}"
echo -e "${BLUE}Network:${NC}"
echo -e "  $NETWORK_NAME"
echo -e "  RPC: $RPC_URL"
echo -e "\n${BLUE}Deployed Contracts:${NC}"
echo -e "  World Address:    $WORLD_ADDRESS"
echo -e "  RoninPact NFT:    $TOKEN_ADDRESS"
echo -e "  Actions Contract: $ACTIONS_ADDRESS"
echo -e "\n${BLUE}Configuration:${NC}"
echo -e "  ✓ Owner permissions granted to deployer"
echo -e "  ✓ NFT minter set to Actions contract"
echo -e "  ✓ Actions contract configured with NFT address (${TIME_LOCK_HOURS}-hour time lock)"
echo -e "  ✓ Games whitelisted for Waza trial"
echo -e "  ✓ Chi trial quiz configured"
echo -e "  ✓ Initial NFT minted from deployer account"
echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "  1. Verify contracts on Starkscan:"
echo -e "     $EXPLORER_URL/contract/$WORLD_ADDRESS"
echo -e "  2. Configure your client with these addresses"
if [ "$NETWORK" == "sepolia" ]; then
    echo -e "  4. Test the deployment thoroughly before mainnet"
else
    echo -e "  4. Announce the deployment to your users"
fi
echo -e "\n${GREEN}Deployment information saved to:${NC}"
echo -e "  $CONFIG_FILE"
echo -e "  $MANIFEST_FILE"
if [ "$NETWORK" == "mainnet" ]; then
    echo -e "\n${YELLOW}IMPORTANT: Keep your deployment credentials secure!${NC}"
fi
echo -e ""
