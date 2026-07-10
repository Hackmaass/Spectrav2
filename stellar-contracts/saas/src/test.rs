#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env};

#[test]
fn test_subscribe_and_limits() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    // Deploy mock token
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_client = token::StellarAssetClient::new(&env, &token_contract.address());
    let token_client_standard = token::Client::new(&env, &token_contract.address());
    
    // Mint 1000 Mock USD to user
    token_client.mint(&user, &1_000_000_0000);

    let contract_id = env.register(SaaSContract, (admin.clone(), token_contract.address()));
    let client = SaaSContractClient::new(&env, &contract_id);

    // Subscribe to Vector
    client.subscribe(&user, &PlanTier::Vector);

    assert_eq!(client.get_user_tier(&user), PlanTier::Vector);
    assert_eq!(client.check_nft_access(&user), true);

    // Check payment went to admin
    assert_eq!(token_client_standard.balance(&admin), FEE_VECTOR);

    // Test limits
    assert_eq!(client.get_remaining_transactions(&user), 15);
    
    for _ in 0..15 {
        client.record_transaction(&user);
    }
    
    assert_eq!(client.get_remaining_transactions(&user), 0);

    // 16th should fail
    let res = client.try_record_transaction(&user);
    assert!(res.is_err());
}
