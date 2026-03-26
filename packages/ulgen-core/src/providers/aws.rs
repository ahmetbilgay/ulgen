use std::collections::BTreeSet;
use std::net::IpAddr;
use std::str::FromStr;
use std::sync::Arc;

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
use tracing::{debug, error, info, instrument, warn};
use ulgen_api_proto::{
    DiscoveryResult, FirewallDirection, InstanceSummary, ResourceMetrics, SecurityGroupSummary,
    UnifiedFirewallRule,
};

use crate::error::{ProviderError, Result};
use crate::{CloudProvider, SecurityGroupRule};
use crate::{log_provider_operation, time_operation};

#[derive(Debug, Clone)]
pub struct AwsProvider {
    default_region: String,
    credentials: Option<SharedCredentialsProvider>,
}

impl AwsProvider {
    pub fn new(default_region: impl Into<String>) -> Self {
        let default_region = default_region.into();
        info!(provider = "aws", region = %default_region, "Creating AWS provider");

        Self {
            default_region,
            credentials: None,
        }
    }

    pub fn with_credentials(
        default_region: impl Into<String>,
        access_key_id: impl Into<String>,
        secret_access_key: impl Into<String>,
        session_token: Option<String>,
    ) -> Self {
        let default_region = default_region.into();
        let access_key_id = access_key_id.into();

        debug!(
            provider = "aws",
            region = %default_region,
            access_key_preview = %format!("{}****{}",
                &access_key_id[..4.min(access_key_id.len())],
                &access_key_id[access_key_id.len().saturating_sub(4)..]
            ),
            has_session_token = session_token.is_some(),
            "Creating AWS provider with credentials"
        );

        let credentials = Credentials::new(
            access_key_id,
            secret_access_key,
            session_token,
            None,
            "ulgen-local-keyring",
        );

        Self {
            default_region,
            credentials: Some(SharedCredentialsProvider::new(credentials)),
        }
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region))]
    async fn client_for_region(&self, region: &str) -> Result<Client> {
        debug!("Creating AWS client for region");

        let region_provider = RegionProviderChain::first_try(Some(Region::new(region.to_owned())))
            .or_default_provider()
            .or_else(Region::new(self.default_region.clone()));

        let mut loader = aws_config::defaults(BehaviorVersion::latest()).region(region_provider);
        if let Some(credentials) = &self.credentials {
            loader = loader.credentials_provider(credentials.clone());
        }

        let config = loader.load().await;
        let client = Client::new(&config);

        debug!("AWS client created successfully");
        Ok(client)
    }

    #[instrument(skip(self), fields(provider = "aws"))]
    pub async fn list_regions(&self) -> Result<Vec<String>> {
        debug!("Listing AWS regions");

        let client = self
            .client_for_region(&self.default_region)
            .await
            .map_err(|_e| ProviderError::ServiceUnavailable {
                provider: "aws".to_string(),
                region: Some(self.default_region.clone()),
            })?;

        let response = client.describe_regions().send().await.map_err(|e| {
            error!(error = %e, "Failed to describe regions");
            ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "DescribeRegions".to_string(),
                message: e.to_string(),
            }
        })?;

        let mut regions = response
            .regions
            .unwrap_or_default()
            .into_iter()
            .filter_map(|region| region.region_name)
            .collect::<Vec<_>>();

        if regions.is_empty() {
            warn!("No regions returned from AWS API, using default region");
            regions.push(self.default_region.clone());
        }

        regions.sort();
        regions.dedup();

        info!(
            region_count = regions.len(),
            "Successfully listed AWS regions"
        );
        Ok(regions)
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region))]
    async fn fetch_instances_in_region(&self, region: String) -> Result<Vec<InstanceSummary>> {
        debug!("Fetching instances in region");

        let client = self.client_for_region(&region).await.map_err(|_e| {
            ProviderError::ServiceUnavailable {
                provider: "aws".to_string(),
                region: Some(region.clone()),
            }
        })?;

        let response = client.describe_instances().send().await.map_err(|e| {
            error!(error = %e, "Failed to describe instances");
            ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "DescribeInstances".to_string(),
                message: e.to_string(),
            }
        })?;

        let mut instances = Vec::new();

        for reservation in response.reservations.unwrap_or_default() {
            for instance in reservation.instances.unwrap_or_default() {
                let instance_id = instance.instance_id.unwrap_or_else(|| "unknown".to_owned());

                let name = instance
                    .tags
                    .as_ref()
                    .and_then(|tags| {
                        tags.iter()
                            .find(|tag| tag.key.as_deref() == Some("Name"))
                            .and_then(|tag| tag.value.clone())
                    })
                    .unwrap_or_else(|| instance_id.clone());

                let state = instance
                    .state
                    .and_then(|state| state.name)
                    .map(|state| state.as_str().to_owned())
                    .unwrap_or_else(|| "unknown".to_owned());

                debug!(
                    instance_id = %instance_id,
                    instance_name = %name,
                    instance_state = %state,
                    "Found instance"
                );

                instances.push(InstanceSummary {
                    id: instance_id,
                    name,
                    region: region.clone(),
                    state,
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

        info!(
            instance_count = instances.len(),
            "Successfully fetched instances"
        );
        Ok(instances)
    }
}

fn normalize_cidr(cidr: &str) -> String {
    IpAddr::from_str(cidr)
        .map(|parsed| format!("{parsed}/32"))
        .unwrap_or_else(|_| cidr.to_owned())
}

fn map_ip_permission(
    permission: &IpPermission,
    direction: FirewallDirection,
) -> Vec<UnifiedFirewallRule> {
    let protocol = permission
        .ip_protocol
        .clone()
        .unwrap_or_else(|| "all".to_string());
    let from_port = permission.from_port;
    let to_port = permission.to_port;

    let port_range = match (from_port, to_port) {
        (Some(f), Some(t)) if f == t => f.to_string(),
        (Some(f), Some(t)) => format!("{}-{}", f, t),
        _ => "all".to_string(),
    };

    let mut rules = Vec::new();

    if let Some(ip_ranges) = &permission.ip_ranges {
        for range in ip_ranges {
            rules.push(UnifiedFirewallRule {
                direction,
                protocol: protocol.clone(),
                port_range: port_range.clone(),
                source: range.cidr_ip.clone().unwrap_or_default(),
                description: range.description.clone(),
                is_allowed: true,
            });
        }
    }

    if let Some(user_id_group_pairs) = &permission.user_id_group_pairs {
        for pair in user_id_group_pairs {
            rules.push(UnifiedFirewallRule {
                direction,
                protocol: protocol.clone(),
                port_range: port_range.clone(),
                source: pair.group_id.clone().unwrap_or_default(),
                description: pair.description.clone(),
                is_allowed: true,
            });
        }
    }

    rules
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

    #[instrument(skip(self), fields(provider = "aws"))]
    pub async fn discover_instances(&self, target_region: Option<String>) -> Result<DiscoveryResult> {
        info!("Starting instance discovery across all regions");

        let regions = if let Some(region) = target_region.as_ref() {
            vec![region.clone()]
        } else {
            self.provider.list_regions().await?
        };

        let region_count = regions.len();
        info!(
            region_count,
            is_selective = target_region.is_some(),
            "Starting parallel region scan"
        );

        let mut tasks = JoinSet::new();

        for region in &regions {
            let provider = Arc::clone(&self.provider);
            let region = region.clone();
            tasks.spawn(async move {
                debug!(region = %region, "Starting region scan");
                let result = provider.fetch_instances_in_region(region.clone()).await;
                (region, result)
            });
        }

        let mut discovered_regions = BTreeSet::new();
        let mut instances = Vec::new();
        let mut failed_regions = Vec::new();

        while let Some(joined) = tasks.join_next().await {
            let (region, result) = joined.map_err(|e| ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "TaskJoin".to_string(),
                message: e.to_string(),
            })?;

            match result {
                Ok(mut region_instances) => {
                    info!(
                        region = %region,
                        instance_count = region_instances.len(),
                        "Successfully scanned region"
                    );
                    discovered_regions.insert(region);
                    instances.append(&mut region_instances);
                }
                Err(error) => {
                    warn!(
                        region = %region,
                        error = %error,
                        "Failed to scan region, skipping"
                    );
                    failed_regions.push(region);
                    // Skip inaccessible or opt-in-disabled regions so one region does not break the whole dashboard.
                    continue;
                }
            }
        }

        instances.sort_by(|left, right| {
            left.region
                .cmp(&right.region)
                .then(left.name.cmp(&right.name))
        });

        info!(
            total_instances = instances.len(),
            successful_regions = discovered_regions.len(),
            failed_regions = failed_regions.len(),
            "Instance discovery completed"
        );

        if !failed_regions.is_empty() {
            warn!(failed_regions = ?failed_regions, "Some regions failed to scan");
        }

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

    #[instrument(skip(self, region), fields(provider = "aws", region = ?region))]
    async fn fetch_instances(&self, region: Option<String>) -> Result<DiscoveryResult> {
        log_provider_operation!(info, "aws", "fetch_instances", region = region.as_deref().unwrap_or("all"));

        time_operation!("aws_fetch_instances", {
            DiscoveryEngine::new(Arc::new(self.clone()))
                .discover_instances(region)
                .await
        })
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region, instance_id = %instance_id))]
    async fn start_instance(&self, region: &str, instance_id: &str) -> Result<()> {
        log_provider_operation!(
            info,
            "aws",
            "start_instance",
            region = region,
            instance_id = instance_id
        );

        let client = self.client_for_region(region).await.map_err(|_e| {
            ProviderError::ServiceUnavailable {
                provider: "aws".to_string(),
                region: Some(region.to_string()),
            }
        })?;

        client
            .start_instances()
            .instance_ids(instance_id)
            .send()
            .await
            .map_err(|e| {
                error!(error = %e, "Failed to start instance");
                ProviderError::ApiError {
                    provider: "aws".to_string(),
                    code: "StartInstances".to_string(),
                    message: format!("Failed to start instance {}: {}", instance_id, e),
                }
            })?;

        info!("Instance started successfully");
        Ok(())
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region, instance_id = %instance_id))]
    async fn stop_instance(&self, region: &str, instance_id: &str) -> Result<()> {
        log_provider_operation!(
            info,
            "aws",
            "stop_instance",
            region = region,
            instance_id = instance_id
        );

        let client = self.client_for_region(region).await.map_err(|_e| {
            ProviderError::ServiceUnavailable {
                provider: "aws".to_string(),
                region: Some(region.to_string()),
            }
        })?;

        client
            .stop_instances()
            .instance_ids(instance_id)
            .send()
            .await
            .map_err(|e| {
                error!(error = %e, "Failed to stop instance");
                ProviderError::ApiError {
                    provider: "aws".to_string(),
                    code: "StopInstances".to_string(),
                    message: format!("Failed to stop instance {}: {}", instance_id, e),
                }
            })?;

        info!("Instance stopped successfully");
        Ok(())
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region, instance_id = %instance_id))]
    async fn reboot_instance(&self, region: &str, instance_id: &str) -> Result<()> {
        log_provider_operation!(
            info,
            "aws",
            "reboot_instance",
            region = region,
            instance_id = instance_id
        );

        let client = self.client_for_region(region).await.map_err(|_e| {
            ProviderError::ServiceUnavailable {
                provider: "aws".to_string(),
                region: Some(region.to_string()),
            }
        })?;

        client
            .reboot_instances()
            .instance_ids(instance_id)
            .send()
            .await
            .map_err(|e| {
                error!(error = %e, "Failed to reboot instance");
                ProviderError::ApiError {
                    provider: "aws".to_string(),
                    code: "RebootInstances".to_string(),
                    message: format!("Failed to reboot instance {}: {}", instance_id, e),
                }
            })?;

        info!("Instance rebooted successfully");
        Ok(())
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region, instance_id = %instance_id))]
    async fn fetch_security_groups(
        &self,
        region: &str,
        instance_id: &str,
    ) -> Result<Vec<SecurityGroupSummary>> {
        log_provider_operation!(
            info,
            "aws",
            "fetch_security_groups",
            region = region,
            instance_id = instance_id
        );

        let client = self.client_for_region(region).await?;

        // 1. Describe instance to get its security groups
        let response = client
            .describe_instances()
            .instance_ids(instance_id)
            .send()
            .await
            .map_err(|e| ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "DescribeInstances".to_string(),
                message: e.to_string(),
            })?;

        let instance = response
            .reservations
            .unwrap_or_default()
            .into_iter()
            .flat_map(|r| r.instances.unwrap_or_default())
            .next()
            .ok_or_else(|| {
                error!(instance_id = %instance_id, "Instance NOT found in describe_instances response");
                ProviderError::ResourceNotFound {
                    resource_type: "instance".to_string(),
                    resource_id: instance_id.to_string(),
                }
            })?;

        let sg_ids = instance
            .security_groups
            .unwrap_or_default()
            .into_iter()
            .filter_map(|sg| sg.group_id)
            .collect::<Vec<_>>();

        debug!(
            instance_id = %instance_id,
            found_sg_ids = ?sg_ids,
            "Found security group IDs for instance"
        );

        if sg_ids.is_empty() {
            warn!(instance_id = %instance_id, "No security groups attached to instance");
            return Ok(Vec::new());
        }

        // 2. Describe security groups to get rules
        let sg_response = client
            .describe_security_groups()
            .set_group_ids(Some(sg_ids))
            .send()
            .await
            .map_err(|e| ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "DescribeSecurityGroups".to_string(),
                message: e.to_string(),
            })?;

        let mut summaries = Vec::new();
        for sg in sg_response.security_groups.unwrap_or_default() {
            let mut rules = Vec::new();

            // Inbound Rules
            for perm in sg.ip_permissions.unwrap_or_default() {
                rules.extend(map_ip_permission(&perm, FirewallDirection::Inbound));
            }

            // Outbound Rules
            for perm in sg.ip_permissions_egress.unwrap_or_default() {
                rules.extend(map_ip_permission(&perm, FirewallDirection::Outbound));
            }

            summaries.push(SecurityGroupSummary {
                id: sg.group_id.unwrap_or_default(),
                name: sg.group_name.unwrap_or_default(),
                rules,
            });
        }

        Ok(summaries)
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region))]
    async fn list_all_security_groups(&self, region: &str) -> Result<Vec<SecurityGroupSummary>> {
        log_provider_operation!(info, "aws", "list_all_security_groups", region = region);
        let client = self.client_for_region(region).await?;

        let sg_response = client
            .describe_security_groups()
            .send()
            .await
            .map_err(|e| ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "DescribeSecurityGroups".to_string(),
                message: e.to_string(),
            })?;

        let mut summaries = Vec::new();
        for sg in sg_response.security_groups.unwrap_or_default() {
            let mut rules = Vec::new();

            for perm in sg.ip_permissions.unwrap_or_default() {
                rules.extend(map_ip_permission(&perm, FirewallDirection::Inbound));
            }
            for perm in sg.ip_permissions_egress.unwrap_or_default() {
                rules.extend(map_ip_permission(&perm, FirewallDirection::Outbound));
            }

            summaries.push(SecurityGroupSummary {
                id: sg.group_id.unwrap_or_default(),
                name: sg.group_name.unwrap_or_default(),
                rules,
            });
        }
        Ok(summaries)
    }

    #[instrument(skip(self), fields(
        provider = "aws",
        region = %region,
        security_group_id = %security_group_id,
        protocol = %rule.protocol,
        from_port = rule.from_port,
        to_port = rule.to_port
    ))]
    async fn revoke_ip(
        &self,
        region: &str,
        security_group_id: &str,
        rule: SecurityGroupRule,
    ) -> Result<()> {
        log_provider_operation!(
            info,
            "aws",
            "revoke_ip",
            region = region,
            security_group_id = security_group_id,
            cidr = rule.cidr,
            protocol = rule.protocol
        );

        let ip = normalize_cidr(&rule.cidr);
        let permission = IpPermission::builder()
            .ip_protocol(rule.protocol.to_lowercase())
            .from_port(rule.from_port)
            .to_port(rule.to_port)
            .ip_ranges(IpRange::builder().cidr_ip(ip).build())
            .build();

        let client = self.client_for_region(region).await?;

        client
            .revoke_security_group_ingress()
            .group_id(security_group_id)
            .ip_permissions(permission)
            .send()
            .await
            .map_err(|e| ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "RevokeSecurityGroupIngress".to_string(),
                message: e.to_string(),
            })?;

        Ok(())
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region, name = %name))]
    async fn create_security_group(&self, region: &str, name: &str, description: &str) -> Result<String> {
        log_provider_operation!(info, "aws", "create_security_group", region = region, name = name);
        let client = self.client_for_region(region).await?;

        let response = client
            .create_security_group()
            .group_name(name)
            .description(description)
            .send()
            .await
            .map_err(|e| ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "CreateSecurityGroup".to_string(),
                message: e.to_string(),
            })?;

        Ok(response.group_id.unwrap_or_default())
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region, security_group_id = %security_group_id))]
    async fn delete_security_group(&self, region: &str, security_group_id: &str) -> Result<()> {
        log_provider_operation!(info, "aws", "delete_security_group", region = region, sg_id = security_group_id);
        let client = self.client_for_region(region).await?;

        client
            .delete_security_group()
            .group_id(security_group_id)
            .send()
            .await
            .map_err(|e| ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "DeleteSecurityGroup".to_string(),
                message: e.to_string(),
            })?;

        Ok(())
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region, instance_id = %instance_id))]
    async fn fetch_metrics(&self, region: &str, instance_id: &str) -> Result<ResourceMetrics> {
        log_provider_operation!(
            info,
            "aws",
            "fetch_metrics",
            region = region,
            instance_id = instance_id
        );

        let region_provider =
            aws_config::meta::region::RegionProviderChain::first_try(Some(aws_sdk_cloudwatch::config::Region::new(region.to_owned())))
                .or_default_provider()
                .or_else(aws_sdk_cloudwatch::config::Region::new(self.default_region.clone()));

        let mut loader = aws_config::defaults(BehaviorVersion::latest()).region(region_provider);
        if let Some(credentials) = &self.credentials {
            loader = loader.credentials_provider(credentials.clone());
        }

        let config = loader.load().await;
        let cw_client = aws_sdk_cloudwatch::Client::new(&config);

        let now = Utc::now();
        // Look back 30 minutes instead of 10 to ensure we catch a data point (CloudWatch latency)
        let start_time = now - chrono::Duration::minutes(30);

        let response = cw_client
            .get_metric_statistics()
            .namespace("AWS/EC2")
            .metric_name("CPUUtilization")
            .dimensions(
                aws_sdk_cloudwatch::types::Dimension::builder()
                    .name("InstanceId")
                    .value(instance_id)
                    .build(),
            )
            .start_time(aws_sdk_cloudwatch::primitives::DateTime::from_secs(
                start_time.timestamp(),
            ))
            .end_time(aws_sdk_cloudwatch::primitives::DateTime::from_secs(
                now.timestamp(),
            ))
            .period(60) // 1 minute resolution
            .statistics(aws_sdk_cloudwatch::types::Statistic::Average)
            .send()
            .await
            .map_err(|e| ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "GetMetricStatistics".to_string(),
                message: e.to_string(),
            })?;

        let mut datapoints = response.datapoints.unwrap_or_default();
        
        // Sort by timestamp descending to get the most recent point
        datapoints.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        let cpu_percentage = datapoints
            .first()
            .and_then(|dp| dp.average);

        debug!(
            instance_id = %instance_id,
            datapoint_count = datapoints.len(),
            latest_cpu = ?cpu_percentage,
            "Fetched metrics from CloudWatch"
        );

        Ok(ResourceMetrics {
            timestamp: now,
            cpu_percentage,
            memory_total_bytes: None, // Requires agent/SSH
            memory_used_bytes: None,  // Requires agent/SSH
            disk_usage_percentage: None, // Requires agent/SSH
        })
    }

    #[instrument(skip(self), fields(
        provider = "aws",
        region = %region,
        security_group_id = %security_group_id,
        protocol = %rule.protocol,
        from_port = rule.from_port,
        to_port = rule.to_port
    ))]
    async fn authorize_ip(
        &self,
        region: &str,
        security_group_id: &str,
        rule: SecurityGroupRule,
    ) -> Result<()> {
        log_provider_operation!(
            info,
            "aws",
            "authorize_ip",
            region = region,
            security_group_id = security_group_id,
            cidr = rule.cidr,
            protocol = rule.protocol
        );

        let ip = normalize_cidr(&rule.cidr);
        debug!(original_cidr = %rule.cidr, normalized_cidr = %ip, "Normalized CIDR");

        let protocol = rule.protocol.to_lowercase();
        let permission = IpPermission::builder()
            .ip_protocol(protocol)
            .from_port(rule.from_port)
            .to_port(rule.to_port)
            .ip_ranges(
                IpRange::builder()
                    .cidr_ip(ip.clone())
                    .description(
                        rule.description
                            .unwrap_or_else(|| "ULGEN managed rule".to_owned()),
                    )
                    .build(),
            )
            .build();

        let client = self.client_for_region(region).await.map_err(|_e| {
            ProviderError::ServiceUnavailable {
                provider: "aws".to_string(),
                region: Some(region.to_string()),
            }
        })?;

        client
            .authorize_security_group_ingress()
            .group_id(security_group_id)
            .ip_permissions(permission)
            .send()
            .await
            .map_err(|e| {
                error!(error = %e, "Failed to authorize security group ingress");
                ProviderError::ApiError {
                    provider: "aws".to_string(),
                    code: "AuthorizeSecurityGroupIngress".to_string(),
                    message: format!(
                        "Failed to authorize ingress for security group {}: {}",
                        security_group_id, e
                    ),
                }
            })?;

        info!("Security group rule authorized successfully");
        Ok(())
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region, key_name = %key_name))]
    async fn create_ssh_key(&self, region: &str, key_name: &str) -> Result<String> {
        log_provider_operation!(
            info,
            "aws",
            "create_ssh_key",
            region = region,
            key_name = key_name
        );

        let client = self.client_for_region(region).await.map_err(|_e| {
            ProviderError::ServiceUnavailable {
                provider: "aws".to_string(),
                region: Some(region.to_string()),
            }
        })?;

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
            .map_err(|e| {
                error!(error = %e, "Failed to create SSH key pair");
                ProviderError::ApiError {
                    provider: "aws".to_string(),
                    code: "CreateKeyPair".to_string(),
                    message: format!("Failed to create SSH key {}: {}", key_name, e),
                }
            })?;

        let key_material = response.key_material.ok_or_else(|| {
            error!("AWS did not return key material");
            ProviderError::ApiError {
                provider: "aws".to_string(),
                code: "CreateKeyPair".to_string(),
                message: format!("AWS did not return key material for {}", key_name),
            }
        })?;

        info!("SSH key pair created successfully");
        Ok(key_material)
    }

    #[instrument(skip(self), fields(provider = "aws", region = %region, key_name = %key_name))]
    async fn delete_ssh_key(&self, region: &str, key_name: &str) -> Result<()> {
        log_provider_operation!(
            info,
            "aws",
            "delete_ssh_key",
            region = region,
            key_name = key_name
        );

        let client = self.client_for_region(region).await.map_err(|_e| {
            ProviderError::ServiceUnavailable {
                provider: "aws".to_string(),
                region: Some(region.to_string()),
            }
        })?;

        client
            .delete_key_pair()
            .key_name(key_name)
            .send()
            .await
            .map_err(|e| {
                error!(error = %e, "Failed to delete SSH key pair");
                ProviderError::ApiError {
                    provider: "aws".to_string(),
                    code: "DeleteKeyPair".to_string(),
                    message: format!("Failed to delete SSH key {}: {}", key_name, e),
                }
            })?;

        info!("SSH key pair deleted successfully");
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
