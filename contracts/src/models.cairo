use starknet::ContractAddress;

// Pact NFT contract address and configuration
#[derive(Drop, Serde)]
#[dojo::model]
pub struct RoninPact {
    #[key]
    pub game_id: u32, // Always 0 for singleton
    pub pact: ContractAddress,
    pub time_lock: u64,
}

// Player's last minted token_id
#[derive(Drop, Serde)]
#[dojo::model]
pub struct PlayerToken {
    #[key]
    pub player: ContractAddress,
    pub token_id: u256,
}

// Whitelisted game collection
#[derive(Drop, Serde)]
#[dojo::model]
pub struct RoninGame {
    #[key]
    pub contract_address: ContractAddress,
    pub active: bool,
}

// Quiz answer hashes
#[derive(Drop, Serde)]
#[dojo::model]
pub struct RoninAnswers {
    #[key]
    pub game_id: u32, // Always 0 for singleton
    pub answers: Array<felt252>,
}
