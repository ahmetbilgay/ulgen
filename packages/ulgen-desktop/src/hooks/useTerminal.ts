import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState, useCallback } from "react";
import type { InstanceSummary } from "@/types/cloud";

export function useTerminal(
  selectedInstance: InstanceSummary | null, 
  sshUsername: string,
  privateKeyPath?: string,
  onOutput?: (data: string) => void
) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const onOutputRef = useRef(onOutput);
  
  useEffect(() => {
    onOutputRef.current = onOutput;
  }, [onOutput]);

  useEffect(() => {
    if (!sessionId) return;

    let unlistenFn: (() => void) | null = null;
    let isCancelled = false;

    const setupListener = async () => {
      const u = await listen<{ sid: number; data: string }>("terminal-output", (event) => {
        const { sid, data } = event.payload;
        if (sid === sessionId && !isCancelled) {
          onOutputRef.current?.(data);
        }
      });
      
      if (isCancelled) {
        u();
      } else {
        unlistenFn = u;
      }
    };

    setupListener();

    return () => {
      isCancelled = true;
      if (unlistenFn) unlistenFn();
    };
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (sessionId) {
        void invoke("close_terminal_session", { sessionId });
      }
    };
  }, [sessionId]);

  const connect = useCallback(async () => {
    if (!selectedInstance) {
      setNotice("Select a server before opening a terminal.");
      return;
    }

    setIsConnecting(true);
    setNotice(null);
    setOutput("");

    try {
      const nextSessionId = await invoke<number>("open_terminal_session", {
        instance: selectedInstance,
        username: sshUsername,
        privateKeyPath: privateKeyPath || null,
      });

      setSessionId(Number(nextSessionId));
      setIsRunning(true);
      setNotice(`Connected to ${selectedInstance.name}.`);
    } catch (cause) {
      setNotice(typeof cause === "string" ? cause : (cause instanceof Error ? cause.message : "Failed to open SSH session."));
    } finally {
      setIsConnecting(false);
    }
  }, [selectedInstance, sshUsername, privateKeyPath]);

  const disconnect = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    try {
      await invoke("close_terminal_session", { sessionId });
    } catch (cause) {
      setNotice(typeof cause === "string" ? cause : (cause instanceof Error ? cause.message : "Failed to disconnect terminal."));
    } finally {
      setSessionId(null);
      setIsRunning(false);
      setNotice("Terminal session closed.");
    }
  }, [sessionId]);

  const send = useCallback(async (data?: string) => {
    const rawInput = data !== undefined ? data : input;
    if (!sessionId || (data === undefined && !rawInput.trim())) {
      return;
    }

    try {
      await invoke("write_terminal_input", { 
        sessionId, 
        input: data !== undefined ? data : input + "\n" 
      });
      if (data === undefined) setInput("");
    } catch (cause) {
      setNotice(typeof cause === "string" ? cause : (cause instanceof Error ? cause.message : "Failed to send terminal input."));
    }
  }, [sessionId, input]);

  return {
    output,
    input,
    setInput,
    notice,
    isConnecting,
    isRunning,
    hasSession: Boolean(sessionId),
    connect,
    disconnect,
    send,
  };
}
