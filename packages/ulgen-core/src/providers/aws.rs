use std::collections::BTreeSet;
use std::net::IpAddr;
use std::str::FromStr;
use std::sync::Arc;

use anyhow::{Context, Result, anyhow};
use async_trait::async_trait;
use aws_config::BehaviorVersion;
use aws_config::meta::region::RegionProviderChain;
use aws_credential_types::Credentials;
use aws_credential_types::provider::SharedCredentialsProvider;
use aws_sdk_ec2::Client;
use aws_sdk_ec2::config::Region;
use aws_sdk_ec2::types::{
    Filter, InstanceStateName, IpPermission, IpRange, ResourceType, TagSpecification,
};
use chrono::{TimeZone, Utc};
use tokio::task::JoinSet;
use ulgen_api_proto::{DiscoveryResult, InstanceSummary};

use crate::{CloudProvider, SecurityGroupRule};

#[derive(Debug, Clone)]
pub struct AwsProvider {
    default_region: String,
    credentials: Option<SharedCredentialsProvider>,
}

impl AwsProvider {
    pub fn new(default_region: impl Into<String>) -> Self {
        Self {
            default_region: default_region.into(),
            credentials: None,
        }
    }

    pub fn with_credentials(
        default_region: impl Into<String>,
        access_key_id: impl Into<String>,
        secret_access_key: impl Into<String>,
        session_token: Option<String>,
    ) -> Self {
        let credentials = Credentials::new(
            access_key_id,
            secret_access_key,
            session_token,
            None,
            "ulgen-local-keyring",
        );

        Self {
            default_region: default_region.into(),
            credentials: Some(SharedCredentialsProvider::new(credentials)),
        }
    }

    async fn client_for_region(&self, region: &str) -> Result<Client> {
        let region_provider = RegionProviderChain::first_try(Some(Region::new(region.to_owned())))
            .or_default_provider()
            .or_else(Region::new(self.default_region.clone()));

        let mut loader = aws_config::defaults(BehaviorVersion::latest()).region(region_provider);
        if let Some(credentials) = &self.credentials {
            loader = loader.credentials_provider(credentials.clone());
        }

        let config = loader.load().await;

        Ok(Client::new(&config))
    }

    pub async fn list_regions(&self) -> Result<Vec<String>> {
        let client = self.client_for_region(&self.default_region).await?;
        let response = client.describe_regions().all_regions(true).send().await?;

        let mut regions = response
            .regions
            .unwrap_or_default()
            .into_iter()
            .filter_map(|region| region.region_name)
            .collect::<Vec<_>>();

        if regions.is_empty() {
            regions.push(self.default_region.clone());
        }

        regions.sort();
        regions.dedup();

        Ok(regions)
    }

    async fn fetch_instances_in_region(&self, region: String) -> Result<Vec<InstanceSummary>> {
        let client = self.client_for_region(&region).await?;
        let response = client.describe_instances().send().await?;
        let mut instances = Vec::new();

        for reservation in response.reservations.unwrap_or_default() {
            for instance in reservation.instances.unwrap_or_default() {
                let name = instance
                    .tags
                    .as_ref()
                    .and_then(|tags| {
                        tags.iter()
                            .find(|tag| tag.key.as_deref() == Some("Name"))
                            .and_then(|tag| tag.value.clone())
                    })
                    .unwrap_or_else(|| {
                        instance
                            .instance_id
                            .clone()
                            .unwrap_or_else(|| "unnamed".to_owned())
                    });

                instances.push(InstanceSummary {
                    id: instance.instance_id.unwrap_or_else(|| "unknown".to_owned()),
                    name,
                    region: region.clone(),
                    state: instance
                        .state
                        .and_then(|state| state.name)
                        .map(|state| state.as_str().to_owned())
                        .unwrap_or_else(|| "unknown".to_owned()),
                    public_ip: instance.public_ip_address,
                    private_ip: instance.private_ip_address,
                    instance_type: instance.instance_type.map(|kind| kind.as_str().to_owned()),
                    launched_at: instance.launch_time.and_then(|time| {
                        time.to_millis()
                            .ok()
                            .and_then(|millis| Utc.timestamp_millis_opt(millis).single())
                    }),
                });
            }
        }

        Ok(instances)
    }
}

fn normalize_cidr(cidr: &str) -> String {
    IpAddr::from_str(cidr)
        .map(|parsed| format!("{parsed}/32"))
        .unwrap_or_else(|_| cidr.to_owned())
}

impl Default for AwsProvider {
    fn default() -> Self {
        Self::new("us-east-1")
    }
}

#[derive(Debug, Clone)]
pub struct DiscoveryEngine {
    provider: Arc<AwsProvider>,
}

impl DiscoveryEngine {
    pub fn new(provider: Arc<AwsProvider>) -> Self {
        Self { provider }
    }

    pub async fn discover_instances(&self) -> Result<DiscoveryResult> {
        let regions = self.provider.list_regions().await?;
        let mut tasks = JoinSet::new();

        for region in &regions {
            let provider = Arc::clone(&self.provider);
            let region = region.clone();
            tasks.spawn(async move {
                provider
                    .fetch_instances_in_region(region.clone())
                    .await
                    .map(|items| (region, items))
            });
        }

        let mut discovered_regions = BTreeSet::new();
        let mut instances = Vec::new();

        while let Some(joined) = tasks.join_next().await {
            let (region, mut region_instances) = joined??;
            discovered_regions.insert(region);
            instances.append(&mut region_instances);
        }

        instances.sort_by(|left, right| {
            left.region
                .cmp(&right.region)
                .then(left.name.cmp(&right.name))
        });

        Ok(DiscoveryResult {
            provider: "aws".to_owned(),
            regions_scanned: discovered_regions.into_iter().collect(),
            instances,
            generated_at: Utc::now(),
        })
    }
}

#[async_trait]
impl CloudProvider for AwsProvider {
    fn name(&self) -> &'static str {
        "aws"
    }

    async fn fetch_instances(&self) -> Result<DiscoveryResult> {
        DiscoveryEngine::new(Arc::new(self.clone()))
            .discover_instances()
            .await
    }

    async fn start_instance(&self, region: &str, instance_id: &str) -> Result<()> {
        self.client_for_region(region)
            .await?
            .start_instances()
            .instance_ids(instance_id)
            .send()
            .await
            .with_context(|| format!("failed to start instance {instance_id} in {region}"))?;

        Ok(())
    }

    async fn stop_instance(&self, region: &str, instance_id: &str) -> Result<()> {
        self.client_for_region(region)
            .await?
            .stop_instances()
            .instance_ids(instance_id)
            .send()
            .await
            .with_context(|| format!("failed to stop instance {instance_id} in {region}"))?;

        Ok(())
    }

    async fn authorize_ip(
        &self,
        region: &str,
        security_group_id: &str,
        rule: SecurityGroupRule,
    ) -> Result<()> {
        let ip = normalize_cidr(&rule.cidr);

        let protocol = rule.protocol.to_lowercase();
        let permission = IpPermission::builder()
            .ip_protocol(protocol)
            .from_port(rule.from_port)
            .to_port(rule.to_port)
            .ip_ranges(
                IpRange::builder()
                    .cidr_ip(ip)
                    .description(
                        rule.description
                            .unwrap_or_else(|| "ULGEN managed rule".to_owned()),
                    )
                    .build(),
            )
            .build();

        self.client_for_region(region)
            .await?
            .authorize_security_group_ingress()
            .group_id(security_group_id)
            .ip_permissions(permission)
            .send()
            .await
            .with_context(|| {
                format!("failed to authorize ingress for security group {security_group_id}")
            })?;

        Ok(())
    }

    async fn create_ssh_key(&self, region: &str, key_name: &str) -> Result<String> {
        let client = self.client_for_region(region).await?;
        let response = client
            .create_key_pair()
            .key_name(key_name)
            .tag_specifications(
                TagSpecification::builder()
                    .resource_type(ResourceType::KeyPair)
                    .tags(
                        aws_sdk_ec2::types::Tag::builder()
                            .key("ManagedBy")
                            .value("ULGEN")
                            .build(),
                    )
                    .build(),
            )
            .send()
            .await
            .with_context(|| format!("failed to create SSH key {key_name}"))?;

        response
            .key_material
            .ok_or_else(|| anyhow!("AWS did not return key material for {key_name}"))
    }

    async fn delete_ssh_key(&self, region: &str, key_name: &str) -> Result<()> {
        self.client_for_region(region)
            .await?
            .delete_key_pair()
            .key_name(key_name)
            .send()
            .await
            .with_context(|| format!("failed to delete SSH key {key_name}"))?;

        Ok(())
    }
}

pub fn default_running_filter() -> Filter {
    Filter::builder()
        .name("instance-state-name")
        .values(InstanceStateName::Running.as_str())
        .build()
}

#[cfg(test)]
mod tests {
    use super::{AwsProvider, normalize_cidr};

    #[test]
    fn normalizes_single_ip_to_cidr() {
        assert_eq!(normalize_cidr("203.0.113.10"), "203.0.113.10/32");
    }

    #[test]
    fn preserves_existing_cidr() {
        assert_eq!(normalize_cidr("203.0.113.0/24"), "203.0.113.0/24");
    }

    #[test]
    fn builds_provider_with_static_credentials() {
        let provider = AwsProvider::with_credentials(
            "eu-central-1",
            "AKIAEXAMPLE",
            "secret",
            Some("session".to_owned()),
        );

        assert_eq!(provider.default_region, "eu-central-1");
        assert!(provider.credentials.is_some());
    }
}
