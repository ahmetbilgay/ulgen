use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AwsCredentialInput {
    pub account_name: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub session_token: Option<String>,
    pub default_region: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AwsCredentialSummary {
    pub is_configured: bool,
    pub account_name: Option<String>,
    pub access_key_preview: Option<String>,
    pub default_region: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AwsConnectionStatus {
    pub ok: bool,
    pub message: String,
    pub region_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct InstanceSummary {
    pub id: String,
    pub name: String,
    pub region: String,
    pub state: String,
    pub public_ip: Option<String>,
    pub private_ip: Option<String>,
    pub instance_type: Option<String>,
    pub launched_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DiscoveryResult {
    pub provider: String,
    pub regions_scanned: Vec<String>,
    pub instances: Vec<InstanceSummary>,
    pub generated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct UiPreferences {
    pub command_palette_enabled: bool,
    pub sidebar_collapsed: bool,
    pub updated_at: DateTime<Utc>,
}

impl Default for UiPreferences {
    fn default() -> Self {
        Self {
            command_palette_enabled: true,
            sidebar_collapsed: false,
            updated_at: Utc::now(),
        }
    }
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum FirewallDirection {
    Inbound,
    Outbound,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct UnifiedFirewallRule {
    pub direction: FirewallDirection,
    pub protocol: String,
    pub port_range: String,
    pub source: String,
    pub description: Option<String>,
    pub is_allowed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SecurityGroupSummary {
    pub id: String,
    pub name: String,
    pub rules: Vec<UnifiedFirewallRule>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ResourceMetrics {
    pub timestamp: DateTime<Utc>,
    pub cpu_percentage: Option<f64>,
    pub memory_total_bytes: Option<u64>,
    pub memory_used_bytes: Option<u64>,
    pub disk_usage_percentage: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TeamShare {
    pub id: Uuid,
    pub name: String,
    pub resource_id: String,
    pub permission: String,
    pub shared_at: DateTime<Utc>,
}
