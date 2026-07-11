#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env, Symbol, Vec};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    InsufficientAmount = 2,
    SlippageTooHigh = 3,
    QuotaExceeded = 4,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    SaasContract,
}

#[contract]
pub struct ExchangeContract;

#[contractimpl]
impl ExchangeContract {
    pub fn __constructor(env: Env, admin: Address, saas_contract: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::SaasContract, &saas_contract);
    }

    /// Very basic mock swap logic. Assumes 1:1 if same, or hardcoded mock rates.
    pub fn get_quote(_env: Env, _token_in: Address, _token_out: Address, amount_in: i128) -> i128 {
        // Mock 1:1 conversion for demo purposes
        amount_in
    }

    pub fn swap(
        env: Env,
        user: Address,
        token_in: Address,
        token_out: Address,
        amount_in: i128,
        min_amount_out: i128,
    ) -> Result<i128, Error> {
        user.require_auth();

        if amount_in <= 0 {
            return Err(Error::InsufficientAmount);
        }

        let saas_addr: Address = env.storage().instance().get(&DataKey::SaasContract).unwrap();
        
        // Call SaaS contract to enforce quota
        // record_transaction(user: Address) -> Result<(), Error>
        env.invoke_contract::<()>(
            &saas_addr,
            &Symbol::new(&env, "record_transaction"), // Method name exported by SaasContract
            Vec::from_array(&env, [user.to_val()]),
        );

        let amount_out = Self::get_quote(env.clone(), token_in.clone(), token_out.clone(), amount_in);

        if amount_out < min_amount_out {
            return Err(Error::SlippageTooHigh);
        }

        // --- ACTUAL TOKEN TRANSFERS ---
        let client_in = token::Client::new(&env, &token_in);
        let client_out = token::Client::new(&env, &token_out);
        let contract_addr = env.current_contract_address();
        
        // 1. Transfer In
        client_in.transfer(&user, &contract_addr, &amount_in);
        
        // 2. Transfer Out
        client_out.transfer(&contract_addr, &user, &amount_out);

        Ok(amount_out)
    }
}
