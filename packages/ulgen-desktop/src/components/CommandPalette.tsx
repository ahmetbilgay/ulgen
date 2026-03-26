import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { useCommandPaletteStore } from "../store/useCommandPaletteStore";

type CommandPaletteProps = {
  bg: string;
  border: string;
  muted: string;
  soft: string;
};

export function CommandPalette({ bg, border, muted, soft }: CommandPaletteProps) {
  const isOpen = useCommandPaletteStore((state) => state.isOpen);
  const close = useCommandPaletteStore((state) => state.close);

  if (!isOpen) {
    return null;
  }

  return (
    <Box className="command-palette-backdrop" onClick={close}>
      <Box
        width="min(720px, calc(100vw - 32px))"
        borderRadius="24px"
        p={4}
        borderWidth="1px"
        borderColor={border}
        bg={bg}
        boxShadow="0 18px 40px rgba(18, 28, 38, 0.18)"
        onClick={(event) => event.stopPropagation()}
      >
        <Box p={4} borderRadius="18px" bg={soft} color={muted} mb={4}>
          Search resources or run actions like `ssh to prod`
        </Box>
        <Stack gap={2.5}>
          <Button justifyContent="start" variant="outline" borderColor={border}>
            Refresh EC2 inventory
          </Button>
          <Button justifyContent="start" variant="outline" borderColor={border}>
            Authorize current IP
          </Button>
          <Button justifyContent="start" variant="outline" borderColor={border}>
            SSH to production
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
