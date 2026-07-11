#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, token};

#[contract]
pub struct SpectraBridgeContract;

#[contracttype]
pub enum DataKey {
    Admin,
}

#[contractimpl]
impl SpectraBridgeContract {
    pub fn initialize(env: Env, admin: Address) {
        assert!(!env.storage().instance().has(&DataKey::Admin), "Already initialized");
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn bridge_to_evm(
        env: Env,
        user: Address,
        token_address: Address,
        amount: i128,
        destination_chain: String,
        destination_address: String, // 0x... EVM address
    ) {
        user.require_auth();
        assert!(amount > 0, "Amount must be greater than zero");

        // Transfer tokens from user to the bridge contract (locking them)
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // Emit an event that the Axelar relayer will pick up to execute GMP on the destination chain.
        // The topic structure matches Axelar GMP event requirements (conceptual scaffolding).
        let topics = (soroban_sdk::symbol_short!("gmp_out"), destination_chain, destination_address);
        env.events().publish(topics, (token_address, amount));
    }
}
