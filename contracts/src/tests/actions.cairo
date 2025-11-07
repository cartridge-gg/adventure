// Integration tests for FOCG Adventure actions contract
// Tests admin functions, level completion, and full lifecycle

use starknet::ContractAddress;
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo::model::ModelStorage;
use dojo_snf_test::{
    spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
    WorldStorageTestTrait
};
use snforge_std::{
    start_cheat_caller_address, stop_cheat_caller_address,
    declare, ContractClassTrait, DeclareResultTrait
};
use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};

use focg_adventure::systems::actions::{IAdventureActionsDispatcher, IAdventureActionsDispatcherTrait};
use focg_adventure::models::{AdventureConfig, PlayerToken, LevelConfig};
use focg_adventure::token::map::{IAdventureMapDispatcher, IAdventureMapDispatcherTrait};
use focg_adventure::denshokan::mock::{IMockGameAdminDispatcher, IMockGameAdminDispatcherTrait};

// ============================================================================
// Test Helpers
// ============================================================================

// Test account constants
const OWNER: felt252 = 'OWNER';
const PLAYER: felt252 = 'PLAYER';
const OTHER: felt252 = 'OTHER';
const TOTAL_LEVELS: u8 = 6;

fn owner() -> ContractAddress {
    OWNER.try_into().unwrap()
}

fn player() -> ContractAddress {
    PLAYER.try_into().unwrap()
}

fn other() -> ContractAddress {
    OTHER.try_into().unwrap()
}

// Dojo world configuration
fn namespace_def() -> NamespaceDef {
    NamespaceDef {
        namespace: "focg_adventure",
        resources: [
            TestResource::Model("AdventureConfig"),
            TestResource::Model("PlayerToken"),
            TestResource::Model("LevelConfig"),
            TestResource::Contract("actions"),
            TestResource::Event("MapMinted"),
            TestResource::Event("LevelCompleted"),
        ].span()
    }
}

fn contract_defs() -> Span<ContractDef> {
    [
        ContractDefTrait::new(@"focg_adventure", @"actions")
            .with_writer_of([dojo::utils::bytearray_hash(@"focg_adventure")].span())
    ].span()
}

// Contract deployment helpers
fn deploy_adventure_map(owner: ContractAddress, total_levels: u8) -> ContractAddress {
    let contract = declare("AdventureMap").unwrap().contract_class();
    let (nft_address, _) = contract.deploy(@array![owner.into(), total_levels.into()]).unwrap();
    nft_address
}

fn deploy_mock_game() -> ContractAddress {
    let contract = declare("MockGame").unwrap().contract_class();
    let (game_address, _) = contract.deploy(@array![]).unwrap();
    game_address
}

// World setup with initialized contracts
fn setup_world() -> (WorldStorage, IAdventureActionsDispatcher, ContractAddress) {
    let ndef = namespace_def();
    let mut world = spawn_test_world([ndef].span());

    // Sync permissions and initialize contracts
    world.sync_perms_and_inits(contract_defs());

    // Get actions contract address
    let (actions_address, _) = world.dns(@"actions").unwrap();
    let actions = IAdventureActionsDispatcher { contract_address: actions_address };

    (world, actions, actions_address)
}

// ============================================================================
// Admin Function Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_set_nft_contract() {
    let (world, actions, actions_address) = setup_world();

    // Deploy Adventure Map NFT contract
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);

    // Set NFT contract address in actions
    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    stop_cheat_caller_address(actions_address);

    // Verify config was set correctly
    let config: AdventureConfig = world.read_model(0);
    assert(config.nft_contract == nft_address, 'NFT address not set');
    assert(config.total_levels == TOTAL_LEVELS, 'Total levels not set');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_set_level_config() {
    let (world, actions, actions_address) = setup_world();

    // Deploy mock game
    let game_address = deploy_mock_game();

    // Configure level 1 as a challenge level
    start_cheat_caller_address(actions_address, owner());
    actions.set_challenge(1, game_address, 1000);
    stop_cheat_caller_address(actions_address);

    // Verify level config was set
    let level_config: LevelConfig = world.read_model(1_u8);
    assert(level_config.level_number == 1, 'Level number wrong');
    assert(level_config.level_type == 'challenge', 'Level type wrong');
    assert(level_config.game_contract == game_address, 'Game contract wrong');
    assert(level_config.minimum_score == 1000, 'Min score wrong');
}

// ============================================================================
// NFT Minting Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_mint_via_actions() {
    let (world, actions, actions_address) = setup_world();

    // Deploy and configure Adventure Map NFT
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);
    let nft = IAdventureMapDispatcher { contract_address: nft_address };

    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    stop_cheat_caller_address(actions_address);

    // Set actions as minter
    start_cheat_caller_address(nft_address, owner());
    nft.set_minter(actions_address);
    stop_cheat_caller_address(nft_address);

    // Mint NFT via actions contract
    let player_addr = player();
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');
    stop_cheat_caller_address(actions_address);

    // Verify NFT was minted to player
    let erc721 = IERC721Dispatcher { contract_address: nft_address };
    assert(erc721.balance_of(player_addr) == 1, 'NFT not minted');
    assert(erc721.owner_of(0) == player_addr, 'Wrong owner');

    // Verify PlayerToken model was written
    let player_token: PlayerToken = world.read_model(player_addr);
    assert(player_token.token_id == 0, 'PlayerToken not written');

    // Verify username was set
    assert(nft.get_username(0) == 'testuser', 'Username not set');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Already owns an Adventure Map',))]
fn test_mint_duplicate_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy and configure Adventure Map NFT
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);
    let nft = IAdventureMapDispatcher { contract_address: nft_address };

    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(nft_address, owner());
    nft.set_minter(actions_address);
    stop_cheat_caller_address(nft_address);

    // Mint first NFT - should succeed
    let player_addr = player();
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');

    // Try to mint second NFT - should fail
    actions.mint('testuser');
}

// ============================================================================
// Level Completion Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_complete_challenge_level() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy and configure contracts
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);
    let nft = IAdventureMapDispatcher { contract_address: nft_address };
    let game_address = deploy_mock_game();
    let mock_game = IMockGameAdminDispatcher { contract_address: game_address };

    // Setup: Configure a game token with passing score and game_over status
    let game_id: u64 = 1;
    mock_game.complete_game(game_id, 1500); // Above minimum

    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    actions.set_challenge(1, game_address, 1000);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(nft_address, owner());
    nft.set_minter(actions_address);
    stop_cheat_caller_address(nft_address);

    // Mint NFT
    let player_addr = player();
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');

    // Complete level 1 with game_id
    actions.complete_challenge_level(0, 1, game_id);
    stop_cheat_caller_address(actions_address);

    // Verify level 1 is complete
    let progress = nft.get_progress(0);
    assert((progress & 2) != 0, 'Level 1 not complete'); // Bit 1 = level 1
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Invalid signature format',))]
fn test_complete_puzzle_level_invalid_signature_format() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy and configure contracts
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);
    let nft = IAdventureMapDispatcher { contract_address: nft_address };

    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    actions.set_puzzle(1, 0x123.try_into().unwrap());
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(nft_address, owner());
    nft.set_minter(actions_address);
    stop_cheat_caller_address(nft_address);

    // Mint NFT
    let player_addr = player();
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');

    // Try to complete with invalid signature format (should have 2 elements, not 4)
    let signature = array![1, 2, 3, 4].span(); // Wrong format
    actions.complete_puzzle_level(0, 1, signature);
    stop_cheat_caller_address(actions_address);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Invalid solution',))]
fn test_complete_puzzle_level_invalid_signature() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy and configure contracts
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);
    let nft = IAdventureMapDispatcher { contract_address: nft_address };

    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    // Set solution address to a known public key
    actions.set_puzzle(1, 0x123.try_into().unwrap());
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(nft_address, owner());
    nft.set_minter(actions_address);
    stop_cheat_caller_address(nft_address);

    // Mint NFT
    let player_addr = player();
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');

    // Try to complete with invalid signature (wrong r, s values)
    // This will fail ECDSA verification
    let signature = array![1, 2].span(); // Invalid signature
    actions.complete_puzzle_level(0, 1, signature);
    stop_cheat_caller_address(actions_address);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Must complete previous level',))]
fn test_sequential_progression_enforced() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy and configure contracts
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);
    let nft = IAdventureMapDispatcher { contract_address: nft_address };
    let game_address = deploy_mock_game();

    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    actions.set_challenge(1, game_address, 1000);
    actions.set_challenge(2, game_address, 1000);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(nft_address, owner());
    nft.set_minter(actions_address);
    stop_cheat_caller_address(nft_address);

    // Mint NFT
    let player_addr = player();
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');

    // Try to complete level 2 without completing level 1 - should fail
    actions.complete_challenge_level(0, 2, 1);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Not token owner',))]
fn test_non_owner_cannot_complete() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy and configure contracts
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);
    let nft = IAdventureMapDispatcher { contract_address: nft_address };
    let game_address = deploy_mock_game();

    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    actions.set_challenge(1, game_address, 1000);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(nft_address, owner());
    nft.set_minter(actions_address);
    stop_cheat_caller_address(nft_address);

    // Player mints NFT
    let player_addr = player();
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');
    stop_cheat_caller_address(actions_address);

    // Other user tries to complete player's level - should fail
    let other_addr = other();
    start_cheat_caller_address(actions_address, other_addr);
    actions.complete_challenge_level(0, 1, 1);
}

// ============================================================================
// View Function Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_view_functions() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy and configure contracts
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);
    let nft = IAdventureMapDispatcher { contract_address: nft_address };

    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(nft_address, owner());
    nft.set_minter(actions_address);
    stop_cheat_caller_address(nft_address);

    // Mint NFT
    let player_addr = player();
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');
    stop_cheat_caller_address(actions_address);

    // Test get_player_token_id
    let token_id = actions.get_player_token_id(player_addr);
    assert(token_id == 0, 'Wrong token id');

    // Test get_progress - should be 0 (no levels complete)
    let progress = actions.get_progress(0);
    assert(progress == 0, 'Progress should be 0');
}

// ============================================================================
// Full Lifecycle Test
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 12000, l2_gas: 30000000)]
fn test_full_lifecycle() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy and configure contracts
    let nft_address = deploy_adventure_map(owner(), TOTAL_LEVELS);
    let nft = IAdventureMapDispatcher { contract_address: nft_address };
    let game_address = deploy_mock_game();
    let mock_game = IMockGameAdminDispatcher { contract_address: game_address };

    // Setup game tokens
    mock_game.complete_game(1, 1500);
    mock_game.complete_game(3, 2000);

    start_cheat_caller_address(actions_address, owner());
    actions.set_nft_contract(nft_address, TOTAL_LEVELS);
    // Configure 3 levels
    actions.set_challenge(1, game_address, 1000);
    actions.set_puzzle(2, 0x123.try_into().unwrap());
    actions.set_challenge(3, game_address, 1000);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(nft_address, owner());
    nft.set_minter(actions_address);
    stop_cheat_caller_address(nft_address);

    // Mint NFT
    let player_addr = player();
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');

    // Verify initial state
    let progress = nft.get_progress(0);
    assert(progress == 0, 'Initial progress wrong');

    // Complete level 1 (challenge)
    actions.complete_challenge_level(0, 1, 1);
    let progress = nft.get_progress(0);
    assert((progress & 2) != 0, 'Level 1 not complete');

    // Note: Level 2 is a puzzle level and requires valid ECDSA signatures
    // Real signature testing requires TypeScript utils integration
    // Skipping level 2 completion in this test

    // Since level 3 requires level 2 to be complete, we can't test level 3 either
    // This test now only verifies level 1 (challenge) completion

    stop_cheat_caller_address(actions_address);
}

// ============================================================================
// NFT Contract Tests (without Actions contract)
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_nft_contract_standalone() {
    // Deploy NFT contract
    let owner: ContractAddress = 'OWNER'.try_into().unwrap();
    let player: ContractAddress = 'PLAYER'.try_into().unwrap();

    let nft_class = declare("AdventureMap").unwrap().contract_class();
    let mut constructor_args: Array<felt252> = array![];
    constructor_args.append(owner.into());
    constructor_args.append(6); // total_levels

    let (nft_address, _) = nft_class.deploy(@constructor_args).unwrap();
    let nft = IAdventureMapDispatcher { contract_address: nft_address };
    let nft_erc721 = IERC721Dispatcher { contract_address: nft_address };

    // Set minter to owner for testing
    start_cheat_caller_address(nft_address, owner);
    nft.set_minter(owner);
    stop_cheat_caller_address(nft_address);

    // Test minting
    start_cheat_caller_address(nft_address, owner);
    let token_id = nft.mint(player, 'Alice');
    stop_cheat_caller_address(nft_address);

    // Verify minting
    assert(nft_erc721.balance_of(player) == 1, 'Player should own 1 NFT');
    assert(nft_erc721.owner_of(token_id) == player, 'Player should own token');
    assert(nft.get_progress(token_id) == 0, 'Progress should be 0');
    assert(nft.get_username(token_id) == 'Alice', 'Username should match');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_nft_progress_tracking() {
    // Deploy NFT contract
    let owner: ContractAddress = 'OWNER'.try_into().unwrap();
    let player: ContractAddress = 'PLAYER'.try_into().unwrap();

    let nft_class = declare("AdventureMap").unwrap().contract_class();
    let mut constructor_args: Array<felt252> = array![];
    constructor_args.append(owner.into());
    constructor_args.append(6); // total_levels

    let (nft_address, _) = nft_class.deploy(@constructor_args).unwrap();
    let nft = IAdventureMapDispatcher { contract_address: nft_address };

    // Set minter to owner for testing
    start_cheat_caller_address(nft_address, owner);
    nft.set_minter(owner);

    // Mint and test progress updates
    let token_id = nft.mint(player, 'Bob');
    assert(nft.get_progress(token_id) == 0, 'Initial progress should be 0');

    // Complete level 1
    nft.complete_level(token_id, 1);
    assert(nft.get_progress(token_id) == 2, 'Level 1: progress should be 2'); // 2^1

    // Complete level 2
    nft.complete_level(token_id, 2);
    assert(nft.get_progress(token_id) == 6, 'Level 2: progress should be 6'); // 2^1 + 2^2

    // Complete level 3
    nft.complete_level(token_id, 3);
    assert(nft.get_progress(token_id) == 14, 'Level 3: progress should be 14'); // 2^1 + 2^2 + 2^3

    stop_cheat_caller_address(nft_address);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_nft_one_per_wallet() {
    // Deploy NFT contract
    let owner: ContractAddress = 'OWNER'.try_into().unwrap();
    let player: ContractAddress = 'PLAYER'.try_into().unwrap();

    let nft_class = declare("AdventureMap").unwrap().contract_class();
    let mut constructor_args: Array<felt252> = array![];
    constructor_args.append(owner.into());
    constructor_args.append(6);

    let (nft_address, _) = nft_class.deploy(@constructor_args).unwrap();
    let nft = IAdventureMapDispatcher { contract_address: nft_address };
    let nft_erc721 = IERC721Dispatcher { contract_address: nft_address };

    start_cheat_caller_address(nft_address, owner);
    nft.set_minter(owner);

    // Mint first NFT
    let _token_id_1 = nft.mint(player, 'Alice');
    assert(nft_erc721.balance_of(player) == 1, 'Should have 1 NFT');

    // Mint second NFT to same player
    let _token_id_2 = nft.mint(player, 'Alice');
    assert(nft_erc721.balance_of(player) == 2, 'Should have 2 NFTs');

    // Note: The one-per-wallet policy is enforced at the Actions contract level,
    // not at the NFT contract level. The NFT contract just tracks ownership.

    stop_cheat_caller_address(nft_address);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_bitmap_math() {
    // Test bitmap operations manually
    let mut progress: u256 = 0;

    // Level 1 complete: set bit 1
    progress = progress | (1_u256 * 2_u256); // 2^1 = 2
    assert(progress == 2, 'Level 1: 0b000010');

    // Level 2 complete: set bit 2
    progress = progress | (1_u256 * 4_u256); // 2^2 = 4
    assert(progress == 6, 'Level 2: 0b000110');

    // Level 3 complete: set bit 3
    progress = progress | (1_u256 * 8_u256); // 2^3 = 8
    assert(progress == 14, 'Level 3: 0b001110');

    // Check individual bits
    assert((progress & 2) != 0, 'Level 1 should be set');
    assert((progress & 4) != 0, 'Level 2 should be set');
    assert((progress & 8) != 0, 'Level 3 should be set');
    assert((progress & 16) == 0, 'Level 4 should not be set');
}
