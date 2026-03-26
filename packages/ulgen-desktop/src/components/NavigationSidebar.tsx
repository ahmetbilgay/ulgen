import { Box, Button, Stack, Text } from "@chakra-ui/react";

type NavigationSidebarProps = {
  onRefresh: () => Promise<void>;
  onExit: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  bg: string;
  border: string;
  muted: string;
  accent: string;
  soft: string;
  text: string;
  buttonBg: string;
  buttonText: string;
  buttonHoverBg: string;
};

export function NavigationSidebar({
  onRefresh,
  onExit,
  isDark,
  onToggleTheme,
  bg,
  border,
  muted,
  accent,
  soft,
  text,
  buttonBg,
  buttonText,
  buttonHoverBg,
}: NavigationSidebarProps) {
  return (
    <Box
      borderRadius="30px"
      p={6}
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      minH={{ base: "auto", xl: "calc(100vh - 40px)" }}
    >
      <Stack justify="space-between" h="100%">
        <Stack gap={8}>
          <Box>
            <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
              ULGEN
            </Text>
            <Text mt={3} fontSize="2xl" fontWeight="bold">
              Sovereign Ops
            </Text>
            <Text mt={3} color={muted} lineHeight="1.7">
              Local operator surface for discovery, control, and future multi-cloud workflows.
            </Text>
          </Box>

          <Stack gap={3}>
            <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
              Sections
            </Text>
            <Button
              justifyContent="start"
              borderRadius="full"
              bg={buttonBg}
              color={buttonText}
              borderWidth="1px"
              borderColor={border}
              _hover={{ bg: buttonHoverBg }}
            >
              Resources
            </Button>
            <Button
              justifyContent="start"
              borderRadius="full"
              bg={buttonBg}
              color={buttonText}
              borderWidth="1px"
              borderColor={border}
              _hover={{ bg: buttonHoverBg }}
            >
              Activity
            </Button>
            <Button
              justifyContent="start"
              borderRadius="full"
              bg={buttonBg}
              color={buttonText}
              borderWidth="1px"
              borderColor={border}
              _hover={{ bg: buttonHoverBg }}
            >
              Terminal
            </Button>
          </Stack>
        </Stack>

        <Stack gap={3} mt={8}>
          <Button
            borderRadius="full"
            bg={buttonBg}
            color={buttonText}
            borderWidth="1px"
            borderColor={border}
            _hover={{ bg: buttonHoverBg }}
            onClick={() => void onRefresh()}
          >
            Rescan AWS
          </Button>
          <Button
            borderRadius="full"
            bg={buttonBg}
            color={buttonText}
            borderWidth="1px"
            borderColor={border}
            _hover={{ bg: buttonHoverBg }}
            onClick={onToggleTheme}
          >
            {isDark ? "Light mode" : "Dark mode"}
          </Button>
          <Button variant="ghost" borderRadius="full" color={text} _hover={{ bg: soft }} onClick={onExit}>
            Welcome screen
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
