import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

export type AwsCredentialInput = {
  account_name: string;
  access_key_id: string;
  secret_access_key: string;
  session_token?: string | null;
  default_region: string;
};

export type AwsCredentialSummary = {
  is_configured: boolean;
  account_name?: string | null;
  access_key_preview?: string | null;
  default_region?: string | null;
};

export type AwsConnectionStatus = {
  ok: boolean;
  message: string;
  region_count: number;
};

export type CloudProfile = {
  name: string;
  provider: string;
  preview: string;
  default_region: string;
};

interface ConfigState {
  credentialSummary: AwsCredentialSummary | null;
  credentialForm: AwsCredentialInput;
  credentialNotice: string | null;
  connectionStatus: AwsConnectionStatus | null;
  credentialBusy: boolean;
  activeRegion: string | null;
  profiles: CloudProfile[];
  availableRegions: string[];

  setCredentialForm: (updater: AwsCredentialInput | ((current: AwsCredentialInput) => AwsCredentialInput)) => void;
  setActiveRegion: (region: string | null) => void;
  hydrateCredentialSummary: () => Promise<void>;
  connectProvider: () => Promise<void>;
  switchProfile: (name: string) => Promise<void>;
  deleteProfile: (name: string) => Promise<void>;
  clearCredentials: () => Promise<void>;
  refreshRegions: () => Promise<void>;
  showAccountSettings: boolean;
  setShowAccountSettings: (show: boolean) => void;
  nodeCredentials: Record<string, { username: string, key_path: string | null }>;
  setNodeCredential: (instanceId: string, username: string, key_path: string | null) => Promise<void>;
}

const EMPTY_FORM: AwsCredentialInput = {
  account_name: "",
  access_key_id: "",
  secret_access_key: "",
  session_token: "",
  default_region: "us-east-1",
};

export const useConfigStore = create<ConfigState>((set, get) => ({
  credentialSummary: null,
  credentialForm: EMPTY_FORM,
  credentialNotice: null,
  connectionStatus: null,
  credentialBusy: false,
  activeRegion: null,
  profiles: [],
  availableRegions: [],
  showAccountSettings: false,
  nodeCredentials: {},

  setCredentialForm: (updater) =>
    set((state) => ({
      credentialForm: typeof updater === "function" ? updater(state.credentialForm) : updater,
    })),
  setActiveRegion: (activeRegion) => set({ activeRegion }),
  
  hydrateCredentialSummary: async () => {
    try {
      const summary = await invoke<AwsCredentialSummary>("load_aws_credentials");
      const profiles = await invoke<CloudProfile[]>("list_cloud_profiles");
      set((state) => ({
        credentialSummary: summary,
        profiles,
        activeRegion: state.activeRegion ?? summary.default_region ?? null,
        credentialForm: {
          ...state.credentialForm,
          account_name: summary.account_name ?? state.credentialForm.account_name,
          default_region: summary.default_region ?? state.credentialForm.default_region,
        },
      }));
      
      try {
        const nodeCreds = await invoke<Record<string, { username: string, key_path: string | null }>>("load_node_credentials");
        set({ nodeCredentials: nodeCreds });
      } catch {
        // Normal if no node credentials saved yet
      }

      if (summary.is_configured) {
        await get().refreshRegions();
      }
    } catch {
      set({
        credentialSummary: {
          is_configured: false,
          access_key_preview: null,
          default_region: "us-east-1",
        },
        activeRegion: "us-east-1",
      });
    }
  },

  refreshRegions: async () => {
    try {
      const regions = await invoke<string[]>("fetch_aws_regions");
      set({ availableRegions: regions });
    } catch (e) {
      console.error("Failed to fetch regions:", e);
    }
  },

  setShowAccountSettings: (show) => set({ showAccountSettings: show }),

  connectProvider: async () => {
    set({ credentialBusy: true, connectionStatus: null });
    try {
      const { credentialForm } = get();
      const summary = await invoke<AwsCredentialSummary>("save_aws_credentials", {
        input: { ...credentialForm, session_token: credentialForm.session_token || null },
      });
      const status = await invoke<AwsConnectionStatus>("test_aws_connection", {
        input: { ...credentialForm, session_token: credentialForm.session_token || null },
      });
      
      // Automatically save as a profile
      await invoke("save_cloud_profile", { input: { 
        ...credentialForm, 
        session_token: credentialForm.session_token || null 
      }});

      set({
        credentialSummary: summary,
        connectionStatus: status,
        credentialNotice: status.message,
        activeRegion: summary.default_region ?? credentialForm.default_region,
      });
      await get().hydrateCredentialSummary();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "AWS connection test failed.";
      set({
        connectionStatus: { ok: false, message, region_count: 0 },
        credentialNotice: message,
      });
    } finally {
      set({ credentialBusy: false });
    }
  },

  switchProfile: async (name: string) => {
    set({ credentialBusy: true });
    try {
      const summary = await invoke<AwsCredentialSummary>("switch_cloud_profile", { name });
      set({ 
        credentialSummary: summary,
        activeRegion: summary.default_region || null,
        connectionStatus: null,
        credentialNotice: `Switched to profile: ${name}`
      });
      await get().hydrateCredentialSummary();
    } catch (cause) {
      set({ credentialNotice: cause instanceof Error ? cause.message : "Failed to switch profile." });
    } finally {
      set({ credentialBusy: false });
    }
  },

  deleteProfile: async (name: string) => {
    try {
      await invoke("delete_cloud_profile", { name });
      await get().hydrateCredentialSummary();
    } catch (cause) {
      set({ credentialNotice: cause instanceof Error ? cause.message : "Failed to delete profile." });
    }
  },

  clearCredentials: async () => {
    set({ credentialBusy: true });
    try {
      await invoke("clear_aws_credentials");
      set({
        credentialSummary: { is_configured: false, access_key_preview: null, default_region: "us-east-1" },
        credentialForm: EMPTY_FORM,
        credentialNotice: "Saved AWS credentials cleared.",
        connectionStatus: null,
        activeRegion: "us-east-1",
        availableRegions: [],
      });
    } catch (cause) {
      set({ credentialNotice: cause instanceof Error ? cause.message : "Failed to clear AWS credentials." });
    } finally {
      set({ credentialBusy: false });
    }
  },
  setNodeCredential: async (instanceId, username, key_path) => {
    const { nodeCredentials } = get();
    const updated = {
      ...nodeCredentials,
      [instanceId]: { username, key_path }
    };
    set({ nodeCredentials: updated });
    try {
      await invoke("save_node_credentials", { credentials: updated });
    } catch (e) {
      console.error("Failed to save node credentials:", e);
    }
  },
}));
