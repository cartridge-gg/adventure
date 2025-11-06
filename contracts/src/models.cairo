use starknet::ContractAddress;

// Adventure Map NFT contract address and configuration
#[derive(Drop, Serde)]
#[dojo::model]
pub struct AdventureConfig {
    #[key]
    pub game_id: u32, // Always 0 for singleton
    pub nft_contract: ContractAddress,
    pub total_levels: u8,
}

// Player's minted token_id
#[derive(Drop, Serde)]
#[dojo::model]
pub struct PlayerToken {
    #[key]
    pub player: ContractAddress,
    pub token_id: u256,
}

// Level configuration (for each level 1-N)
#[derive(Drop, Serde)]
#[dojo::model]
pub struct LevelConfig {
    #[key]
    pub level_number: u8,
    pub level_type: felt252, // 'challenge' or 'puzzle'
    pub active: bool,
    pub verifier: ContractAddress, // Used for challenge levels
    pub solution_address: ContractAddress, // Used for puzzle levels
}
