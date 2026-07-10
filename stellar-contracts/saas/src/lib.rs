#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    PaymentFailed = 3,
    DailyLimitExceeded = 4,
    TooEarlyToRenew = 5,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PlanTier {
    Alpha = 0,
    Vector = 1,
    Nexus = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TierInfo {
    pub daily_tx_limit: u32,
    pub monthly_fee: i128, // 7 decimals for standard SAC
    pub has_nft_access: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserSubscription {
    pub tier: PlanTier,
    pub last_billing_timestamp: u64,
    pub next_billing_timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DailyUsage {
    pub count: u32,
    pub first_tx_timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    MockToken,
    Tier(PlanTier),
    UserSub(Address),
    UserUsage(Address),
}

#[contract]
pub struct SaaSContract;

const DAY_IN_SECONDS: u64 = 86400;
const MONTH_IN_SECONDS: u64 = 30 * DAY_IN_SECONDS;
// Standard token decimals = 7. e.g. 15 USD = 150_000_000
const FEE_VECTOR: i128 = 150_000_000;
const FEE_NEXUS: i128 = 490_000_000;

#[contractimpl]
impl SaaSContract {
    pub fn __constructor(env: Env, admin: Address, mock_token: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::MockToken, &mock_token);

        // Alpha: Free, 10 tx/day
        env.storage().instance().set(&DataKey::Tier(PlanTier::Alpha), &TierInfo {
            daily_tx_limit: 10,
            monthly_fee: 0,
            has_nft_access: false,
        });

        // Vector: $15, 15 tx/day
        env.storage().instance().set(&DataKey::Tier(PlanTier::Vector), &TierInfo {
            daily_tx_limit: 15,
            monthly_fee: FEE_VECTOR,
            has_nft_access: true,
        });

        // Nexus: $49, 30 tx/day
        env.storage().instance().set(&DataKey::Tier(PlanTier::Nexus), &TierInfo {
            daily_tx_limit: 30,
            monthly_fee: FEE_NEXUS,
            has_nft_access: true,
        });
    }

    pub fn subscribe(env: Env, user: Address, tier: PlanTier) -> Result<(), Error> {
        user.require_auth();
        
        let token_addr: Address = env.storage().instance().get(&DataKey::MockToken).ok_or(Error::NotInitialized)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(Error::NotInitialized)?;
        let tier_info: TierInfo = env.storage().instance().get(&DataKey::Tier(tier)).unwrap();

        if tier_info.monthly_fee > 0 {
            let token_client = token::Client::new(&env, &token_addr);
            // Transfer fee from user to admin
            token_client.transfer(&user, &admin, &tier_info.monthly_fee);
        }

        let now = env.ledger().timestamp();
        let sub = UserSubscription {
            tier,
            last_billing_timestamp: now,
            next_billing_timestamp: now + MONTH_IN_SECONDS,
        };

        env.storage().persistent().set(&DataKey::UserSub(user.clone()), &sub);
        env.storage().persistent().extend_ttl(&DataKey::UserSub(user), 120 * 17280, 180 * 17280);

        Ok(())
    }

    pub fn cancel_subscription(env: Env, user: Address) -> Result<(), Error> {
        user.require_auth();

        let now = env.ledger().timestamp();
        let sub = UserSubscription {
            tier: PlanTier::Alpha,
            last_billing_timestamp: now,
            next_billing_timestamp: now,
        };

        env.storage().persistent().set(&DataKey::UserSub(user.clone()), &sub);
        env.storage().persistent().extend_ttl(&DataKey::UserSub(user), 120 * 17280, 180 * 17280);

        Ok(())
    }

    pub fn record_transaction(env: Env, user: Address) -> Result<(), Error> {
        // In a real scenario, this would be authorized by specific contracts.
        // For hackathon/demo, we allow anyone to trigger it, or rely on calling contract auth.
        // If we want to ensure only the exchange calls it, we'd add an allowed_contracts check.

        let sub: UserSubscription = env.storage().persistent()
            .get(&DataKey::UserSub(user.clone()))
            .unwrap_or(UserSubscription {
                tier: PlanTier::Alpha,
                last_billing_timestamp: 0,
                next_billing_timestamp: 0,
            });

        let tier_info: TierInfo = env.storage().instance().get(&DataKey::Tier(sub.tier)).unwrap();
        let mut usage: DailyUsage = env.storage().persistent()
            .get(&DataKey::UserUsage(user.clone()))
            .unwrap_or(DailyUsage {
                count: 0,
                first_tx_timestamp: 0,
            });

        let now = env.ledger().timestamp();

        if now >= usage.first_tx_timestamp + DAY_IN_SECONDS {
            usage.count = 1;
            usage.first_tx_timestamp = now;
        } else {
            usage.count += 1;
        }

        if usage.count > tier_info.daily_tx_limit {
            return Err(Error::DailyLimitExceeded);
        }

        env.storage().persistent().set(&DataKey::UserUsage(user.clone()), &usage);
        env.storage().persistent().extend_ttl(&DataKey::UserUsage(user), 120 * 17280, 180 * 17280);

        Ok(())
    }

    pub fn get_user_tier(env: Env, user: Address) -> PlanTier {
        let sub: UserSubscription = env.storage().persistent()
            .get(&DataKey::UserSub(user))
            .unwrap_or(UserSubscription {
                tier: PlanTier::Alpha,
                last_billing_timestamp: 0,
                next_billing_timestamp: 0,
            });
        sub.tier
    }

    pub fn check_nft_access(env: Env, user: Address) -> bool {
        let sub: UserSubscription = env.storage().persistent()
            .get(&DataKey::UserSub(user))
            .unwrap_or(UserSubscription {
                tier: PlanTier::Alpha,
                last_billing_timestamp: 0,
                next_billing_timestamp: 0,
            });
        let tier_info: TierInfo = env.storage().instance().get(&DataKey::Tier(sub.tier)).unwrap();
        tier_info.has_nft_access
    }

    pub fn get_remaining_transactions(env: Env, user: Address) -> u32 {
        let sub: UserSubscription = env.storage().persistent()
            .get(&DataKey::UserSub(user.clone()))
            .unwrap_or(UserSubscription {
                tier: PlanTier::Alpha,
                last_billing_timestamp: 0,
                next_billing_timestamp: 0,
            });
            
        let tier_info: TierInfo = env.storage().instance().get(&DataKey::Tier(sub.tier)).unwrap();
        let usage: DailyUsage = env.storage().persistent()
            .get(&DataKey::UserUsage(user))
            .unwrap_or(DailyUsage {
                count: 0,
                first_tx_timestamp: 0,
            });

        let now = env.ledger().timestamp();

        if now >= usage.first_tx_timestamp + DAY_IN_SECONDS {
            return tier_info.daily_tx_limit;
        }

        if usage.count >= tier_info.daily_tx_limit {
            return 0;
        }
        
        tier_info.daily_tx_limit - usage.count
    }
}

mod test;
