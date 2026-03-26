import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import type { InstanceSummary } from "./useAws";

type TerminalSnapshot = {
  output: string;
  cursor: number;
  running: boolean;
};

export function useTerminal(selectedInstance: InstanceSummary | null, sshUsername: string) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const cursorRef = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let cancelled = false;
    const timer = window.setInterval(async () => {
      try {
        const snapshot = await invoke<TerminalSnapshot>("read_terminal_output", {
          sessionId,
          cursor: cursorRef.current,
        });

        if (cancelled) {
          return;
        }

        if (snapshot.output) {
          setOutput((current) => current + snapshot.output);
        }

        cursorRef.current = snapshot.cursor;
        setIsRunning(snapshot.running);
      } catch (cause) {
        if (!cancelled) {
          setNotice(cause instanceof Error ? cause.message : "Terminal polling failed.");
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (sessionId) {
        void invoke("close_terminal_session", { sessionId });
      }
    };
  }, [sessionId]);

  async function connect() {
    if (!selectedInstance) {
      setNotice("Select a server before opening a terminal.");
      return;
    }

    setIsConnecting(true);
    setNotice(null);
    setOutput("");
    cursorRef.current = 0;

    try {
      if (sessionId) {
        await invoke("close_terminal_session", { sessionId });
      }

      const nextSessionId = await invoke<number>("open_terminal_session", {
        instance: selectedInstance,
        username: sshUsername,
      });

      setSessionId(nextSessionId);
      setIsRunning(true);
      setNotice(`Connected to ${selectedInstance.name}.`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Failed to open SSH session.");
    } finally {
      setIsConnecting(false);
    }
  }

  async function disconnect() {
    if (!sessionId) {
      return;
    }

    try {
      await invoke("close_terminal_session", { sessionId });
    } finally {
      setSessionId(null);
      setIsRunning(false);
      setNotice("Terminal session closed.");
    }
  }

  async function send() {
    if (!sessionId || !input.trim()) {
      return;
    }

    try {
      await invoke("write_terminal_input", { sessionId, input });
      setInput("");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Failed to send terminal input.");
    }
  }

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
