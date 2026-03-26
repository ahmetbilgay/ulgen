import { Flex, HStack, Text, IconButton, Box, VStack, Heading } from "@chakra-ui/react";
import { Search, Bell, Sun, Moon, Globe, ChevronDown, Settings } from "lucide-react";
import { useColorMode } from "./color-mode";
import { useConfigStore } from "@/store/useConfigStore";
import { StatusBadge } from "./StatusBadge";
import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";

/**
 * Premium Application Header
 * Includes global search with ⌘K focus, system breadcrumbs, and environment status.
 */
export function AppHeader() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { activeRegion, connectionStatus, credentialBusy, setActiveRegion } = useConfigStore();
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumb = pathSegments.length > 1 ? pathSegments[1] : "home";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Flex
      as="header"
      h="20"
      px="8"
      align="center"
      justify="space-between"
      borderBottomWidth="1px"
      borderColor="border.muted"
      bg="bg.panel/80"
      backdropFilter="blur(10px)"
      position="sticky"
      top="0"
      zIndex="50"
    >
      <HStack gap="10" flex="1">
        <VStack align="flex-start" gap="0">
          <Text fontSize="xs" fontWeight="bold" color="blue.500" letterSpacing="0.1em">
            NODE_OPERATOR
          </Text>
          <HStack gap="2">
            <Heading size="md" fontWeight="bold">Global Operational Mesh</Heading>
          </HStack>
        </VStack>

        <Box w="400px">
          <HStack
            bg="bg.muted"
            px="4"
            py="2"
            borderRadius="2xl"
            border="1px solid"
            borderColor="border.muted"
            transition="all 0.2s"
            _focusWithin={{ borderColor: "blue.500", bg: "bg.subtle" }}
          >
            <Search size={16} color="var(--chakra-colors-fg-muted)" />
            <Box 
              as="input" 
              ref={searchInputRef}
              flex="1"
              bg="transparent"
              outline="none"
              {...({ 
                placeholder: "Search infrastructure (⌘K)",
                style: { fontSize: '14px', border: 'none', background: 'transparent', color: 'inherit' } 
              } as any)}
            />
            <HStack gap="1" bg="bg.subtle" px="2" py="0.5" borderRadius="lg" border="1px solid" borderColor="border.muted">
              <Text fontSize="10px" fontWeight="bold" color="fg.muted">⌘</Text>
              <Text fontSize="10px" fontWeight="bold" color="fg.muted">K</Text>
            </HStack>
          </HStack>
        </Box>
      </HStack>

      <HStack gap="4">
        <Box position="relative">
          <HStack 
            gap="3" 
            px="4" 
            py="2" 
            bg="bg.muted" 
            borderRadius="2xl" 
            border="1px solid" 
            borderColor="border.muted" 
            cursor="pointer"
            _hover={{ bg: "bg.subtle", borderColor: "blue.500" }}
            onClick={() => {
              const region = prompt("Enter AWS Region (e.g. us-east-1, eu-central-1):", activeRegion || "");
              if (region) setActiveRegion(region);
            }}
          >
            <Globe size={16} color="var(--chakra-colors-fg-muted)" />
            <VStack align="flex-start" gap="0">
              <Text fontSize="8px" color="fg.muted" fontWeight="bold" letterSpacing="0.1em">REGION</Text>
              <Text fontSize="xs" fontWeight="extrabold" color="blue.500">{activeRegion || "INITIALIZING"}</Text>
            </VStack>
            <ChevronDown size={14} color="var(--chakra-colors-fg-muted)" />
          </HStack>
        </Box>

        <HStack gap="1">
          <IconButton variant="ghost" aria-label="Notifications" size="md" borderRadius="xl" color="fg.muted" _hover={{ color: "fg", bg: "bg.muted" }}>
            <Bell size={20} />
          </IconButton>
          <IconButton variant="ghost" aria-label="Toggle Theme" size="md" borderRadius="xl" color="fg.muted" _hover={{ color: "fg", bg: "bg.muted" }} onClick={toggleColorMode}>
            {colorMode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
          <IconButton variant="ghost" aria-label="Settings" size="md" borderRadius="xl" color="fg.muted" _hover={{ color: "fg", bg: "bg.muted" }} onClick={() => navigate('/app/settings')}>
            <Settings size={20} />
          </IconButton>
        </HStack>
      </HStack>
    </Flex>
  );
}
