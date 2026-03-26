import { Box, Flex } from "@chakra-ui/react";
import { Sidebar } from "@/components/ui/Sidebar";
import { AppHeader } from "@/components/ui/AppHeader";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function AppShell() {
  const location = useLocation();

  return (
    <Flex h="100vh" bg="bg.panel" overflow="hidden">
      <Sidebar />
      <Flex direction="column" flex="1" overflow="hidden">
        <AppHeader />
        <Box as="main" flex="1" overflowY="auto" p="6" position="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Flex>
    </Flex>
  );
}
