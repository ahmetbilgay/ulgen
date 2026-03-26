import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import type { InstanceSummary } from "../hooks/useAws";

export type CloudProviderOption = "aws" | "gcp" | "azure";
export type DashboardSection = "home" | "servers" | "keys" | "security";

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

type WorkspaceState = {
  activeSection: DashboardSection;
  selectedProvider: CloudProviderOption;
  isProviderModalOpen: boolean;
  providerModalStep: "select" | "connect";
  credentialSummary: AwsCredentialSummary | null;
  credentialForm: AwsCredentialInput;
  credentialNotice: string | null;
  connectionStatus: AwsConnectionStatus | null;
  credentialBusy: boolean;
  activeRegion: string | null;
  selectedInstanceId: string | null;
  sshUsername: string;
  preparedCommand: string | null;
  terminalNotice: string | null;
  terminalBusy: boolean;
  setActiveSection: (section: DashboardSection) => void;
  setSelectedProvider: (provider: CloudProviderOption) => void;
  openProviderModal: () => void;
  closeProviderModal: () => void;
  setProviderModalStep: (step: "select" | "connect") => void;
  openAwsConnectionStep: () => void;
  setCredentialForm: (updater: AwsCredentialInput | ((current: AwsCredentialInput) => AwsCredentialInput)) => void;
  setActiveRegion: (region: string | null) => void;
  setSelectedInstanceId: (id: string | null) => void;
  setSshUsername: (value: string) => void;
  hydrateCredentialSummary: () => Promise<void>;
  connectProvider: () => Promise<void>;
  clearCredentials: () => Promise<void>;
  prepareTerminal: (instance: InstanceSummary | null) => Promise<void>;
};

const EMPTY_FORM: AwsCredentialInput = {
  access_key_id: "",
  secret_access_key: "",
  session_token: "",
  default_region: "us-east-1",
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeSection: "home",
  selectedProvider: "aws",
  isProviderModalOpen: false,
  providerModalStep: "select",
  credentialSummary: null,
  credentialForm: EMPTY_FORM,
  credentialNotice: null,
  connectionStatus: null,
  credentialBusy: false,
  activeRegion: null,
  selectedInstanceId: null,
  sshUsername: "ec2-user",
  preparedCommand: null,
  terminalNotice: null,
  terminalBusy: false,
  setActiveSection: (activeSection) => set({ activeSection }),
  setSelectedProvider: (selectedProvider) => set({ selectedProvider }),
  openProviderModal: () => set({ isProviderModalOpen: true, providerModalStep: "select", credentialNotice: null }),
  closeProviderModal: () => set({ isProviderModalOpen: false }),
  setProviderModalStep: (providerModalStep) => set({ providerModalStep }),
  openAwsConnectionStep: () => set({ selectedProvider: "aws", providerModalStep: "connect", credentialNotice: null }),
  setCredentialForm: (updater) =>
    set((state) => ({
      credentialForm: typeof updater === "function" ? updater(state.credentialForm) : updater,
    })),
  setActiveRegion: (activeRegion) => set({ activeRegion }),
  setSelectedInstanceId: (selectedInstanceId) => set({ selectedInstanceId }),
  setSshUsername: (sshUsername) => set({ sshUsername }),
  hydrateCredentialSummary: async () => {
    try {
      const summary = await invoke<AwsCredentialSummary>("load_aws_credentials");
      set((state) => ({
        credentialSummary: summary,
        activeRegion: state.activeRegion ?? summary.default_region ?? null,
        credentialForm: summary.default_region
          ? { ...state.credentialForm, default_region: summary.default_region }
          : state.credentialForm,
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
        selectedProvider: "aws",
        activeSection: "home",
        activeRegion: summary.default_region ?? credentialForm.default_region,
        isProviderModalOpen: false,
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
        preparedCommand: null,
        terminalNotice: null,
        selectedInstanceId: null,
      });
    } catch (cause) {
      set({ credentialNotice: cause instanceof Error ? cause.message : "Failed to clear AWS credentials." });
    } finally {
      set({ credentialBusy: false });
    }
  },
  prepareTerminal: async (instance) => {
    if (!instance) {
      set({ terminalNotice: "Select an EC2 instance before preparing an SSH session." });
      return;
    }
    set({ terminalBusy: true, terminalNotice: null });
    try {
      const { sshUsername } = get();
      const command = await invoke<string>("prepare_ssh_session", {
        instance,
        username: sshUsername,
      });
      set({
        preparedCommand: command,
        terminalNotice: "SSH command prepared. Terminal streaming is the next backend step.",
      });
    } catch (cause) {
      set({
        preparedCommand: null,
        terminalNotice: cause instanceof Error ? cause.message : "Failed to prepare SSH command.",
      });
    } finally {
      set({ terminalBusy: false });
    }
  },
}));
