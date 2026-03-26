use anyhow::Result;
use keyring::Entry;

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
}
