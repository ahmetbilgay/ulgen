import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { DiscoveryResult } from "@/types/cloud";

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
