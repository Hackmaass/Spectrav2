#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Symbol, Address, Env, String, Vec};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    InsufficientTier = 2,
    BadgeAlreadyMinted = 3,
    NotOwner = 4,
    NonTransferable = 5,
    NotAdmin = 6,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum BadgeType {
    Genesis = 1,
    Vector = 2,
    Nexus = 3,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    SaasContract,
    TokenCount,
    TokenOwner(u32),
    TokenUri(u32),
    UserBadge(Address, BadgeType),
}

#[contract]
pub struct NFTContract;

#[contractimpl]
impl NFTContract {
    pub fn __constructor(env: Env, admin: Address, saas_contract: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::SaasContract, &saas_contract);
        env.storage().instance().set(&DataKey::TokenCount, &0u32);
    }

    /// Check if user has NFT access via SaaS contract (Vector or Nexus tier)
    fn require_nft_access(env: &Env, user: &Address) -> Result<(), Error> {
        let saas_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::SaasContract)
            .ok_or(Error::NotInitialized)?;

        let has_access: bool = env.invoke_contract(
            &saas_addr,
            &Symbol::new(env, "check_nft_access"),
            Vec::from_array(env, [user.to_val()]),
        );

        if !has_access {
            return Err(Error::InsufficientTier);
        }
        Ok(())
    }

    /// Mint a Genesis (entry-level) badge — FREE for all users, no tier required
    pub fn mint_genesis(env: Env, user: Address) -> Result<u32, Error> {
        user.require_auth();
        // Genesis badge is open to everyone — no tier gate
        Self::mint_badge(env, user, BadgeType::Genesis, "ipfs://QmSpectraGenesisBadge")
    }

    /// Mint a Vector badge — requires Vector or Nexus subscription
    pub fn mint_vector(env: Env, user: Address) -> Result<u32, Error> {
        user.require_auth();
        Self::require_nft_access(&env, &user)?;
        Self::mint_badge(env, user, BadgeType::Vector, "ipfs://QmSpectraVectorBadge")
    }

    /// Mint a Nexus badge — requires Nexus subscription
    pub fn mint_nexus(env: Env, user: Address) -> Result<u32, Error> {
        user.require_auth();
        Self::require_nft_access(&env, &user)?;
        Self::mint_badge(env, user, BadgeType::Nexus, "ipfs://QmSpectraNexusBadge")
    }

    /// Admin-only: award any badge type to any user (for airdrops / rewarding early adopters)
    pub fn admin_mint(env: Env, badge_type: BadgeType, to: Address, uri: String) -> Result<u32, Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let badge_type_val = badge_type;
        if env.storage().persistent().has(&DataKey::UserBadge(to.clone(), badge_type_val)) {
            return Err(Error::BadgeAlreadyMinted);
        }

        let mut count: u32 = env.storage().instance().get(&DataKey::TokenCount).unwrap_or(0);
        count += 1;

        env.storage().instance().set(&DataKey::TokenCount, &count);
        env.storage().persistent().set(&DataKey::TokenOwner(count), &to);
        env.storage().persistent().set(&DataKey::TokenUri(count), &uri);
        env.storage().persistent().set(&DataKey::UserBadge(to.clone(), badge_type_val), &true);

        env.storage().persistent().extend_ttl(&DataKey::TokenOwner(count), 120 * 17280, 180 * 17280);
        env.storage().persistent().extend_ttl(&DataKey::TokenUri(count), 120 * 17280, 180 * 17280);
        env.storage().persistent().extend_ttl(&DataKey::UserBadge(to, badge_type_val), 120 * 17280, 180 * 17280);

        Ok(count)
    }

    fn mint_badge(env: Env, user: Address, b_type: BadgeType, uri: &str) -> Result<u32, Error> {
        if env.storage().persistent().has(&DataKey::UserBadge(user.clone(), b_type)) {
            return Err(Error::BadgeAlreadyMinted);
        }

        let mut count: u32 = env.storage().instance().get(&DataKey::TokenCount).unwrap_or(0);
        count += 1;

        env.storage().instance().set(&DataKey::TokenCount, &count);
        env.storage().persistent().set(&DataKey::TokenOwner(count), &user);

        let token_uri = String::from_str(&env, uri);
        env.storage().persistent().set(&DataKey::TokenUri(count), &token_uri);
        env.storage().persistent().set(&DataKey::UserBadge(user.clone(), b_type), &true);

        env.storage().persistent().extend_ttl(&DataKey::TokenOwner(count), 120 * 17280, 180 * 17280);
        env.storage().persistent().extend_ttl(&DataKey::TokenUri(count), 120 * 17280, 180 * 17280);
        env.storage().persistent().extend_ttl(&DataKey::UserBadge(user, b_type), 120 * 17280, 180 * 17280);

        Ok(count)
    }

    pub fn owner_of(env: Env, token_id: u32) -> Result<Address, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::TokenOwner(token_id))
            .ok_or(Error::NotOwner)
    }

    pub fn token_uri(env: Env, token_id: u32) -> Result<String, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::TokenUri(token_id))
            .ok_or(Error::NotOwner)
    }

    pub fn has_badge(env: Env, user: Address, badge_type: BadgeType) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::UserBadge(user, badge_type))
    }

    pub fn total_supply(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::TokenCount).unwrap_or(0)
    }

    /// Soulbound: non-transferable
    pub fn transfer(_env: Env, _from: Address, _to: Address, _token_id: u32) -> Result<(), Error> {
        Err(Error::NonTransferable)
    }
}

mod test;
