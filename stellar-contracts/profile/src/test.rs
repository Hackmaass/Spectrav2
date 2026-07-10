#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_create_and_get_profile() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProfileContract, ());
    let client = ProfileContractClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    client.create_profile(
        &user,
        &String::from_str(&env, "Alice"),
        &String::from_str(&env, "alice@test.com"),
        &String::from_str(&env, "1234567890"),
        &String::from_str(&env, "Dev"),
        &1u32,
    );

    let profile = client.get_profile(&user);
    assert_eq!(profile.name, String::from_str(&env, "Alice"));
    assert_eq!(profile.avatar_id, 1);
}

#[test]
fn test_update_profile() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProfileContract, ());
    let client = ProfileContractClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    client.create_profile(
        &user,
        &String::from_str(&env, "Bob"),
        &String::from_str(&env, "bob@test.com"),
        &String::from_str(&env, "1234567890"),
        &String::from_str(&env, "Dev"),
        &1u32,
    );

    client.update_profile(
        &user,
        &String::from_str(&env, "Bob Builder"),
        &String::from_str(&env, "bob@test.com"),
        &String::from_str(&env, "1234567890"),
        &String::from_str(&env, "Lead Dev"),
        &2u32,
    );

    let profile = client.get_profile(&user);
    assert_eq!(profile.name, String::from_str(&env, "Bob Builder"));
    assert_eq!(profile.avatar_id, 2);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #3)")]
fn test_invalid_avatar() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProfileContract, ());
    let client = ProfileContractClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    client.create_profile(
        &user,
        &String::from_str(&env, "Charlie"),
        &String::from_str(&env, "charlie@test.com"),
        &String::from_str(&env, "1234567890"),
        &String::from_str(&env, "Dev"),
        &7u32, // Invalid
    );
}

#[test]
fn test_delete_profile() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ProfileContract, ());
    let client = ProfileContractClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    client.create_profile(
        &user,
        &String::from_str(&env, "Dave"),
        &String::from_str(&env, "dave@test.com"),
        &String::from_str(&env, "1234567890"),
        &String::from_str(&env, "Dev"),
        &1u32,
    );

    client.delete_profile(&user);

    let result = client.try_get_profile(&user);
    assert!(result.is_err());
}
