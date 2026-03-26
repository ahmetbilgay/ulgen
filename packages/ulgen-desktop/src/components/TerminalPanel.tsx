import { Box, Heading, Text } from "@chakra-ui/react";

type TerminalPanelProps = {
  bg: string;
  border: string;
  muted: string;
  accent: string;
};

export function TerminalPanel({ bg, border, muted, accent }: TerminalPanelProps) {
  return (
    <Box borderRadius="26px" p={6} bg={bg} borderWidth="1px" borderColor={border}>
      <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
        Access
      </Text>
      <Heading mt={2} size="lg">
        Terminal
      </Heading>
      <Text mt={4} color={muted} lineHeight="1.7">
        SSH tunnel orchestration and terminal streaming will attach here from `ulgen-core::ssh`.
      </Text>
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
      >
        <Text>ulgen ssh</Text>
        <Box className="terminal-cursor" />
      </Box>
    </Box>
  );
}
