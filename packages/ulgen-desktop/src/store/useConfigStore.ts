import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

export type AwsCredentialInput = {
  account_name: String;
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

interface ConfigState {
  credentialSummary: AwsCredentialSummary | null;
  credentialForm: AwsCredentialInput;
  credentialNotice: string | null;
  connectionStatus: AwsConnectionStatus | null;
  credentialBusy: boolean;
  activeRegion: string | null;

  setCredentialForm: (updater: AwsCredentialInput | ((current: AwsCredentialInput) => AwsCredentialInput)) => void;
  setActiveRegion: (region: string | null) => void;
  hydrateCredentialSummary: () => Promise<void>;
  connectProvider: () => Promise<void>;
  clearCredentials: () => Promise<void>;
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

  setCredentialForm: (updater) =>
    set((state) => ({
      credentialForm: typeof updater === "function" ? updater(state.credentialForm) : updater,
    })),
  setActiveRegion: (activeRegion) => set({ activeRegion }),
  
  hydrateCredentialSummary: async () => {
    try {
      const summary = await invoke<AwsCredentialSummary>("load_aws_credentials");
      set((state) => ({
        credentialSummary: summary,
        activeRegion: state.activeRegion ?? summary.default_region ?? null,
        credentialForm: {
          ...state.credentialForm,
          account_name: summary.account_name ?? state.credentialForm.account_name,
          default_region: summary.default_region ?? state.credentialForm.default_region,
        },
      }));
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
      });
    } catch (cause) {
      set({ credentialNotice: cause instanceof Error ? cause.message : "Failed to clear AWS credentials." });
    } finally {
      set({ credentialBusy: false });
    }
  },
}));
