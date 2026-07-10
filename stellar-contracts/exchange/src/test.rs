#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env};

// We would need the saas contract for testing cross-contract calls.
// We can test the basic math or skip full integration test for the mock.
#[test]
fn test_get_quote() {
    let env = Env::default();
    let token_in = Address::generate(&env);
    let token_out = Address::generate(&env);

    let amount_out = ExchangeContract::get_quote(env, token_in, token_out, 100);
    assert_eq!(amount_out, 100);
}
