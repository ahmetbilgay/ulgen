import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

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

export function useAws(enabled = true) {
  const [data, setData] = useState<DiscoveryResult | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke<DiscoveryResult>("fetch_instances");
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AWS discovery failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      void refresh();
    } else {
      setIsLoading(false);
    }
  }, [enabled]);

  return { data, isLoading, error, refresh };
}
