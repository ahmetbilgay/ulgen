pub mod config;
pub mod db;
pub mod error;
pub mod logging;
pub mod providers;
pub mod ssh;
pub mod vault;

// Re-export main types for convenience
pub use config::{ConfigManager, UlgenConfig};
pub use error::{
    ConfigError, DatabaseError, NetworkError, ProviderError, SshError, UlgenError, VaultError,
};
pub use logging::{LoggingConfig, init as init_logging, init_dev as init_logging_dev, init_prod};

use async_trait::async_trait;
use error::Result;
use ulgen_api_proto::{DiscoveryResult, ResourceMetrics, SecurityGroupSummary};

pub use providers::aws::{AwsProvider, DiscoveryEngine};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityGroupRule {
    pub cidr: String,
    pub protocol: String,
    pub from_port: i32,
    pub to_port: i32,
    pub description: Option<String>,
}

// (Removed redundant local definitions, using ulgen_api_proto equivalents)

#[async_trait]
pub trait CloudProvider: Send + Sync {
    fn name(&self) -> &'static str;

    async fn fetch_instances(&self, region: Option<String>) -> Result<DiscoveryResult>;
    async fn start_instance(&self, region: &str, instance_id: &str) -> Result<()>;
    async fn stop_instance(&self, region: &str, instance_id: &str) -> Result<()>;
    async fn reboot_instance(&self, region: &str, instance_id: &str) -> Result<()>;

    async fn fetch_security_groups(
        &self,
        region: &str,
        instance_id: &str,
    ) -> Result<Vec<SecurityGroupSummary>>;

    async fn authorize_ip(
        &self,
        region: &str,
        security_group_id: &str,
        rule: SecurityGroupRule,
    ) -> Result<()>;

    async fn fetch_metrics(&self, region: &str, instance_id: &str) -> Result<ResourceMetrics>;

    async fn create_ssh_key(&self, region: &str, key_name: &str) -> Result<String>;
    async fn delete_ssh_key(&self, region: &str, key_name: &str) -> Result<()>;
}

/// Initialize ULGEN core with configuration and logging
pub async fn init() -> Result<UlgenConfig> {
    // Initialize configuration first
    config::init_config()?;
    let config = config::get_config();

    // Initialize logging based on config
    let log_config = LoggingConfig::new()
        .level(config.logging.level.parse().unwrap_or(tracing::Level::INFO))
        .json_format(config.logging.format == "json")
        .with_file(config.logging.with_source)
        .with_thread_names(config.logging.with_threads);

    log_config.init().map_err(|e| {
        UlgenError::Config(ConfigError::InvalidFormat {
            path: "logging".to_string(),
            reason: e.to_string(),
        })
    })?;

    tracing::info!("ULGEN core initialized successfully");
    Ok(config)
}

/// Initialize ULGEN core for development
pub async fn init_dev() -> Result<UlgenConfig> {
    let _ = init_logging_dev();
    config::init_config()?;
    let config = config::get_config();
    tracing::info!("ULGEN core initialized in development mode");
    Ok(config)
}

pub fn default_provider_registry() -> Vec<Box<dyn CloudProvider>> {
    vec![Box::new(AwsProvider::default())]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn registry_contains_aws_provider() {
        let providers = default_provider_registry();
        let names = providers
            .into_iter()
            .map(|provider| provider.name())
            .collect::<Vec<_>>();

        assert_eq!(names, vec!["aws"]);
    }
}
