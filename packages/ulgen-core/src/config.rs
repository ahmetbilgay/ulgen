use crate::error::{ConfigError, UlgenError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// Main configuration for ULGEN
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UlgenConfig {
    /// Application settings
    pub app: AppConfig,
    /// Provider configurations
    pub providers: ProvidersConfig,
    /// Database configuration
    pub database: DatabaseConfig,
    /// Vault/security configuration
    pub vault: VaultConfig,
    /// SSH configuration
    pub ssh: SshConfig,
    /// Logging configuration
    pub logging: LoggingConfigData,
    /// UI preferences
    pub ui: UiConfig,
}

/// Application-level configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Application name
    pub name: String,
    /// Version
    pub version: String,
    /// Data directory path
    pub data_dir: PathBuf,
    /// Cache directory path
    pub cache_dir: PathBuf,
    /// Enable telemetry collection
    pub telemetry_enabled: bool,
    /// Auto-update check interval in hours
    pub update_check_interval: u64,
    /// Development mode flag
    pub dev_mode: bool,
}

/// Provider configurations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProvidersConfig {
    /// AWS provider configuration
    pub aws: AwsProviderConfig,
    /// Future provider configurations
    pub azure: Option<AzureProviderConfig>,
    pub gcp: Option<GcpProviderConfig>,
}

/// AWS-specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwsProviderConfig {
    /// Default region
    pub default_region: String,
    /// Regions to scan (empty = all available)
    pub scan_regions: Vec<String>,
    /// Request timeout in seconds
    pub timeout_seconds: u64,
    /// Max concurrent region scans
    pub max_concurrent_scans: usize,
    /// Enable instance metadata caching
    pub cache_metadata: bool,
    /// Cache TTL in seconds
    pub cache_ttl_seconds: u64,
    /// Profile name for AWS CLI integration
    pub profile: Option<String>,
    /// Custom endpoint URL (for testing)
    pub endpoint_url: Option<String>,
}

/// Azure provider configuration (placeholder for future)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AzureProviderConfig {
    pub subscription_id: String,
    pub default_region: String,
    pub timeout_seconds: u64,
}

/// GCP provider configuration (placeholder for future)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GcpProviderConfig {
    pub project_id: String,
    pub default_zone: String,
    pub timeout_seconds: u64,
}

/// Database configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    /// Database URL/connection string
    pub url: String,
    /// Max connections in pool
    pub max_connections: u32,
    /// Connection timeout in seconds
    pub connect_timeout_seconds: u64,
    /// Enable query logging
    pub log_queries: bool,
    /// Auto-migration on startup
    pub auto_migrate: bool,
}

/// Vault configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultConfig {
    /// Keyring service name
    pub service_name: String,
    /// Enable encryption for stored secrets
    pub encrypt_secrets: bool,
    /// Key derivation iterations
    pub key_iterations: u32,
    /// Backup encrypted secrets to file
    pub backup_enabled: bool,
    /// Backup file path
    pub backup_path: Option<PathBuf>,
}

/// SSH configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshConfig {
    /// Default SSH username
    pub default_username: String,
    /// SSH key directory
    pub key_directory: PathBuf,
    /// Connection timeout in seconds
    pub connect_timeout_seconds: u64,
    /// Keep-alive interval in seconds
    pub keepalive_interval: u64,
    /// Max connection attempts
    pub max_attempts: u32,
    /// Known hosts file path
    pub known_hosts_file: Option<PathBuf>,
    /// Strict host key checking
    pub strict_host_key_checking: bool,
}

/// Logging configuration data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfigData {
    /// Log level (trace, debug, info, warn, error)
    pub level: String,
    /// Output format (text, json)
    pub format: String,
    /// Log file path (None = stdout only)
    pub file_path: Option<PathBuf>,
    /// Max log file size in MB
    pub max_file_size_mb: u64,
    /// Number of rotated files to keep
    pub max_files: u32,
    /// Include source file locations
    pub with_source: bool,
    /// Include thread names
    pub with_threads: bool,
    /// Module-specific log levels
    pub module_levels: HashMap<String, String>,
}

/// UI configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiConfig {
    /// Theme (light, dark, system)
    pub theme: String,
    /// Window width
    pub window_width: u32,
    /// Window height
    pub window_height: u32,
    /// Window position X
    pub window_x: Option<i32>,
    /// Window position Y
    pub window_y: Option<i32>,
    /// Sidebar width
    pub sidebar_width: u32,
    /// Inspector panel width
    pub inspector_width: u32,
    /// Terminal panel height
    pub terminal_height: u32,
    /// Auto-refresh interval in seconds
    pub refresh_interval: u64,
    /// Show system tray icon
    pub system_tray: bool,
    /// Minimize to tray
    pub minimize_to_tray: bool,
}

impl Default for UlgenConfig {
    fn default() -> Self {
        Self {
            app: AppConfig::default(),
            providers: ProvidersConfig::default(),
            database: DatabaseConfig::default(),
            vault: VaultConfig::default(),
            ssh: SshConfig::default(),
            logging: LoggingConfigData::default(),
            ui: UiConfig::default(),
        }
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        let data_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("ulgen");

        let cache_dir = dirs::cache_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("ulgen");

        Self {
            name: "ULGEN".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            data_dir,
            cache_dir,
            telemetry_enabled: false,
            update_check_interval: 24, // hours
            dev_mode: cfg!(debug_assertions),
        }
    }
}

impl Default for ProvidersConfig {
    fn default() -> Self {
        Self {
            aws: AwsProviderConfig::default(),
            azure: None,
            gcp: None,
        }
    }
}

impl Default for AwsProviderConfig {
    fn default() -> Self {
        Self {
            default_region: "us-east-1".to_string(),
            scan_regions: Vec::new(), // Empty = scan all
            timeout_seconds: 30,
            max_concurrent_scans: 5,
            cache_metadata: true,
            cache_ttl_seconds: 300, // 5 minutes
            profile: None,
            endpoint_url: None,
        }
    }
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        let data_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("ulgen");

        Self {
            url: format!("sqlite://{}/ulgen.db", data_dir.display()),
            max_connections: 10,
            connect_timeout_seconds: 30,
            log_queries: cfg!(debug_assertions),
            auto_migrate: true,
        }
    }
}

impl Default for VaultConfig {
    fn default() -> Self {
        let backup_path = dirs::data_dir().map(|dir| dir.join("ulgen").join("secrets.backup"));

        Self {
            service_name: "ULGEN".to_string(),
            encrypt_secrets: true,
            key_iterations: 100_000,
            backup_enabled: true,
            backup_path,
        }
    }
}

impl Default for SshConfig {
    fn default() -> Self {
        let key_directory = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".ssh");

        let known_hosts_file = Some(key_directory.join("known_hosts"));

        Self {
            default_username: whoami::username(),
            key_directory,
            connect_timeout_seconds: 30,
            keepalive_interval: 60,
            max_attempts: 3,
            known_hosts_file,
            strict_host_key_checking: false,
        }
    }
}

impl Default for LoggingConfigData {
    fn default() -> Self {
        Self {
            level: if cfg!(debug_assertions) {
                "debug"
            } else {
                "info"
            }
            .to_string(),
            format: "text".to_string(),
            file_path: None,
            max_file_size_mb: 10,
            max_files: 5,
            with_source: cfg!(debug_assertions),
            with_threads: false,
            module_levels: HashMap::new(),
        }
    }
}

impl Default for UiConfig {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            window_width: 1200,
            window_height: 800,
            window_x: None,
            window_y: None,
            sidebar_width: 250,
            inspector_width: 300,
            terminal_height: 200,
            refresh_interval: 30,
            system_tray: true,
            minimize_to_tray: false,
        }
    }
}

/// Configuration manager for loading, saving, and validating config
pub struct ConfigManager {
    config_path: PathBuf,
}

impl ConfigManager {
    /// Create a new configuration manager
    pub fn new<P: AsRef<Path>>(config_path: P) -> Self {
        Self {
            config_path: config_path.as_ref().to_path_buf(),
        }
    }

    /// Get default configuration file path
    pub fn default_path() -> Result<PathBuf, UlgenError> {
        let config_dir = dirs::config_dir().ok_or_else(|| {
            UlgenError::Config(ConfigError::FileNotFound {
                path: "config directory not found".to_string(),
            })
        })?;

        Ok(config_dir.join("ulgen").join("config.toml"))
    }

    /// Load configuration from file, creating default if not exists
    pub fn load(&self) -> Result<UlgenConfig, UlgenError> {
        if !self.config_path.exists() {
            let default_config = UlgenConfig::default();
            self.save(&default_config)?;
            return Ok(default_config);
        }

        let content = fs::read_to_string(&self.config_path).map_err(|_e| {
            UlgenError::Config(ConfigError::FileNotFound {
                path: self.config_path.display().to_string(),
            })
        })?;

        toml::from_str(&content).map_err(|e| {
            UlgenError::Config(ConfigError::InvalidFormat {
                path: self.config_path.display().to_string(),
                reason: e.to_string(),
            })
        })
    }

    /// Save configuration to file
    pub fn save(&self, config: &UlgenConfig) -> Result<(), UlgenError> {
        // Ensure parent directory exists
        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent).map_err(|_e| {
                UlgenError::Config(ConfigError::FileNotFound {
                    path: parent.display().to_string(),
                })
            })?;
        }

        let content = toml::to_string_pretty(config).map_err(|e| {
            UlgenError::Config(ConfigError::InvalidFormat {
                path: self.config_path.display().to_string(),
                reason: e.to_string(),
            })
        })?;

        fs::write(&self.config_path, content).map_err(|_e| {
            UlgenError::Config(ConfigError::FileNotFound {
                path: self.config_path.display().to_string(),
            })
        })
    }

    /// Validate configuration
    pub fn validate(&self, config: &UlgenConfig) -> Result<(), UlgenError> {
        // Validate data directories exist or can be created
        for dir in [&config.app.data_dir, &config.app.cache_dir] {
            if !dir.exists() {
                fs::create_dir_all(dir).map_err(|e| {
                    UlgenError::Config(ConfigError::InvalidValue {
                        key: "data_dir".to_string(),
                        value: dir.display().to_string(),
                        reason: format!("Cannot create directory: {}", e),
                    })
                })?;
            }
        }

        // Validate AWS region
        if config.providers.aws.default_region.is_empty() {
            return Err(UlgenError::Config(ConfigError::MissingRequired {
                key: "providers.aws.default_region".to_string(),
            }));
        }

        // Validate database URL
        if config.database.url.is_empty() {
            return Err(UlgenError::Config(ConfigError::MissingRequired {
                key: "database.url".to_string(),
            }));
        }

        // Validate SSH key directory
        if !config.ssh.key_directory.exists() {
            fs::create_dir_all(&config.ssh.key_directory).map_err(|e| {
                UlgenError::Config(ConfigError::InvalidValue {
                    key: "ssh.key_directory".to_string(),
                    value: config.ssh.key_directory.display().to_string(),
                    reason: format!("Cannot create directory: {}", e),
                })
            })?;
        }

        // Validate log level
        let valid_levels = ["trace", "debug", "info", "warn", "error"];
        if !valid_levels.contains(&config.logging.level.as_str()) {
            return Err(UlgenError::Config(ConfigError::InvalidValue {
                key: "logging.level".to_string(),
                value: config.logging.level.clone(),
                reason: format!("Must be one of: {}", valid_levels.join(", ")),
            }));
        }

        // Validate theme
        let valid_themes = ["light", "dark", "system"];
        if !valid_themes.contains(&config.ui.theme.as_str()) {
            return Err(UlgenError::Config(ConfigError::InvalidValue {
                key: "ui.theme".to_string(),
                value: config.ui.theme.clone(),
                reason: format!("Must be one of: {}", valid_themes.join(", ")),
            }));
        }

        Ok(())
    }

    /// Get configuration file path
    pub fn path(&self) -> &Path {
        &self.config_path
    }
}

use std::sync::{Mutex, OnceLock};

/// Global configuration instance
static GLOBAL_CONFIG: OnceLock<Mutex<UlgenConfig>> = OnceLock::new();

/// Initialize global configuration
pub fn init_config() -> Result<(), UlgenError> {
    let manager = ConfigManager::new(ConfigManager::default_path()?);

    let config = manager.load()?;
    manager.validate(&config)?;

    GLOBAL_CONFIG.set(Mutex::new(config)).map_err(|_| {
        UlgenError::Config(ConfigError::InvalidFormat {
            path: "global_config".to_string(),
            reason: "Configuration already initialized".to_string(),
        })
    })?;

    Ok(())
}

/// Get global configuration (must call init_config first)
pub fn get_config() -> UlgenConfig {
    GLOBAL_CONFIG
        .get()
        .expect("Configuration not initialized. Call init_config() first.")
        .lock()
        .unwrap()
        .clone()
}

/// Update global configuration
pub fn update_config<F>(f: F) -> Result<(), UlgenError>
where
    F: FnOnce(&mut UlgenConfig),
{
    let manager = ConfigManager::new(ConfigManager::default_path()?);

    let mut config = manager.load()?;
    f(&mut config);
    manager.validate(&config)?;
    manager.save(&config)?;

    if let Some(global_config) = GLOBAL_CONFIG.get() {
        *global_config.lock().unwrap() = config;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = UlgenConfig::default();
        assert_eq!(config.app.name, "ULGEN");
        assert_eq!(config.providers.aws.default_region, "us-east-1");
        assert!(!config.ssh.strict_host_key_checking);
    }

    #[test]
    fn test_config_serialization() {
        let config = UlgenConfig::default();
        let toml_str = toml::to_string(&config).unwrap();
        let deserialized: UlgenConfig = toml::from_str(&toml_str).unwrap();

        assert_eq!(config.app.name, deserialized.app.name);
        assert_eq!(
            config.providers.aws.default_region,
            deserialized.providers.aws.default_region
        );
    }
}
