import { Flex, HStack, Text, IconButton, Box, VStack, Heading, Circle, Portal, Input, Button, Badge, SimpleGrid, Icon, Stack } from "@chakra-ui/react";
import { Search, Bell, Sun, Moon, Globe, ChevronDown, Settings, Key, Check, Trash2, UserPlus, X, Home, Server, Shield } from "lucide-react";
import { useColorMode } from "./color-mode";
import { useConfigStore, CloudProfile } from "@/store/useConfigStore";
import { StatusBadge } from "./StatusBadge";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = (motion as any).create ? (motion as any).create(Box) : motion(Box);

export function AppHeader() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { 
    activeRegion, 
    setActiveRegion, 
    credentialSummary,
    availableRegions,
    setShowAccountSettings
  } = useConfigStore();
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showRegionMenu, setShowRegionMenu] = useState(false);

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

  const regionsToDisplay = availableRegions.length > 0 ? availableRegions : ["us-east-1", "us-west-2", "eu-central-1", "eu-west-1", "ap-southeast-1"];

  const NAV_LINKS = [
    { label: "Dashboard", path: "/app/home", icon: Home },
    { label: "Inventory", path: "/app/servers", icon: Server },
    { label: "Security", path: "/app/security", icon: Shield },
  ];

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
        <Box w="300px">
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
            <Search size={14} color="var(--chakra-colors-fg-muted)" />
            <Box 
              as="input" 
              ref={searchInputRef}
              flex="1"
              bg="transparent"
              outline="none"
              {...({ 
                placeholder: "Quick Search Hub...",
                style: { fontSize: '13px', border: 'none', background: 'transparent', color: 'inherit' } 
              } as any)}
            />
          </HStack>
        </Box>
      </HStack>

      <HStack gap="4">
        {/* Region Switcher */}
        <Box position="relative">
          <HStack 
            gap="3" 
            px="4" 
            py="2" 
            bg="bg.muted" 
            borderRadius="2xl" 
            border="1px solid" 
            borderColor={showRegionMenu ? "blue.500" : "border.muted"} 
            cursor="pointer"
            _hover={{ bg: "bg.subtle", borderColor: "blue.500" }}
            onClick={() => {
              setShowRegionMenu(!showRegionMenu);
            }}
          >
            <Globe size={16} color="var(--chakra-colors-fg-muted)" />
            <VStack align="flex-start" gap="0">
              <Text fontSize="8px" color="fg.muted" fontWeight="bold" letterSpacing="0.1em">REGION</Text>
              <Text fontSize="xs" fontWeight="extrabold" color="blue.500">{activeRegion || "INIT"}</Text>
            </VStack>
            <ChevronDown size={14} color="var(--chakra-colors-fg-muted)" />
          </HStack>

          <AnimatePresence>
            {showRegionMenu && (
              <MotionBox
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 4, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                position="absolute"
                top="full"
                right="0"
                minW="200px"
                bg="bg.panel"
                p="2"
                borderRadius="2xl"
                border="1px solid"
                borderColor="border.muted"
                boxShadow="2xl"
                zIndex="100"
              >
                <VStack align="stretch" gap="1">
                  <Text px="3" py="2" fontSize="10px" fontWeight="black" color="fg.muted" letterSpacing="0.1em">LIVE REGIONS</Text>
                  {regionsToDisplay.map((region) => (
                    <HStack 
                      key={region}
                      px="3" 
                      py="2" 
                      borderRadius="xl" 
                      cursor="pointer" 
                      _hover={{ bg: "blue.500/10", color: "blue.400" }}
                      bg={activeRegion === region ? "blue.500/5" : "transparent"}
                      onClick={() => {
                        setActiveRegion(region);
                        setShowRegionMenu(false);
                      }}
                      justify="space-between"
                    >
                      <Text fontSize="sm" fontWeight="bold">{region}</Text>
                      {activeRegion === region && <Check size={14} color="var(--chakra-colors-blue-400)" />}
                    </HStack>
                  ))}
                </VStack>
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>

        <HStack gap="1">
          <IconButton variant="ghost" aria-label="Notifications" size="md" borderRadius="xl" color="fg.muted" _hover={{ color: "fg", bg: "bg.muted" }}>
            <Bell size={20} />
          </IconButton>
          <IconButton variant="ghost" aria-label="Toggle Theme" size="md" borderRadius="xl" color="fg.muted" _hover={{ color: "fg", bg: "bg.muted" }} onClick={toggleColorMode}>
            {colorMode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
          <IconButton 
            variant="ghost" 
            aria-label="Account Settings" 
            size="md" 
            borderRadius="xl" 
            color="fg.muted" 
            _hover={{ color: "fg", bg: "bg.muted" }} 
            onClick={() => setShowAccountSettings(true)}
          >
            <Settings size={20} />
          </IconButton>
        </HStack>
      </HStack>
    </Flex>
  );
}
