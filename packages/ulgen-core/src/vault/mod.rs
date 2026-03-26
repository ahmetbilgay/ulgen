use std::fs;
use std::path::PathBuf;

use anyhow::{Context, Result, anyhow};
use serde::{Serialize, de::DeserializeOwned};

#[derive(Debug, Clone)]
pub struct SecretVault;

impl SecretVault {
    fn vault_dir() -> Result<PathBuf> {
        let mut candidates = Vec::new();

        if let Some(override_dir) = std::env::var_os("ULGEN_VAULT_DIR") {
            candidates.push(PathBuf::from(override_dir));
        }

        if cfg!(target_os = "windows") {
            if let Some(appdata) = std::env::var_os("APPDATA") {
                candidates.push(PathBuf::from(appdata).join("ULGEN"));
            }
        } else if let Some(home) = std::env::var_os("HOME") {
            candidates.push(PathBuf::from(home).join(".ulgen"));
        }

        if let Ok(current_dir) = std::env::current_dir() {
            candidates.push(current_dir.join(".ulgen"));
        }

        for base in candidates {
            let dir = base.join("secrets");
            if fs::create_dir_all(&dir).is_ok() {
                return Ok(dir);
            }
        }

        Err(anyhow!("failed to create a writable ULGEN vault directory"))
    }

    fn secret_path(secret_name: &str) -> Result<PathBuf> {
        Ok(Self::vault_dir()?.join(format!("{secret_name}.json")))
    }

    pub fn store(secret_name: &str, secret_value: &str) -> Result<()> {
        let path = Self::secret_path(secret_name)?;
        fs::write(&path, secret_value)
            .with_context(|| format!("failed to store secret at {}", path.display()))?;
        Ok(())
    }

    pub fn load(secret_name: &str) -> Result<String> {
        let path = Self::secret_path(secret_name)?;
        fs::read_to_string(&path)
            .with_context(|| format!("failed to load secret from {}", path.display()))
    }

    pub fn delete(secret_name: &str) -> Result<()> {
        let path = Self::secret_path(secret_name)?;
        if path.exists() {
            fs::remove_file(&path)
                .with_context(|| format!("failed to delete secret at {}", path.display()))?;
        }
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

#[cfg(test)]
mod tests {
    use super::SecretVault;
    use anyhow::Result;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn stores_and_loads_plain_text_secret() -> Result<()> {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_nanos()
            .to_string();
        let test_dir = std::env::temp_dir().join(format!("ulgen-vault-{unique}"));
        unsafe {
            std::env::set_var("ULGEN_VAULT_DIR", &test_dir);
        }

        SecretVault::store("vault-test", "hello")?;
        let loaded = SecretVault::load("vault-test")?;
        SecretVault::delete("vault-test")?;
        let _ = std::fs::remove_dir_all(&test_dir);

        assert_eq!(loaded, "hello");
        Ok(())
    }
}
