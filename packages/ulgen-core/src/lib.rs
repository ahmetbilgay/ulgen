pub mod db;
pub mod providers;
pub mod ssh;
pub mod vault;

use anyhow::Result;
use async_trait::async_trait;
use ulgen_api_proto::DiscoveryResult;

pub use providers::aws::{AwsProvider, DiscoveryEngine};

#[derive(Debug, Clone)]
pub struct SecurityGroupRule {
    pub cidr: String,
    pub protocol: String,
    pub from_port: i32,
    pub to_port: i32,
    pub description: Option<String>,
}

#[async_trait]
pub trait CloudProvider: Send + Sync {
    fn name(&self) -> &'static str;

    async fn fetch_instances(&self) -> Result<DiscoveryResult>;
    async fn start_instance(&self, region: &str, instance_id: &str) -> Result<()>;
    async fn stop_instance(&self, region: &str, instance_id: &str) -> Result<()>;
    async fn authorize_ip(
        &self,
        region: &str,
        security_group_id: &str,
        rule: SecurityGroupRule,
    ) -> Result<()>;
    async fn create_ssh_key(&self, region: &str, key_name: &str) -> Result<String>;
    async fn delete_ssh_key(&self, region: &str, key_name: &str) -> Result<()>;
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
