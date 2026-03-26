import { Box, Button, Heading, HStack, Input, Stack, Text } from "@chakra-ui/react";
import type { InstanceSummary } from "../hooks/useAws";

type TerminalPanelProps = {
  selectedInstance: InstanceSummary | null;
  sshUsername: string;
  onUsernameChange: (value: string) => void;
  terminalInput: string;
  onTerminalInputChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSend: () => void;
  onCopyCommand: () => void;
  preparedCommand: string | null;
  terminalOutput: string;
  terminalNotice: string | null;
  bg: string;
  border: string;
  muted: string;
  accent: string;
  busy: boolean;
  isRunning: boolean;
  hasSession: boolean;
};

export function TerminalPanel({
  selectedInstance,
  sshUsername,
  onUsernameChange,
  terminalInput,
  onTerminalInputChange,
  onConnect,
  onDisconnect,
  onSend,
  onCopyCommand,
  preparedCommand,
  terminalOutput,
  terminalNotice,
  bg,
  border,
  muted,
  accent,
  busy,
  isRunning,
  hasSession,
}: TerminalPanelProps) {
  return (
    <Box borderRadius="26px" p={6} bg={bg} borderWidth="1px" borderColor={border}>
      <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
        Access
      </Text>
      <Heading mt={2} size="lg">
        Terminal
      </Heading>
      <Text mt={4} color={muted} lineHeight="1.7">
        Open an SSH session inside ULGEN and send commands directly from this panel.
      </Text>
      <Text mt={4} color={muted} fontSize="sm">
        Target: {selectedInstance?.name ?? "No instance selected"}
      </Text>
      <Stack mt={4} gap={3}>
        <Input
          value={sshUsername}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder="ec2-user"
          borderRadius="16px"
        />
        <HStack gap={3} wrap="wrap">
          {!hasSession ? (
            <Button borderRadius="full" onClick={onConnect} disabled={!selectedInstance || busy}>
              {busy ? "Connecting..." : "Connect terminal"}
            </Button>
          ) : (
            <Button borderRadius="full" variant="outline" onClick={onDisconnect}>
              Disconnect
            </Button>
          )}
          <Button borderRadius="full" variant="outline" onClick={onCopyCommand} disabled={!preparedCommand}>
            Copy SSH command
          </Button>
          <Text color={muted} fontSize="sm">
            {isRunning ? "Live" : hasSession ? "Stopped" : "Idle"}
          </Text>
        </HStack>
      </Stack>
      {terminalNotice ? (
        <Text mt={4} color={muted} lineHeight="1.6">
          {terminalNotice}
        </Text>
      ) : null}
      <Box
        mt={5}
        px={4}
        py={4}
        borderRadius="18px"
        borderWidth="1px"
        borderColor={border}
        fontFamily="mono"
        minH="260px"
        maxH="340px"
        overflowY="auto"
        whiteSpace="pre-wrap"
        color={terminalOutput ? accent : muted}
      >
        <Text>{terminalOutput || preparedCommand || "Open a terminal session to start working on the server."}</Text>
        {!terminalOutput && !preparedCommand ? <Box className="terminal-cursor" /> : null}
      </Box>

      <HStack mt={4} gap={3} align="start">
        <Input
          value={terminalInput}
          onChange={(event) => onTerminalInputChange(event.target.value)}
          placeholder={hasSession ? "Type a command and press send" : "Connect to start typing"}
          borderRadius="16px"
          disabled={!hasSession}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void onSend();
            }
          }}
        />
        <Button borderRadius="full" onClick={onSend} disabled={!hasSession || !terminalInput.trim()}>
          Send
        </Button>
      </HStack>
    </Box>
  );
}
