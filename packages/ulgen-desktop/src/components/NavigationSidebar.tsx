import { Box, Button, Stack, Text } from "@chakra-ui/react";

type NavigationSidebarProps = {
  activeSection: "home" | "servers" | "keys" | "security";
  onSectionChange: (section: "home" | "servers" | "keys" | "security") => void;
  collapsed: boolean;
  bg: string;
  border: string;
  muted: string;
  accent: string;
  buttonBg: string;
  buttonText: string;
  buttonHoverBg: string;
};

export function NavigationSidebar({
  activeSection,
  onSectionChange,
  collapsed,
  bg,
  border,
  muted,
  accent,
  buttonBg,
  buttonText,
  buttonHoverBg,
}: NavigationSidebarProps) {
  const sections = [
    { id: "home", label: "Home" },
    { id: "servers", label: "Servers" },
    { id: "keys", label: "Keys" },
    { id: "security", label: "Security" },
  ] as const;

  return (
    <Box
      borderRadius="24px"
      p={{ base: 4, xl: 5 }}
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      minH={{ base: "auto", xl: "calc(100vh - 40px)" }}
    >
      <Stack justify="space-between" h="100%">
        <Stack gap={6}>
          <Box>
            <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
              ULGEN
            </Text>
            {!collapsed ? (
              <>
                <Text mt={2} fontSize="xl" fontWeight="bold">
                  Ops
                </Text>
                <Text mt={2} color={muted} lineHeight="1.6" fontSize="sm">
                  Servers, keys, security.
                </Text>
              </>
            ) : null}
          </Box>

          <Stack gap={3}>
            {!collapsed ? (
              <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
                Sections
              </Text>
            ) : null}
            {sections.map((section) => (
              <Button
                key={section.id}
                justifyContent={collapsed ? "center" : "start"}
                borderRadius="full"
                h="40px"
                bg={activeSection === section.id ? accent : buttonBg}
                color={activeSection === section.id ? "#071019" : buttonText}
                borderWidth="1px"
                borderColor={activeSection === section.id ? accent : border}
                _hover={{ bg: activeSection === section.id ? accent : buttonHoverBg }}
                onClick={() => onSectionChange(section.id)}
                title={section.label}
              >
                {collapsed ? section.label.slice(0, 1) : section.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
