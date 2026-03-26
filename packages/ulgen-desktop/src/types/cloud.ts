export type InstanceSummary = {
  id: string;
  name: string;
  region: string;
  state: string;
  public_ip?: string | null;
  private_ip?: string | null;
  instance_type?: string | null;
  launched_at?: string | null;
  platform?: string | null;
  az?: string | null;
};

export type DiscoveryResult = {
  provider: string;
  regions_scanned: string[];
  instances: InstanceSummary[];
  generated_at: string;
};

export type AwsCredentialInput = {
  access_key_id: string;
  secret_access_key: string;
  session_token?: string | null;
  default_region: string;
};

export type AwsCredentialSummary = {
  is_configured: boolean;
  access_key_preview?: string | null;
  default_region?: string | null;
};

export type AwsConnectionStatus = {
  ok: boolean;
  message: string;
  region_count: number;
};

export type FirewallDirection = "Inbound" | "Outbound";

export type UnifiedFirewallRule = {
  direction: FirewallDirection;
  protocol: string;
  port_range: string;
  source: string;
  description?: string | null;
  is_allowed: boolean;
};

export type SecurityGroupSummary = {
  id: string;
  name: string;
  rules: UnifiedFirewallRule[];
};

export type ResourceMetrics = {
  timestamp: string;
  cpu_percentage?: number | null;
  memory_total_bytes?: number | null;
  memory_used_bytes?: number | null;
  disk_usage_percentage?: number | null;
};
