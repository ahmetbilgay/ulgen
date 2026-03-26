import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useCallback } from "react";
import type { DiscoveryResult } from "@/types/cloud";
import { useConfigStore } from "@/store/useConfigStore";

/**
 * useAws Hook
 * Manages AWS resource discovery and reactivity to region/account changes.
 */
export function useAws(enabled = true) {
  const { activeRegion, credentialSummary } = useConfigStore();
  const [data, setData] = useState<DiscoveryResult | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke<DiscoveryResult>("fetch_instances", { 
        region: activeRegion 
      });
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AWS discovery failed");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, activeRegion]);

  useEffect(() => {
    if (enabled) {
      void refresh();
    } else {
      setIsLoading(false);
      setData(null);
    }
  }, [enabled, activeRegion, credentialSummary?.account_name, refresh]);

  return { data, isLoading, error, refresh };
}
