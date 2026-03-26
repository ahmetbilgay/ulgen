"use client";

import { Box, VStack, Text, HStack, Icon, IconButton, Circle } from "@chakra-ui/react";
import { Home, Server, Key, Shield, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const NAV_ITEMS = [
  { icon: Home, label: "Dashboard", path: "/app/home" },
  { icon: Server, label: "Inventory", path: "/app/servers" },
  { icon: Key, label: "Cloud Account", path: "/onboarding" },
  { icon: Shield, label: "Security", path: "/app/security" },
  { icon: Settings, label: "Settings", path: "/app/settings" },
];

const MotionBox = motion(Box);

/**
 * Premium Sidebar Component
 * Custom branding, immersive glassmorphism, and spring-based animations.
 */
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <MotionBox
      as="nav"
      initial={false}
      animate={{ width: isCollapsed ? "80px" : "280px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      bg="bg.panel"
      backdropFilter="blur(30px)"
      borderRightWidth="1px"
      borderColor="border.muted"
      p="6"
      display="flex"
      flexDirection="column"
      position="relative"
      zIndex="100"
    >
      {/* Branding Area */}
      <HStack mb="12" px="2" gap="3" justify={isCollapsed ? "center" : "flex-start"} overflow="hidden">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <VStack align="flex-start" gap="0">
              <Text fontSize="xl" fontWeight="900" letterSpacing="-0.05em">
                ULGEN
              </Text>
              <Text fontSize="9px" fontWeight="black" color="blue.500" letterSpacing="0.25em" transform="translateY(-3px)" textTransform="uppercase">
                Infrastructure
              </Text>
            </VStack>
          </motion.div>
        )}
      </HStack>

      {/* Navigation Items */}
      <VStack align="stretch" gap="1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} style={{ textDecoration: "none" }}>
              <HStack
                px="4"
                py="3"
                borderRadius="xl"
                bg={isActive ? "bg.muted" : "transparent"}
                color={isActive ? "blue.500" : "fg.muted"}
                _hover={{ 
                  bg: isActive ? "bg.muted" : "bg.subtle",
                  color: isActive ? "blue.500" : "fg" 
                }}
                transition="all 0.2s"
                gap="4"
                justify={isCollapsed ? "center" : "flex-start"}
                position="relative"
              >
                <Icon as={item.icon} size="sm" color={isActive ? "blue.500" : "inherit"} />
                {!isCollapsed && (
                  <Text fontSize="sm" fontWeight={isActive ? "bold" : "medium"}>{item.label}</Text>
                )}
                <AnimatePresence>
                  {isActive && !isCollapsed && (
                    <MotionBox
                      layoutId="active-indicator"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      position="absolute"
                      right="3"
                      w="1"
                      h="4"
                      bg="blue.500"
                      borderRadius="full"
                    />
                  )}
                </AnimatePresence>
              </HStack>
            </NavLink>
          );
        })}
      </VStack>

      <Box mt="auto" pt="4">
        <VStack align="stretch" gap="6">
          <IconButton
            variant="ghost"
            aria-label="Toggle Sidebar"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            alignSelf={isCollapsed ? "center" : "flex-end"}
            borderRadius="lg"
            color="fg.muted"
            _hover={{ color: "fg", bg: "bg.muted" }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </IconButton>
          
          {!isCollapsed && (
            <Box 
              p="5" 
              bg="bg.muted" 
              borderRadius="2xl" 
              border="1px solid" 
              borderColor="border.muted"
            >
              <VStack align="stretch" gap="4">
                <HStack gap="3">
                  <Box boxSize="2" bg="green.500" borderRadius="full" />
                  <Text fontSize="9px" fontWeight="black" letterSpacing="0.2em" color="fg.muted" textTransform="uppercase">Live Node</Text>
                </HStack>
                <Box h="1px" bg="border.muted" />
                <HStack justify="space-between">
                  <Text fontSize="10px" color="fg.muted" fontWeight="bold">VERSION</Text>
                  <Text fontSize="10px" fontWeight="black">2.4.0-STABLE</Text>
                </HStack>
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>
    </MotionBox>
  );
}
