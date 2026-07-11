#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String, Address};

#[contracttype]
pub struct FeedbackEntry {
    pub user: Address,
    pub name: String,
    pub email: String,
    pub designation: String,
    pub company: String,
    pub thoughts: String,
    pub rating: u32,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    FeedbackCount,
    Feedback(u32), // id to FeedbackEntry
}

#[contract]
pub struct FeedbackContract;

#[contractimpl]
impl FeedbackContract {
    pub fn save_feedback(
        env: Env,
        user: Address,
        name: String,
        email: String,
        designation: String,
        company: String,
        thoughts: String,
        rating: u32,
    ) -> u32 {
        user.require_auth();

        let mut count: u32 = env.storage().instance().get(&DataKey::FeedbackCount).unwrap_or(0);
        
        let entry = FeedbackEntry {
            user,
            name,
            email,
            designation,
            company,
            thoughts,
            rating,
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Feedback(count), &entry);
        count += 1;
        env.storage().instance().set(&DataKey::FeedbackCount, &count);

        count - 1
    }

    pub fn get_feedback_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::FeedbackCount).unwrap_or(0)
    }

    pub fn get_feedback(env: Env, id: u32) -> FeedbackEntry {
        env.storage().persistent().get(&DataKey::Feedback(id)).unwrap()
    }
}
