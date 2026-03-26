export type InstanceSummary = {
  id: string;
  name: string;
  region: string;
  state: string;
  public_ip?: string | null;
  private_ip?: string | null;
  instance_type?: string | null;
  launched_at?: string | null;
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
