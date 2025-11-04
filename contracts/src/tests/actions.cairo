// Integration tests for Ronin Quest actions contract
// Tests admin functions, trial completion, and full lifecycle

use starknet::ContractAddress;
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo::model::ModelStorage;
use dojo_snf_test::{
    spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
    WorldStorageTestTrait
};
use snforge_std::{
    start_cheat_caller_address, stop_cheat_caller_address, start_cheat_block_timestamp,
    declare, ContractClassTrait, DeclareResultTrait
};
use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};

use ronin_quest::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait};
use ronin_quest::models::{RoninPact, RoninGame, RoninAnswers, PlayerToken};
use ronin_quest::token::pact::{IRoninPactDispatcher, IRoninPactDispatcherTrait};
use super::mocks::{IMockERC721Dispatcher, IMockERC721DispatcherTrait};

// ============================================================================
// Test Helpers
// ============================================================================

// Test account constants
const OWNER: felt252 = 'OWNER';
const PLAYER: felt252 = 'PLAYER';
const OTHER: felt252 = 'OTHER';

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
        namespace: "ronin_quest",
        resources: [
            TestResource::Model("RoninPact"),
            TestResource::Model("RoninGame"),
            TestResource::Model("RoninAnswers"),
            TestResource::Model("PlayerToken"),
            TestResource::Contract("actions"),
            TestResource::Event("WazaCompleted"),
            TestResource::Event("ChiCompleted"),
            TestResource::Event("ShinCompleted"),
            TestResource::Event("PactMinted"),
        ].span()
    }
}

fn contract_defs() -> Span<ContractDef> {
    [
        ContractDefTrait::new(@"ronin_quest", @"actions")
            .with_writer_of([dojo::utils::bytearray_hash(@"ronin_quest")].span())
    ].span()
}

// Contract deployment helpers
fn deploy_pact(owner: ContractAddress) -> ContractAddress {
    let contract = declare("RoninPact").unwrap().contract_class();
    let (pact_address, _) = contract.deploy(@array![owner.into()]).unwrap();
    pact_address
}

fn deploy_test_game(owner: ContractAddress) -> ContractAddress {
    let contract = declare("MockERC721").unwrap().contract_class();
    let (game_address, _) = contract.deploy(@array![owner.into()]).unwrap();
    game_address
}

// World setup with initialized contracts
fn setup_world() -> (WorldStorage, IActionsDispatcher, ContractAddress) {
    let ndef = namespace_def();
    let mut world = spawn_test_world([ndef].span());

    // Sync permissions and initialize contracts
    world.sync_perms_and_inits(contract_defs());

    // Get actions contract address
    let (actions_address, _) = world.dns(@"actions").unwrap();
    let actions = IActionsDispatcher { contract_address: actions_address };

    (world, actions, actions_address)
}

// ============================================================================
// Admin Function Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_set_pact() {
    let (world, actions, actions_address) = setup_world();

    // Deploy pact contract
    let pact_address = deploy_pact(owner());

    // Set pact address with 24-hour time lock
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    stop_cheat_caller_address(actions_address);

    // Verify pact was set with correct time lock
    let pact_config: RoninPact = world.read_model(0);
    assert(pact_config.pact == pact_address, 'Pact not set');
    assert(pact_config.time_lock == 86400, 'Time lock not set');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_set_game() {
    let (world, actions, actions_address) = setup_world();

    // Deploy mock game contract
    let game1 = deploy_test_game(owner());

    // Set game as active
    start_cheat_caller_address(actions_address, owner());
    actions.set_game(game1, true);
    stop_cheat_caller_address(actions_address);

    // Verify game was set
    let game_config: RoninGame = world.read_model(game1);
    assert(game_config.active == true, 'Game not set active');
    assert(game_config.contract_address == game1, 'Wrong address');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_set_quiz() {
    let (world, actions, actions_address) = setup_world();

    // Set quiz answers
    let answers = array![
        0x12345678,
        0x23456789,
        0x34567890,
        0x45678901,
        0x56789012
    ];

    start_cheat_caller_address(actions_address, owner());
    actions.set_quiz(answers.clone());
    stop_cheat_caller_address(actions_address);

    // Verify answers were set
    let answers_config: RoninAnswers = world.read_model(0);
    assert(answers_config.answers.len() == 5, 'Answers not set');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_view_functions() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy pact contract
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_addr = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Test get_time_lock view function
    let time_lock = actions.get_time_lock();
    assert(time_lock == 86400, 'Wrong time lock');

    // Mint NFT via actions
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');
    stop_cheat_caller_address(actions_address);

    // Test get_player_token_id view function
    let token_id = actions.get_player_token_id(player_addr);
    assert(token_id == 0, 'Wrong token id');

    // Verify the token actually exists
    assert(pact.owner_of(token_id) == player_addr, 'Token not owned');
}

// ============================================================================
// NFT Minting Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_mint_nft_via_actions() {
    let (world, actions, actions_address) = setup_world();

    // Deploy pact contract
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_controller = player();
    let other_player = other();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    stop_cheat_caller_address(actions_address);

    // Set actions as the minter for pact
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Mint first NFT from Player (Controller) via actions contract
    start_cheat_caller_address(actions_address, player_controller);
    actions.mint('testuser');
    stop_cheat_caller_address(actions_address);

    // Verify first NFT was minted to the Controller
    assert(pact.balance_of(player_controller) == 1, 'NFT not minted');
    assert(pact.owner_of(0) == player_controller, 'Wrong owner');

    // Verify PlayerToken model was written with token_id = 0
    let player_token: PlayerToken = world.read_model(player_controller);
    assert(player_token.token_id == 0, 'PlayerToken not written');

    // Mint second NFT from other player to verify token_id increments
    start_cheat_caller_address(actions_address, other_player);
    actions.mint('otheruser');
    stop_cheat_caller_address(actions_address);

    // Verify second NFT was minted with token_id = 1
    assert(pact.balance_of(other_player) == 1, 'Second NFT not minted');
    assert(pact.owner_of(1) == other_player, 'Wrong owner for token 1');

    // Verify PlayerToken model for second player has token_id = 1
    let other_token: PlayerToken = world.read_model(other_player);
    assert(other_token.token_id == 1, 'Second PlayerToken wrong');

    // Verify first player's token_id is still 0
    let player_token_after: PlayerToken = world.read_model(player_controller);
    assert(player_token_after.token_id == 0, 'First token id changed');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Already owns a pact NFT',))]
fn test_mint_duplicate_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy pact contract
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_controller = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    stop_cheat_caller_address(actions_address);

    // Set actions as minter in pact
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Mint first NFT - should succeed
    start_cheat_caller_address(actions_address, player_controller);
    actions.mint('testuser');

    // Try to mint second NFT - should fail with 'Already owns a pact NFT'
    actions.mint('testuser');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Only minter',))]
fn test_mint_unauthorized_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Deploy pact contract
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let unauthorized_caller = player();

    // Configure actions contract as the authorized minter
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Try to mint directly as unauthorized caller - should fail
    start_cheat_caller_address(pact_address, unauthorized_caller);
    pact.mint(unauthorized_caller, 'testuser');
}

// ============================================================================
// Trial Completion Tests - Waza (Technique)
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_complete_waza() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact and mock game
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };
    let game_address = deploy_test_game(owner());
    let game = IMockERC721Dispatcher { contract_address: game_address };
    let game_erc721 = IERC721Dispatcher { contract_address: game_address };

    let player_controller = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    actions.set_game(game_address, true);
    stop_cheat_caller_address(actions_address);

    // Set player as minter and actions as minter for completion functions
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_controller);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints NFT and game NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Now set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    start_cheat_caller_address(game_address, player_controller);
    game.mint(player_controller);
    stop_cheat_caller_address(game_address);

    // Verify player has game NFT
    assert(game_erc721.balance_of(player_controller) >= 1, 'No game NFT');

    // Complete waza trial - Player (Controller) calls
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_waza(0, game_address);
    stop_cheat_caller_address(actions_address);

    // Verify waza trial is complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == true, 'Waza not complete');
    assert(progress.chi_complete == false, 'Chi should not be complete');
    assert(progress.shin_complete == false, 'Shin should not be complete');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('No game tokens owned!',))]
fn test_waza_no_nft_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact and mock game
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };
    let game_address = deploy_test_game(owner());

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    actions.set_game(game_address, true);
    stop_cheat_caller_address(actions_address);

    let player_controller = player();

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_controller);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints NFT but NO game NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Try to complete waza without game NFT - should fail
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_waza(0, game_address);
}

// ============================================================================
// Trial Completion Tests - Chi (Wisdom)
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_complete_chi() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    // Configure actions contract with quiz answers
    let answers = array![
        0x12345678,
        0x23456789,
        0x34567890,
        0x45678901,
        0x56789012
    ];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    actions.set_quiz(answers.clone());
    stop_cheat_caller_address(actions_address);

    let player_controller = player();

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_controller);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Complete chi trial with correct answers (at least 3 correct)
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789, 0x34567890];
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_chi(0, questions, player_answers);
    stop_cheat_caller_address(actions_address);

    // Verify chi trial is complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == false, 'Waza should not be complete');
    assert(progress.chi_complete == true, 'Chi not complete');
    assert(progress.shin_complete == false, 'Shin should not be complete');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Incorrect answers!',))]
fn test_chi_wrong_answers_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    // Configure actions contract with quiz answers
    let answers = array![
        0x12345678,
        0x23456789,
        0x34567890,
        0x45678901,
        0x56789012
    ];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    actions.set_quiz(answers.clone());
    stop_cheat_caller_address(actions_address);

    let player_controller = player();

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_controller);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Try to complete chi trial with wrong answers (only 2 correct out of 3)
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789, 0x99999999]; // Last one wrong
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_chi(0, questions, player_answers);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Question/answer mismatch',))]
fn test_chi_mismatched_length_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    // Configure actions contract with quiz answers
    let answers = array![0x12345678, 0x23456789, 0x34567890];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    actions.set_quiz(answers);
    stop_cheat_caller_address(actions_address);

    let player_controller = player();

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_controller);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Try with mismatched lengths
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789]; // One less answer
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_chi(0, questions, player_answers);
}

// ============================================================================
// Trial Completion Tests - Shin (Spirit)
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_complete_shin() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_addr = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_addr);
    stop_cheat_caller_address(pact_address);

    // Player mints NFT
    start_cheat_caller_address(pact_address, player_addr);
    pact.mint(player_addr, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Fast forward 24 hours (86400 seconds)
    start_cheat_block_timestamp(pact_address, 86401);
    start_cheat_block_timestamp(actions_address, 86401);

    // Complete shin trial with vow text
    let vow: ByteArray = "I pledge to explore onchain gaming with courage and curiosity";
    start_cheat_caller_address(actions_address, player_addr);
    actions.complete_shin(0, vow);
    stop_cheat_caller_address(actions_address);

    // Verify shin trial is complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == false, 'Waza should not be complete');
    assert(progress.chi_complete == false, 'Chi should not be complete');
    assert(progress.shin_complete == true, 'Shin not complete');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
fn test_get_vow_hash() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_addr = player();

    // Configure actions contract and set it as minter
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 0);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Player mints NFT through actions contract and completes shin trial
    let vow: ByteArray = "I pledge to explore onchain gaming with courage and curiosity";
    start_cheat_caller_address(actions_address, player_addr);
    actions.mint('testuser');
    actions.complete_shin(0, vow.clone());
    stop_cheat_caller_address(actions_address);

    // Verify vow hash was stored and can be retrieved
    let stored_hash = pact.get_vow_hash(0);
    assert(stored_hash != 0, 'Vow hash should not be zero');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Time lock not elapsed!',))]
fn test_shin_timelock_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_addr = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_addr);
    stop_cheat_caller_address(pact_address);

    // Player mints NFT
    start_cheat_caller_address(pact_address, player_addr);
    pact.mint(player_addr, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Try to complete immediately without waiting 24 hours - should fail
    let vow: ByteArray = "I pledge to be patient and wait for the time lock";
    start_cheat_caller_address(actions_address, player_addr);
    actions.complete_shin(0, vow);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Vow cannot be empty',))]
fn test_shin_empty_vow_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_addr = player();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_addr);
    stop_cheat_caller_address(pact_address);

    // Player mints NFT
    start_cheat_caller_address(pact_address, player_addr);
    pact.mint(player_addr, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Fast forward 24 hours
    start_cheat_block_timestamp(pact_address, 86401);
    start_cheat_block_timestamp(actions_address, 86401);

    // Try to complete with empty vow - should fail
    let vow: ByteArray = "";
    start_cheat_caller_address(actions_address, player_addr);
    actions.complete_shin(0, vow);
}

// ============================================================================
// Ownership Check Tests
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Not token owner',))]
fn test_waza_non_owner_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact and mock game
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };
    let game_address = deploy_test_game(owner());
    let game = IMockERC721Dispatcher { contract_address: game_address };

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    actions.set_game(game_address, true);
    stop_cheat_caller_address(actions_address);

    // player() and other() return different Controller instances
    let player_controller = player();
    let other_controller = other();

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_controller);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints pact NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Other (Controller) mints game NFT
    start_cheat_caller_address(game_address, other_controller);
    game.mint(other_controller);
    stop_cheat_caller_address(game_address);

    // Other (Controller) tries to complete waza for player's token - should fail
    start_cheat_caller_address(actions_address, other_controller);
    actions.complete_waza(0, game_address);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Not token owner',))]
fn test_chi_non_owner_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    // Configure actions contract with quiz answers
    let answers = array![0x12345678, 0x23456789, 0x34567890];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    actions.set_quiz(answers);
    stop_cheat_caller_address(actions_address);

    // player() and other() return different Controller instances
    let player_controller = player();
    let other_controller = other();

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_controller);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) mints NFT
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Other (Controller) tries to complete chi for player's token - should fail
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789, 0x34567890];
    start_cheat_caller_address(actions_address, other_controller);
    actions.complete_chi(0, questions, player_answers);
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 10000, l2_gas: 20000000)]
#[should_panic(expected: ('Not token owner',))]
fn test_shin_non_owner_fails() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };

    let player_addr = player();
    let other_addr = other();

    // Configure actions contract
    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_addr);
    stop_cheat_caller_address(pact_address);

    // Player mints NFT
    start_cheat_caller_address(pact_address, player_addr);
    pact.mint(player_addr, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    // Fast forward 24 hours
    start_cheat_block_timestamp(pact_address, 86401);
    start_cheat_block_timestamp(actions_address, 86401);

    // Other tries to complete shin for player's token - should fail
    let vow: ByteArray = "Trying to complete someone else's trial";
    start_cheat_caller_address(actions_address, other_addr);
    actions.complete_shin(0, vow);
}

// ============================================================================
// Full Lifecycle Test
// ============================================================================

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 12000, l2_gas: 25000000)]
fn test_full_lifecycle() {
    let (_world, actions, actions_address) = setup_world();

    // Setup: Deploy pact and mock game
    let pact_address = deploy_pact(owner());
    let pact = IRoninPactDispatcher { contract_address: pact_address };
    let game_address = deploy_test_game(owner());
    let game = IMockERC721Dispatcher { contract_address: game_address };

    let player_controller = player();

    // Configure actions contract
    let answers = array![
        0x12345678,
        0x23456789,
        0x34567890,
        0x45678901,
        0x56789012
    ];

    start_cheat_caller_address(actions_address, owner());
    actions.set_pact(pact_address, 86400);
    actions.set_game(game_address, true);
    actions.set_quiz(answers.clone());
    stop_cheat_caller_address(actions_address);

    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(player_controller);
    stop_cheat_caller_address(pact_address);

    // Player (Controller) setup: mint NFTs
    start_cheat_caller_address(pact_address, player_controller);
    pact.mint(player_controller, 'testuser');
    stop_cheat_caller_address(pact_address);

    // Set actions as minter for trial completion
    start_cheat_caller_address(pact_address, owner());
    pact.set_minter(actions_address);
    stop_cheat_caller_address(pact_address);

    start_cheat_caller_address(game_address, player_controller);
    game.mint(player_controller);
    stop_cheat_caller_address(game_address);

    // Verify initial state - no trials complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == false, 'Waza should start incomplete');
    assert(progress.chi_complete == false, 'Chi should start incomplete');
    assert(progress.shin_complete == false, 'Shin should start incomplete');

    // Complete all three trials - Player (Controller) calls all (as the NFT owner)
    // 1. Complete Waza (technique) - player calls
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_waza(0, game_address);
    stop_cheat_caller_address(actions_address);
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == true, 'Waza not complete');

    // 2. Complete Chi (wisdom) - player calls
    let questions = array![0, 1, 2];
    let player_answers = array![0x12345678, 0x23456789, 0x34567890];
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_chi(0, questions, player_answers);
    stop_cheat_caller_address(actions_address);
    let progress = pact.get_progress(0);
    assert(progress.chi_complete == true, 'Chi not complete');

    // 3. Complete Shin (spirit) - Player calls
    // Fast forward 24 hours to pass time lock
    start_cheat_block_timestamp(pact_address, 86401);
    start_cheat_block_timestamp(actions_address, 86401);

    let vow: ByteArray = "I vow to honor the path of the ronin and master all trials";
    start_cheat_caller_address(actions_address, player_controller);
    actions.complete_shin(0, vow);
    stop_cheat_caller_address(actions_address);

    // Verify final state - all three trials complete
    let progress = pact.get_progress(0);
    assert(progress.waza_complete == true, 'Final: Waza not complete');
    assert(progress.chi_complete == true, 'Final: Chi not complete');
    assert(progress.shin_complete == true, 'Final: Shin not complete');
}
