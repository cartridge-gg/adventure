# Denshokan Standard

## Table of Contents
- [Overview](#overview)
  - [Token Standard](#token-standard)
- [Conceptual Design](#conceptual-design)
  - [Core Philosophy](#core-philosophy)
  - [Architecture Pattern](#architecture-pattern)
  - [Token-Game Relationship](#token-game-relationship)
- [Core Contracts](#core-contracts)
  - [Overview](#overview-1)
  - [How They Work Together](#how-they-work-together)
  - [Relationship to Dojo](#relationship-to-dojo)
- [Denshokan Interfaces](#denshokan-interfaces)
  - [Minigame Contract](#minigame-contract)
  - [Renderer Contract](#renderer-contract)
  - [Settings Contract](#settings-contract)
- [Implementation Guide](#implementation-guide)
  - [Required Components](#required-components)
  - [Deployment Flow](#deployment-flow)
  - [Basic Usage](#basic-usage)
- [Extending Denshokan](#extending-denshokan)

---

## Overview

**Denshokan** (伝書館, literally "message archive" or "communication hall") is a contract standard for creating fully onchain game experiences that represent individual gameplay sessions as NFTs. It enables an "arcade system" where:

- Each game session is minted as a unique NFT (game token)
- Game state is stored entirely onchain
- Tokens can be traded while preserving game state
- Multiple rendering and settings configurations can be attached
- Game metadata is dynamically generated from onchain state

This is analogous to how ERC-721 enables NFT marketplaces, but Denshokan enables **onchain game arcades** where gameplay sessions are tradeable, collectible assets with fully onchain state.

### Token Standard

Denshokan **builds on top of ERC-721** but extends it with game-specific functionality:

- **ERC-721 Compatible**: Implements standard NFT functions (`owner_of`, `transfer_from`, `balance_of`, etc.)
- **Game-Aware**: Adds game-specific methods like `score()`, `game_over()`, `game_details()`
- **Dynamic Metadata**: Token URI and images are generated from onchain game state, not static IPFS
- **Settings-Enabled**: Tokens can be associated with different game configurations
- **Renderer-Swappable**: Multiple renderer contracts can generate different visualizations

**Formula**: `ERC-721 + Game State + Dynamic Rendering = Denshokan`

| Feature | Standard ERC-721 | Denshokan Token |
|---------|------------------|-----------------|
| Transfer/Ownership | ✓ | ✓ |
| Token URI | Static IPFS/URL | Dynamic (generated from state) |
| Metadata | Fixed at mint | Updates as game progresses |
| Game State | None | Full game state in Dojo models |
| Rendering | Off-chain | Onchain SVG generation |
| Composability | Limited | Multiple renderers/settings |

---

## Conceptual Design

### Core Philosophy

The Denshokan standard is built on several key principles:

1. **Token-as-Game-Session**: Each NFT represents a unique gameplay session, not just a static asset. The token ID directly corresponds to a game ID.

2. **Separation of Concerns**: The architecture cleanly separates:
   - **Token Management** (minting, ownership)
   - **Game Logic** (gameplay mechanics)
   - **Rendering** (visual representation)
   - **Configuration** (game settings and rules)

3. **Composability**: Games can have:
   - Multiple rendering implementations (different visual styles)
   - Multiple settings configurations (difficulty levels, rule variations)
   - External integrations (custom game logic, achievements, etc.)

4. **Onchain State**: All game state is stored onchain in Dojo models, making it:
   - Verifiable and transparent
   - Tradeable with full history
   - Queryable for analytics

### Architecture Pattern

The Denshokan standard uses a **hub-and-spoke** architecture:

```
                     ┌─────────────────┐
                     │   Minigame      │
                     │  (Token Hub)    │
                     └────────┬────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼──────┐     ┌──────▼───────┐    ┌──────▼──────┐
    │  Renderer  │     │   Settings   │    │  Game Logic │
    │  (Spoke)   │     │   (Spoke)    │    │  (Spoke)    │
    └────────────┘     └──────────────┘    └─────────────┘
```

- **Minigame Contract** (Hub): Manages the token collection and references to spoke contracts
- **Spoke Contracts**: Specialized contracts that handle specific aspects
- **DNS Resolution**: Dojo's DNS system enables contracts to find each other by name

### Token-Game Relationship

```
Token ID (u64) ←→ Game ID (u64)   [1:1 mapping]
       │
       ├─→ Owner (address)
       ├─→ Metadata (name, settings, dates, minter)
       ├─→ Game State (stored in Dojo models)
       │     └─→ Your custom game state structure
       │
       └─→ Rendering (dynamic SVG/metadata from state)
```

---

## Core Contracts

### Overview

Denshokan requires **three core contracts** to implement the standard:

**Minigame** - The Token Hub
- Acts as the central ERC-721 collection contract
- Each token represents one game session (token ID = game ID)
- Provides game-specific token data methods
- Maintains references to Renderer and Settings contracts
- Think of it as: *"The collection contract that knows about games"*

**Renderer** - The Visualization Layer
- Generates dynamic NFT metadata from onchain game state
- Creates SVG images or other representations
- Provides token names and descriptions
- Can have multiple implementations for different visual styles
- Think of it as: *"How the game looks as an NFT"*

**Settings** - The Configuration Manager
- Defines game rules and parameters
- Enables multiple game modes (easy, hard, custom)
- Validates configuration parameters
- Links specific settings to game tokens
- Think of it as: *"The rulebook for different game modes"*

### How They Work Together

```
Denshokan Standard Flow:

1. Minigame contract is deployed as ERC-721 collection
2. Settings contract defines game configurations
3. Renderer contract generates visualizations
4. Game Logic (your implementation) mints tokens via Minigame
5. Game state updates stored in Dojo models
6. Renderer reads state and generates dynamic NFT metadata

Data Flow:
Game Logic ←[DNS]→ Minigame ←[DNS]→ Settings
                      ↑
                      └────[DNS]──→ Renderer

State Storage:
All game state stored in Dojo World models with token ID as key
```

### Relationship to Dojo

**One World, Many Games**

Denshokan operates within a **single Dojo World** that contains all game tokens and their state:

```
┌─────────────────────────────────────────────────────────┐
│                    Dojo World                           │
│                  (Your Game Namespace)                  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Game #1  │  │ Game #2  │  │ Game #3  │  ...          │
│  │ Model    │  │ Model    │  │ Model    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│                                                         │
│  ┌─────────────────────────────────────┐                │
│  │         Config (singleton)          │                │
│  │  Settings #1, #2, #3, ...           │                │
│  └─────────────────────────────────────┘                │
│                                                         │
│  Denshokan Contracts:                                   │
│  • Minigame  • Renderer  • Settings                     │
│  • Your Game Logic Contracts                            │
└─────────────────────────────────────────────────────────┘
```

**Key Points**:

1. **Single World Architecture**: All game tokens share one Dojo World
   - Enables shared state and cross-game interactions
   - Efficient querying and analytics
   - Resource efficiency

2. **Token ID = Model Key**: Each token ID maps directly to a game state model
   ```cairo
   // Token ID becomes the primary key for your game state
   let game_id: u64 = mint_token(player, settings_id);
   let game_state = store.game(game_id); // Your game model
   ```

3. **Namespace Isolation**: Different games use different namespaces
   - Prevents model conflicts between games
   - Logical separation while sharing infrastructure

---

## Denshokan Interfaces

### Minigame Contract

The Minigame contract is the **central hub** implementing the token collection.

#### Required Interfaces

**`IMinigameTokenData`** - Game-specific token data

```cairo
trait IMinigameTokenData<ContractState> {
    fn score(self: @ContractState, token_id: u64) -> u32;
    fn game_over(self: @ContractState, token_id: u64) -> bool;
}
```

**Methods**:

- **`score(token_id: u64) -> u32`**
  - Returns the current score/progress for a game token
  - Reads from your onchain game state model
  - Used for leaderboards and display

- **`game_over(token_id: u64) -> bool`**
  - Returns whether the game has ended
  - Computed from your game state logic
  - Used to determine if further gameplay is possible

#### Implementation Pattern

```cairo
#[dojo::contract]
mod Minigame {
    use game_components::minigame::minigame::MinigameComponent;

    // Embed the MinigameComponent
    component!(path: MinigameComponent, storage: minigame, event: MinigameEvent);

    #[abi(embed_v0)]
    impl MinigameImpl = MinigameComponent::MinigameImpl<ContractState>;

    fn dojo_init(ref self: ContractState, denshokan_address: ContractAddress) {
        let mut world: WorldStorage = self.world(@NAMESPACE());
        let (settings_address, _) = world.dns(@SETTINGS()).unwrap();
        let (renderer_address, _) = world.dns(@RENDERER()).unwrap();

        self.minigame.initializer(
            creator_address: get_caller_address(),
            name: "Your Game Name",
            description: "Your game description",
            developer: "Developer",
            publisher: "Publisher",
            genre: "Genre",
            image: "Image URL",
            renderer_address: Option::Some(renderer_address),
            settings_address: Option::Some(settings_address),
            token_address: denshokan_address,
            // Optional fields...
        );
    }

    #[abi(embed_v0)]
    impl GameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: u64) -> u32 {
            // Read from your game state model
            let store = StoreTrait::new(self.world(@NAMESPACE()));
            let game = store.game(token_id);
            game.score
        }

        fn game_over(self: @ContractState, token_id: u64) -> bool {
            // Check your game over logic
            let store = StoreTrait::new(self.world(@NAMESPACE()));
            let game = store.game(token_id);
            game.is_over()
        }
    }
}
```

---

### Renderer Contract

The Renderer contract provides **dynamic visualization** of game tokens.

#### Required Interfaces

**`IMinigameDetails`** - Structured game details

```cairo
trait IMinigameDetails<ContractState> {
    fn game_details(self: @ContractState, token_id: u64) -> Span<GameDetail>;
    fn token_name(self: @ContractState, token_id: u64) -> ByteArray;
    fn token_description(self: @ContractState, token_id: u64) -> ByteArray;
}
```

**Methods**:

- **`game_details(token_id: u64) -> Span<GameDetail>`**
  - Returns structured game details as name-value pairs
  - Example: `[("Level", "5"), ("Score", "1000")]`

- **`token_name(token_id: u64) -> ByteArray`**
  - Returns display name for the token

- **`token_description(token_id: u64) -> ByteArray`**
  - Returns description for the token

**`IMinigameDetailsSVG`** - Dynamic SVG rendering

```cairo
trait IMinigameDetailsSVG<ContractState> {
    fn game_details_svg(self: @ContractState, token_id: u64) -> ByteArray;
}
```

**Methods**:

- **`game_details_svg(token_id: u64) -> ByteArray`**
  - Generates SVG markup representing current game state
  - Should validate token ownership
  - Returns dynamic image based on game state

#### Implementation Pattern

```cairo
#[dojo::contract]
mod Renderer {
    use game_components::minigame::interface::{IMinigameDetails, IMinigameDetailsSVG};
    use game_components::minigame::structs::GameDetail;

    #[abi(embed_v0)]
    impl GameDetailsImpl of IMinigameDetails<ContractState> {
        fn game_details(self: @ContractState, token_id: u64) -> Span<GameDetail> {
            // Validate ownership
            self.validate_token_ownership(token_id);

            // Read game state and format details
            let store = StoreTrait::new(self.world(@NAMESPACE()));
            let game = store.game(token_id);

            array![
                GameDetail { name: "Level", value: format!("{}", game.level) },
                GameDetail { name: "Score", value: format!("{}", game.score) },
                // Add your game-specific details
            ].span()
        }

        fn token_name(self: @ContractState, token_id: u64) -> ByteArray {
            self.validate_token_ownership(token_id);
            "Your Game Name"
        }

        fn token_description(self: @ContractState, token_id: u64) -> ByteArray {
            self.validate_token_ownership(token_id);
            "Your game description"
        }
    }

    #[abi(embed_v0)]
    impl GameDetailsSVGImpl of IMinigameDetailsSVG<ContractState> {
        fn game_details_svg(self: @ContractState, token_id: u64) -> ByteArray {
            self.validate_token_ownership(token_id);

            // Read game state
            let store = StoreTrait::new(self.world(@NAMESPACE()));
            let game = store.game(token_id);

            // Generate SVG from game state
            generate_svg(game)
        }
    }
}
```

---

### Settings Contract

The Settings contract manages **game configuration**.

#### Required Interfaces

**`IMinigameSettings`** - Settings existence check

```cairo
trait IMinigameSettings<ContractState> {
    fn settings_exist(self: @ContractState, settings_id: u32) -> bool;
}
```

**`IMinigameSettingsDetails`** - Settings retrieval

```cairo
trait IMinigameSettingsDetails<ContractState> {
    fn settings_details(self: @ContractState, settings_id: u32) -> GameSettingDetails;
}
```

#### Implementation Pattern

```cairo
#[dojo::contract]
mod Settings {
    use game_components::minigame::extensions::settings::settings::SettingsComponent;

    component!(path: SettingsComponent, storage: settings, event: SettingsEvent);

    fn dojo_init(ref self: ContractState) {
        self.settings.initializer();

        // Create default settings
        let setting = create_default_setting();
        store.set_setting(@setting);

        // Register with MinigameComponent
        let minigame = get_minigame(world);
        let token_address = minigame.token_address();

        self.settings.create_settings(
            game_address: minigame.contract_address,
            settings_id: setting.id,
            name: setting.name,
            description: setting.description,
            settings: setting.details(),
            minigame_token_address: token_address,
        );
    }

    #[abi(embed_v0)]
    impl GameSettingsImpl of IMinigameSettings<ContractState> {
        fn settings_exist(self: @ContractState, settings_id: u32) -> bool {
            let store = StoreTrait::new(self.world(@NAMESPACE()));
            let setting = store.setting(settings_id);
            setting.exists()
        }
    }

    #[abi(embed_v0)]
    impl GameSettingsDetailsImpl of IMinigameSettingsDetails<ContractState> {
        fn settings_details(self: @ContractState, settings_id: u32) -> GameSettingDetails {
            let store = StoreTrait::new(self.world(@NAMESPACE()));
            let setting = store.setting(settings_id);

            GameSettingDetails {
                name: setting.name,
                description: setting.description,
                settings: setting.as_array(), // Your settings format
            }
        }
    }
}
```

---

## Implementation Guide

### Required Components

To implement Denshokan for your game, you need:

1. **Dojo World** with your game namespace
2. **Game State Models** (Dojo models with `#[key] id: u64`)
3. **Minigame Contract** implementing `IMinigameTokenData`
4. **Renderer Contract** implementing `IMinigameDetails` and `IMinigameDetailsSVG`
5. **Settings Contract** implementing `IMinigameSettings` and `IMinigameSettingsDetails`
6. **Game Logic Contracts** (your custom gameplay)

### Deployment Flow

```cairo
// 1. Deploy Dojo World
let world = deploy_world("YOUR_NAMESPACE");

// 2. Deploy token collection (Denshokan/MinigameToken)
let token_address = deploy_denshokan_token();

// 3. Deploy Settings contract
let settings = Settings::deploy();
settings.dojo_init();

// 4. Deploy Renderer contract
let renderer = Renderer::deploy();

// 5. Deploy Minigame contract (hub)
let minigame = Minigame::deploy();
minigame.dojo_init(token_address);

// 6. Deploy your game logic contracts
let game_logic = YourGameLogic::deploy();
game_logic.dojo_init();
```

### Basic Usage

```cairo
// Mint a game token
let game_id = mint_game(
    minigame_token_address: token_address,
    game_address: minigame_address,
    player_name: Option::Some('Alice'),
    settings_id: Option::Some(1),
    to: player_address,
    soulbound: false,
);

// Initialize game state in your model
let mut game_state = YourGameModel::new(game_id);
store.set_game(@game_state);

// Game state updates
game_state.update(/* your game logic */);
store.set_game(@game_state);

// Query token data
let score = minigame.score(game_id);
let is_over = minigame.game_over(game_id);

// Render token
let svg = renderer.game_details_svg(game_id);
```

---

## Extending Denshokan

### For Different Game Types

**Card Game Example**:
```cairo
#[dojo::model]
struct CardGame {
    #[key]
    id: u64,
    hand: Array<Card>,
    deck_remaining: u8,
    score: u32,
    // ...
}
```

**Board Game Example**:
```cairo
#[dojo::model]
struct BoardGame {
    #[key]
    id: u64,
    board_state: felt252,
    current_player: u8,
    winner: Option<ContractAddress>,
    // ...
}
```

**Puzzle Game Example**:
```cairo
#[dojo::model]
struct PuzzleGame {
    #[key]
    id: u64,
    grid: Array<u8>,
    moves: u32,
    completed: bool,
    // ...
}
```

### Custom Extensions

You can extend beyond the core standard:

- **Multiple Renderers**: Swap rendering styles (2D, 3D, ASCII art)
- **Dynamic Settings**: Allow players to create custom game modes
- **Achievements**: Track cross-game achievements
- **Tournaments**: Add competitive layers
- **Rewards**: Integrate token economies
- **Social**: Add multiplayer or spectating features

**The core Denshokan standard remains the same**: ERC-721 tokens with dynamic metadata from onchain game state, managed through the Minigame-Renderer-Settings architecture.

---

## Key Design Patterns

### 1. DNS-Based Service Discovery

Contracts find each other via Dojo DNS:
```cairo
let (game_address, _) = world.dns(@MINIGAME()).expect('Minigame not found');
```

### 2. Token ID = Game ID

Direct 1:1 mapping:
```cairo
let token_id: u64 = mint_token(...);
let game_state = store.game(token_id); // Same ID
```

### 3. Dynamic Metadata

NFT appearance reflects game state:
```cairo
fn game_details_svg(token_id: u64) -> ByteArray {
    let game = store.game(token_id);
    generate_svg_from_state(game) // Always current
}
```

### 4. Composable Architecture

Swap components without changing core:
```cairo
// Different renderers for same game
renderer_v1.game_details_svg(token_id); // Pixel art
renderer_v2.game_details_svg(token_id); // 3D view
```

---

## Comparison to Traditional Standards

| Feature | ERC-721 | ERC-1155 | Denshokan |
|---------|---------|----------|-----------|
| **Purpose** | Unique tokens | Multi-token | Game session tokens |
| **Metadata** | Static | Static | Dynamic (onchain) |
| **State** | Minimal | Minimal | Full game state |
| **Rendering** | Off-chain | Off-chain | Onchain (SVG) |
| **Composability** | Transfer only | Transfer + batch | Game logic + settings + rendering |
| **Use Case** | NFTs, collectibles | Gaming items | Playable game sessions |

---

## Summary

**Denshokan** is a standard for creating onchain game NFTs where:

✓ Each token is a playable game session
✓ Game state is fully onchain in Dojo models
✓ Metadata is dynamically generated from state
✓ Multiple renderers and settings are supported
✓ Architecture separates token, rendering, and game logic

**Core Requirements**:
- Minigame contract (token hub with game data)
- Renderer contract (dynamic metadata generation)
- Settings contract (game configuration)
- Game state stored in Dojo models

This enables an "arcade" where gameplay sessions are tradeable NFTs with verifiable, onchain state and dynamic visualizations.
