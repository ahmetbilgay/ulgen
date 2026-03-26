use anyhow::Result;
use keyring::Entry;
use serde::{Serialize, de::DeserializeOwned};

const SERVICE: &str = "io.ulgen.desktop";

#[derive(Debug, Clone)]
pub struct SecretVault;

impl SecretVault {
    pub fn store(secret_name: &str, secret_value: &str) -> Result<()> {
        Entry::new(SERVICE, secret_name)?.set_password(secret_value)?;
        Ok(())
    }

    pub fn load(secret_name: &str) -> Result<String> {
        Ok(Entry::new(SERVICE, secret_name)?.get_password()?)
    }

    pub fn delete(secret_name: &str) -> Result<()> {
        Entry::new(SERVICE, secret_name)?.delete_credential()?;
        Ok(())
    }

    pub fn store_json<T: Serialize>(secret_name: &str, value: &T) -> Result<()> {
        let serialized = serde_json::to_string(value)?;
        Self::store(secret_name, &serialized)
    }

    pub fn load_json<T: DeserializeOwned>(secret_name: &str) -> Result<T> {
        let serialized = Self::load(secret_name)?;
        Ok(serde_json::from_str(&serialized)?)
    }
}
