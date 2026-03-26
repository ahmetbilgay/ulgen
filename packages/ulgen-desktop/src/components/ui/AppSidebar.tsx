import { Box, VStack, Text, HStack, Icon, IconButton, Circle } from "@chakra-ui/react";
import { Home, Server, Key, Shield, Settings, ChevronLeft, ChevronRight, Zap, Database, Terminal, Activity, Lock } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useConfigStore } from "@/store/useConfigStore";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = (motion as any).create ? (motion as any).create(Box) : motion(Box);

const CORE_APPS = [
  { icon: Activity, label: "Operations", path: "/app/home" },
  { icon: Server, label: "Compute Center", path: "/app/servers" },
  { icon: Shield, label: "Security Watchtower", path: "/app/security" },
  { icon: Lock, label: "Identity Vault", path: "/app/identity" },
];

/**
 * AppSidebar (L2 Navigation)
 * Displays "Apps" available for the active cloud identity.
 */
export function AppSidebar() {
  const location = useLocation();
  const { credentialSummary, profiles } = useConfigStore();
  
  if (profiles.length === 0) return null;

  const activeProfile = profiles.find(p => p.name === credentialSummary?.account_name);
  const providerSymbol = activeProfile?.provider === 'aws' ? 'AWS' : 'GCP';

  return (
    <Box 
      w="240px" 
      h="100vh" 
      bg="bg.panel/50" 
      borderRight="1px solid" 
      borderColor="border.muted"
      p="6"
      display="flex"
      flexDirection="column"
      zIndex="90"
    >
      <VStack align="stretch" gap="10">
        {/* Header/Context label */}
        <VStack align="flex-start" gap="0">
          <Text fontSize="10px" fontWeight="black" color="blue.500" letterSpacing="0.2em" textTransform="uppercase">
            {providerSymbol} WORKSPACE
          </Text>
          <Text fontSize="lg" fontWeight="black" truncate maxW="full">
            {credentialSummary?.account_name || "Development"}
          </Text>
        </VStack>

        {/* Categories/Apps */}
        <VStack align="stretch" gap="6">
           <VStack align="stretch" gap="1">
             <Text fontSize="9px" fontWeight="black" color="fg.muted" letterSpacing="0.1em" mb="2" textTransform="uppercase">Core Services</Text>
             {CORE_APPS.map(app => {
               const isActive = location.pathname === app.path;
               return (
                 <NavLink key={app.path} to={app.path} style={{ textDecoration: 'none' }}>
                   <HStack 
                     px="3" 
                     py="2.5" 
                     borderRadius="xl" 
                     bg={isActive ? "blue.500/10" : "transparent"} 
                     color={isActive ? "blue.400" : "fg.muted"}
                     _hover={{ color: "fg", bg: "bg.muted" }}
                     transition="all 0.2s"
                     gap="3"
                   >
                     <app.icon size={16} />
                     <Text fontSize="sm" fontWeight={isActive ? "900" : "bold"}>{app.label}</Text>
                   </HStack>
                 </NavLink>
               );
             })}
           </VStack>

           <VStack align="stretch" gap="1">
             <Text fontSize="9px" fontWeight="black" color="fg.muted" letterSpacing="0.1em" mb="2" textTransform="uppercase">Fleet Management</Text>
             <HStack 
               px="3" 
               py="2" 
               borderRadius="xl" 
               color="fg.muted"
               opacity="0.5"
               cursor="not-allowed"
               gap="3"
             >
               <Database size={16} />
               <Text fontSize="sm" fontWeight="bold">Cloud Databases</Text>
             </HStack>
             <HStack 
               px="3" 
               py="2" 
               borderRadius="xl" 
               color="fg.muted"
               opacity="0.5"
               cursor="not-allowed"
               gap="3"
             >
               <Zap size={16} />
               <Text fontSize="sm" fontWeight="bold">Serverless</Text>
             </HStack>
           </VStack>
        </VStack>
      </VStack>

      <Box mt="auto">
         <Box p="4" bg="bg.muted" borderRadius="2xl" border="1px solid" borderColor="border.muted">
           <VStack align="stretch" gap="2">
              <HStack justify="space-between">
                <Text fontSize="xs" fontWeight="black">Node Status</Text>
                <Box boxSize="2" bg="green.500" borderRadius="full" boxSizing="border-box" border="2px solid white" />
              </HStack>
              <Text fontSize="10px" color="fg.muted">Production Environment linked to us-east-1</Text>
           </VStack>
         </Box>
      </Box>
    </Box>
  );
}
