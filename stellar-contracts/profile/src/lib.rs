#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, String};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    ProfileAlreadyExists = 1,
    ProfileNotFound = 2,
    InvalidAvatarId = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserProfile {
    pub name: String,
    pub email: String,
    pub phone: String,
    pub bio: String,
    pub avatar_id: u32,
}

#[contract]
pub struct ProfileContract;

#[contractimpl]
impl ProfileContract {
    pub fn create_profile(
        env: Env,
        user: Address,
        name: String,
        email: String,
        phone: String,
        bio: String,
        avatar_id: u32,
    ) -> Result<(), Error> {
        user.require_auth();

        if avatar_id < 1 || avatar_id > 6 {
            return Err(Error::InvalidAvatarId);
        }

        if env.storage().persistent().has(&user) {
            return Err(Error::ProfileAlreadyExists);
        }

        let profile = UserProfile {
            name,
            email,
            phone,
            bio,
            avatar_id,
        };

        env.storage().persistent().set(&user, &profile);
        
        // Extend TTL
        env.storage().persistent().extend_ttl(&user, 120 * 17280, 180 * 17280);

        Ok(())
    }

    pub fn get_profile(env: Env, user: Address) -> Result<UserProfile, Error> {
        env.storage()
            .persistent()
            .get(&user)
            .ok_or(Error::ProfileNotFound)
    }

    pub fn update_profile(
        env: Env,
        user: Address,
        name: String,
        email: String,
        phone: String,
        bio: String,
        avatar_id: u32,
    ) -> Result<(), Error> {
        user.require_auth();

        if avatar_id < 1 || avatar_id > 6 {
            return Err(Error::InvalidAvatarId);
        }

        if !env.storage().persistent().has(&user) {
            return Err(Error::ProfileNotFound);
        }

        let profile = UserProfile {
            name,
            email,
            phone,
            bio,
            avatar_id,
        };

        env.storage().persistent().set(&user, &profile);
        env.storage().persistent().extend_ttl(&user, 120 * 17280, 180 * 17280);

        Ok(())
    }

    pub fn delete_profile(env: Env, user: Address) -> Result<(), Error> {
        user.require_auth();

        if !env.storage().persistent().has(&user) {
            return Err(Error::ProfileNotFound);
        }

        env.storage().persistent().remove(&user);

        Ok(())
    }
}

mod test;
