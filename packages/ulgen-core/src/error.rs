use std::fmt;

/// Custom error types for ULGEN core operations
#[derive(Debug)]
pub enum UlgenError {
    /// Provider-related errors
    Provider(ProviderError),
    /// Database-related errors
    Database(DatabaseError),
    /// Vault/credential-related errors
    Vault(VaultError),
    /// SSH/terminal-related errors
    Ssh(SshError),
    /// Configuration errors
    Config(ConfigError),
    /// Network/connectivity errors
    Network(NetworkError),
}

#[derive(Debug)]
pub enum ProviderError {
    /// Authentication failed
    AuthenticationFailed { provider: String, reason: String },
    /// Invalid credentials provided
    InvalidCredentials { provider: String },
    /// Provider service unavailable
    ServiceUnavailable {
        provider: String,
        region: Option<String>,
    },
    /// Rate limiting hit
    RateLimited {
        provider: String,
        retry_after: Option<u64>,
    },
    /// Resource not found
    ResourceNotFound {
        resource_type: String,
        resource_id: String,
    },
    /// Permission denied for operation
    PermissionDenied { operation: String, resource: String },
    /// Invalid region specified
    InvalidRegion { provider: String, region: String },
    /// Provider API error
    ApiError {
        provider: String,
        code: String,
        message: String,
    },
}

#[derive(Debug)]
pub enum DatabaseError {
    /// Connection failed
    ConnectionFailed { reason: String },
    /// Migration failed
    MigrationFailed { version: String, reason: String },
    /// Query execution failed
    QueryFailed { query: String, reason: String },
    /// Transaction failed
    TransactionFailed { reason: String },
    /// Data integrity violation
    IntegrityViolation { constraint: String },
}

#[derive(Debug)]
pub enum VaultError {
    /// Keyring access failed
    KeyringFailed { reason: String },
    /// Encryption/decryption failed
    CryptographyFailed { reason: String },
    /// Secret not found
    SecretNotFound { key: String },
    /// Invalid secret format
    InvalidSecretFormat { key: String, expected: String },
    /// Vault locked or inaccessible
    VaultLocked,
}

#[derive(Debug)]
pub enum SshError {
    /// Connection failed
    ConnectionFailed {
        host: String,
        port: u16,
        reason: String,
    },
    /// Authentication failed
    AuthenticationFailed { host: String, username: String },
    /// Key generation/loading failed
    KeyError { reason: String },
    /// Command execution failed
    CommandFailed { command: String, exit_code: i32 },
    /// Terminal session error
    TerminalError { session_id: u64, reason: String },
}

#[derive(Debug)]
pub enum ConfigError {
    /// Configuration file not found
    FileNotFound { path: String },
    /// Invalid configuration format
    InvalidFormat { path: String, reason: String },
    /// Missing required configuration
    MissingRequired { key: String },
    /// Invalid configuration value
    InvalidValue {
        key: String,
        value: String,
        reason: String,
    },
}

#[derive(Debug)]
pub enum NetworkError {
    /// DNS resolution failed
    DnsResolution { host: String },
    /// Connection timeout
    Timeout { host: String, timeout_secs: u64 },
    /// TLS/SSL error
    TlsError { reason: String },
    /// HTTP error
    HttpError { status: u16, message: String },
}

impl fmt::Display for UlgenError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            UlgenError::Provider(e) => write!(f, "Provider error: {}", e),
            UlgenError::Database(e) => write!(f, "Database error: {}", e),
            UlgenError::Vault(e) => write!(f, "Vault error: {}", e),
            UlgenError::Ssh(e) => write!(f, "SSH error: {}", e),
            UlgenError::Config(e) => write!(f, "Configuration error: {}", e),
            UlgenError::Network(e) => write!(f, "Network error: {}", e),
        }
    }
}

impl fmt::Display for ProviderError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ProviderError::AuthenticationFailed { provider, reason } => {
                write!(
                    f,
                    "Authentication failed for provider '{}': {}",
                    provider, reason
                )
            }
            ProviderError::InvalidCredentials { provider } => {
                write!(
                    f,
                    "Invalid credentials provided for provider '{}'",
                    provider
                )
            }
            ProviderError::ServiceUnavailable { provider, region } => {
                if let Some(region) = region {
                    write!(
                        f,
                        "Provider '{}' service unavailable in region '{}'",
                        provider, region
                    )
                } else {
                    write!(f, "Provider '{}' service unavailable", provider)
                }
            }
            ProviderError::RateLimited {
                provider,
                retry_after,
            } => {
                if let Some(retry_after) = retry_after {
                    write!(
                        f,
                        "Rate limited by provider '{}', retry after {} seconds",
                        provider, retry_after
                    )
                } else {
                    write!(f, "Rate limited by provider '{}'", provider)
                }
            }
            ProviderError::ResourceNotFound {
                resource_type,
                resource_id,
            } => {
                write!(f, "{} '{}' not found", resource_type, resource_id)
            }
            ProviderError::PermissionDenied {
                operation,
                resource,
            } => {
                write!(
                    f,
                    "Permission denied for operation '{}' on resource '{}'",
                    operation, resource
                )
            }
            ProviderError::InvalidRegion { provider, region } => {
                write!(f, "Invalid region '{}' for provider '{}'", region, provider)
            }
            ProviderError::ApiError {
                provider,
                code,
                message,
            } => {
                write!(
                    f,
                    "API error from provider '{}' ({}): {}",
                    provider, code, message
                )
            }
        }
    }
}

impl fmt::Display for DatabaseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DatabaseError::ConnectionFailed { reason } => {
                write!(f, "Database connection failed: {}", reason)
            }
            DatabaseError::MigrationFailed { version, reason } => {
                write!(
                    f,
                    "Database migration to version '{}' failed: {}",
                    version, reason
                )
            }
            DatabaseError::QueryFailed { query, reason } => {
                write!(f, "Query '{}' failed: {}", query, reason)
            }
            DatabaseError::TransactionFailed { reason } => {
                write!(f, "Database transaction failed: {}", reason)
            }
            DatabaseError::IntegrityViolation { constraint } => {
                write!(f, "Database integrity violation: {}", constraint)
            }
        }
    }
}

impl fmt::Display for VaultError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            VaultError::KeyringFailed { reason } => {
                write!(f, "Keyring access failed: {}", reason)
            }
            VaultError::CryptographyFailed { reason } => {
                write!(f, "Cryptographic operation failed: {}", reason)
            }
            VaultError::SecretNotFound { key } => {
                write!(f, "Secret '{}' not found in vault", key)
            }
            VaultError::InvalidSecretFormat { key, expected } => {
                write!(
                    f,
                    "Secret '{}' has invalid format, expected: {}",
                    key, expected
                )
            }
            VaultError::VaultLocked => {
                write!(f, "Vault is locked or inaccessible")
            }
        }
    }
}

impl fmt::Display for SshError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SshError::ConnectionFailed { host, port, reason } => {
                write!(f, "SSH connection to {}:{} failed: {}", host, port, reason)
            }
            SshError::AuthenticationFailed { host, username } => {
                write!(f, "SSH authentication failed for {}@{}", username, host)
            }
            SshError::KeyError { reason } => {
                write!(f, "SSH key error: {}", reason)
            }
            SshError::CommandFailed { command, exit_code } => {
                write!(
                    f,
                    "SSH command '{}' failed with exit code {}",
                    command, exit_code
                )
            }
            SshError::TerminalError { session_id, reason } => {
                write!(f, "Terminal session {} error: {}", session_id, reason)
            }
        }
    }
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::FileNotFound { path } => {
                write!(f, "Configuration file not found: {}", path)
            }
            ConfigError::InvalidFormat { path, reason } => {
                write!(f, "Invalid configuration format in '{}': {}", path, reason)
            }
            ConfigError::MissingRequired { key } => {
                write!(f, "Missing required configuration: {}", key)
            }
            ConfigError::InvalidValue { key, value, reason } => {
                write!(
                    f,
                    "Invalid value '{}' for configuration '{}': {}",
                    value, key, reason
                )
            }
        }
    }
}

impl fmt::Display for NetworkError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NetworkError::DnsResolution { host } => {
                write!(f, "DNS resolution failed for host '{}'", host)
            }
            NetworkError::Timeout { host, timeout_secs } => {
                write!(
                    f,
                    "Connection timeout to '{}' after {} seconds",
                    host, timeout_secs
                )
            }
            NetworkError::TlsError { reason } => {
                write!(f, "TLS/SSL error: {}", reason)
            }
            NetworkError::HttpError { status, message } => {
                write!(f, "HTTP error {}: {}", status, message)
            }
        }
    }
}

impl std::error::Error for UlgenError {}
impl std::error::Error for ProviderError {}
impl std::error::Error for DatabaseError {}
impl std::error::Error for VaultError {}
impl std::error::Error for SshError {}
impl std::error::Error for ConfigError {}
impl std::error::Error for NetworkError {}

// Convenience type alias
pub type Result<T> = std::result::Result<T, UlgenError>;

// From implementations for error conversion
impl From<ProviderError> for UlgenError {
    fn from(error: ProviderError) -> Self {
        UlgenError::Provider(error)
    }
}

impl From<DatabaseError> for UlgenError {
    fn from(error: DatabaseError) -> Self {
        UlgenError::Database(error)
    }
}

impl From<VaultError> for UlgenError {
    fn from(error: VaultError) -> Self {
        UlgenError::Vault(error)
    }
}

impl From<SshError> for UlgenError {
    fn from(error: SshError) -> Self {
        UlgenError::Ssh(error)
    }
}

impl From<ConfigError> for UlgenError {
    fn from(error: ConfigError) -> Self {
        UlgenError::Config(error)
    }
}

impl From<NetworkError> for UlgenError {
    fn from(error: NetworkError) -> Self {
        UlgenError::Network(error)
    }
}

// Common conversions from external crates
impl From<sqlx::Error> for UlgenError {
    fn from(error: sqlx::Error) -> Self {
        UlgenError::Database(DatabaseError::QueryFailed {
            query: "unknown".to_string(),
            reason: error.to_string(),
        })
    }
}

impl From<serde_json::Error> for UlgenError {
    fn from(_error: serde_json::Error) -> Self {
        UlgenError::Vault(VaultError::InvalidSecretFormat {
            key: "unknown".to_string(),
            expected: "valid JSON".to_string(),
        })
    }
}

// Helper macros for creating errors
#[macro_export]
macro_rules! provider_error {
    (auth_failed, $provider:expr, $reason:expr) => {
        UlgenError::Provider(ProviderError::AuthenticationFailed {
            provider: $provider.to_string(),
            reason: $reason.to_string(),
        })
    };
    (invalid_credentials, $provider:expr) => {
        UlgenError::Provider(ProviderError::InvalidCredentials {
            provider: $provider.to_string(),
        })
    };
    (not_found, $resource_type:expr, $resource_id:expr) => {
        UlgenError::Provider(ProviderError::ResourceNotFound {
            resource_type: $resource_type.to_string(),
            resource_id: $resource_id.to_string(),
        })
    };
}

#[macro_export]
macro_rules! vault_error {
    (not_found, $key:expr) => {
        UlgenError::Vault(VaultError::SecretNotFound {
            key: $key.to_string(),
        })
    };
    (locked) => {
        UlgenError::Vault(VaultError::VaultLocked)
    };
}
