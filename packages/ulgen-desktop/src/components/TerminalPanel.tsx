import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";
import type { InstanceSummary } from "../hooks/useAws";

type TerminalPanelProps = {
  selectedInstance: InstanceSummary | null;
  sshUsername: string;
  onUsernameChange: (value: string) => void;
  onPrepare: () => void;
  preparedCommand: string | null;
  terminalNotice: string | null;
  bg: string;
  border: string;
  muted: string;
  accent: string;
  busy: boolean;
};

export function TerminalPanel({
  selectedInstance,
  sshUsername,
  onUsernameChange,
  onPrepare,
  preparedCommand,
  terminalNotice,
  bg,
  border,
  muted,
  accent,
  busy,
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
        Prepare an SSH command from the selected instance. Terminal streaming is the next backend step.
      </Text>
      <Text mt={4} color={muted} fontSize="sm">
        Target: {selectedInstance?.name ?? "No instance selected"}
      </Text>
      <Input
        mt={4}
        value={sshUsername}
        onChange={(event) => onUsernameChange(event.target.value)}
        placeholder="ec2-user"
        borderRadius="16px"
      />
      <Button
        mt={4}
        borderRadius="full"
        onClick={onPrepare}
        disabled={!selectedInstance || busy}
      >
        {busy ? "Preparing..." : "Prepare SSH command"}
      </Button>
      {terminalNotice ? (
        <Text mt={4} color={muted} lineHeight="1.6">
          {terminalNotice}
        </Text>
      ) : null}
      <Box
        mt={5}
        px={4}
        py={3}
        borderRadius="18px"
        borderWidth="1px"
        borderColor={border}
        fontFamily="mono"
        display="flex"
        alignItems="center"
        gap={2}
        color={preparedCommand ? accent : undefined}
      >
        <Text>{preparedCommand ?? "ulgen ssh"}</Text>
        {!preparedCommand ? <Box className="terminal-cursor" /> : null}
      </Box>
    </Box>
  );
}
