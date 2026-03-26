import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import type { InstanceSummary } from "@/types/cloud";

interface TerminalState {
  sshUsername: string;
  preparedCommand: string | null;
  terminalNotice: string | null;
  terminalBusy: boolean;

  setSshUsername: (value: string) => void;
  prepareTerminal: (instance: InstanceSummary | null) => Promise<void>;
  setTerminalNotice: (notice: string | null) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  sshUsername: "ec2-user",
  preparedCommand: null,
  terminalNotice: null,
  terminalBusy: false,

  setSshUsername: (sshUsername) => set({ sshUsername }),
  setTerminalNotice: (terminalNotice) => set({ terminalNotice }),
  
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
