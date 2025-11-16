# FOCG Adventure Game References

This directory contains git submodules for the external games and reference materials used in the FOCG Adventure platform. These repositories provide the smart contract manifests and documentation needed to integrate various onchain games as challenge levels.

## Submodules Overview

### Active Challenge Games

These games are actively integrated into FOCG Adventure as playable challenge levels:

#### **nums/** - Number Challenge Game
- **Purpose**: Level 1 challenge "The Mage's Seal"
- **Description**: A fully onchain strategy/luck game where players place 20 randomly generated numbers (1-1000) into slots in ascending order
- **Technology**: Built with Dojo Engine on Starknet
- **Integration**: Players complete a game session to unlock Level 1
- **Manifest Tag**: `NUMS-Minigame`
- **Repository**: https://github.com/cartridge-gg/nums
- **Play Online**: https://nums.gg/

#### **dopewars/** - Dope Wars
- **Purpose**: Level 3 challenge "The Rogue's Seal"
- **Description**: Onchain adaptation of the classic Drug Wars game - arbitrage drugs across NYC neighborhoods in a competitive multiplayer economy
- **Technology**: Built with Dojo Engine on Starknet
- **Key Mechanics**: Buy/sell drugs, travel between locations, random encounters (gangs/cops), shop system, dynamic market prices
- **Game Token Implementation**: Advanced ERC-721 NFT integration where each game session is a tradable token with live metadata
- **Integration**: Players complete a game session to unlock Level 3
- **Manifest Tag**: `dopewars-game_token_system_v0`
- **Repository**: https://github.com/cartridge-gg/dopewars
- **Play Online**: https://dopewars.game/

#### **death-mountain/** - Loot Survivor (Death Mountain)
- **Purpose**: Level 5 challenge "The Warrior's Seal"
- **Description**: Token-agnostic, no-code onchain dungeon creator with full RPG mechanics
- **Technology**: Built with Dojo Engine on Starknet (Cairo 2.10.1, Dojo 1.5.1)
- **Key Systems**:
  - **Adventurer**: 7 core stats, 8 equipment slots, XP-based leveling, health system
  - **Beasts**: 75 unique types with tiered difficulty and special abilities
  - **Obstacles**: 75 types across magical/sharp/crushing categories
  - **Items**: 101 unique base items with T1-T5 tiers and evolution system
  - **Market**: Deterministic marketplace with charisma-based pricing
- **Integration**: Players complete a dungeon run to unlock Level 5
- **Manifest Tag**: `ls_0_0_9-game_token_systems`
- **Repository**: https://github.com/Provable-Games/death-mountain
- **Play Online**: https://lootsurvivor.io/
- **Manifest Location**: `death-mountain/contracts/manifest_*.json`

#### **ronins-pact/** - Ronin's Pact
- **Purpose**: Reference implementation for game integration architecture
- **Description**: Demonstration game showing best practices for Denshokan standard integration
- **Technology**: Built with Dojo Engine on Starknet
- **Integration**: Used as codebase template; baseline for FOCG Adventure implementation
- **Repository**: https://github.com/cartridge-gg/ronins-pact

### Reference Materials

#### **DIPs/** - Devcon Improvement Proposals
- **Purpose**: Specification and documentation for DIP-69
- **Description**: Contains the formal proposal for FOCG Adventure submitted to Devcon(nect)
- **Key Document**: DIP-69 - "Gamified quest platform combining onchain games, cryptographic puzzles, and dynamic NFTs"
- **Repository**: https://github.com/efdevcon/DIPs
- **Status**: Implementation of DIP-69 for DevConnect Argentina

#### **thc/** - Treasure Hunt Creator
- **Purpose**: Framework reference for puzzle/quest systems
- **Description**: Framework for creating decentralized treasure hunts with smart contracts
- **Technology**: Ethereum-based (older framework)
- **Key Features**: Chapter encryption, IPFS integration, smart contract-based progression
- **Relevance**: Inspiration for quest level mechanics and cryptographic puzzle verification
- **Repository**: https://github.com/social-dist0rtion-protocol/thc

## Integration Architecture

### Denshokan Standard
All active challenge games implement the **Denshokan standard**, which provides:
- ERC-721 NFT tokens representing game sessions
- `IMinigameTokenData` interface for querying game state
- `game_over(token_id)` method for completion verification
- Dynamic onchain metadata reflecting live game state

### Challenge Verification Flow
1. Player opens external game from FOCG Adventure interface
2. Player completes a game session (receives game token NFT)
3. Frontend queries Torii indexer to find player's game tokens
4. Actions contract calls `game_over()` on Denshokan contract
5. If game is complete, FOCG Adventure level is unlocked
6. Dynamic NFT map updates with completed waypoint

### Configuration
Challenge level definitions are stored in `/spec/challenges.json`:
- Game metadata (name, location, description)
- Torii indexer URLs for mainnet/sepolia
- Denshokan contract addresses for verification
- Manifest paths for local development/testing
- Minigame tags and namespaces

## Manifest Files

Each game submodule contains deployment manifests:
- `manifest_mainnet.json` - Production Starknet deployment
- `manifest_sepolia.json` - Testnet deployment
- `manifest_*.json` - Other network-specific deployments

Manifests contain:
- Contract addresses for all game systems
- Contract tags for identification (e.g., `NUMS-Minigame`)
- ABI definitions for contract interaction
- World address and configuration

## Local Development

### Updating Submodules
```bash
# Initialize submodules (first time)
git submodule update --init --recursive

# Update all submodules to latest
git submodule update --remote

# Update specific submodule
cd refs/nums
git pull origin main
cd ../..
git add refs/nums
git commit -m "Update nums submodule"
```

### Extracting Contract Addresses
```bash
# Find specific contract in manifest
jq -r '.contracts[] | select(.tag == "NUMS-Minigame") | .address' refs/nums/manifest_mainnet.json

# List all contract tags
jq -r '.contracts[].tag' refs/death-mountain/contracts/manifest_mainnet.json
```

### Testing Integration
```bash
# Test specific challenge
node scripts/test-torii.mjs
```

## Adding New Games

To integrate a new game as a challenge level:

1. **Add Submodule**
   ```bash
   git submodule add https://github.com/org/game-repo refs/game-name
   git submodule update --init --recursive
   ```

2. **Verify Denshokan Implementation**
   - Check game implements `IMinigameTokenData`
   - Verify `game_over(token_id)` method exists
   - Test Torii indexer availability

3. **Update Configuration**
   - Add entry to `spec/challenges.json`
   - Include Torii URLs for both mainnet/sepolia
   - Extract Denshokan contract addresses from manifests
   - Set appropriate level number and metadata

4. **Update Frontend**
   - Add level card component in `client/src/components/`
   - Configure external game link
   - Implement verification logic

5. **Test Integration**
   - Deploy to Katana/Sepolia testnet
   - Test complete game flow
   - Verify NFT map updates correctly

## Technical Stack

All active challenge games share:
- **Language**: Cairo 2.x
- **Framework**: Dojo Engine 1.5.x+
- **Blockchain**: Starknet (L2)
- **Indexer**: Torii (SQL-based Dojo state queries)
- **Frontend**: React + TypeScript + Vite
- **Wallet**: Cartridge Controller integration

## Resources

- [Dojo Engine Documentation](https://dojoengine.org)
- [Starknet Documentation](https://starknet.io)
- [Denshokan Standard Specification](../contracts/DENSHOKAN.md)
- [FOCG Adventure README](../README.md)
- [DIP-69 Proposal](https://github.com/efdevcon/DIPs/blob/master/DIPs/DIP-69.md)

## Maintenance

This directory is part of the FOCG Adventure monorepo. Submodules should be updated periodically to track upstream changes, but care should be taken to verify manifest addresses remain compatible with deployed FOCG Adventure contracts.

**Last Updated**: November 2025
**Maintainer**: kronovet@cartridge.gg
