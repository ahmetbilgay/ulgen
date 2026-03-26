use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TeamShare {
    pub id: Uuid,
    pub name: String,
    pub resource_id: String,
    pub permission: String,
    pub shared_at: DateTime<Utc>,
}
