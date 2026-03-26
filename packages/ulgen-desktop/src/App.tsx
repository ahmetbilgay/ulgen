import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import { AppShell } from "@/layouts/AppShell";
import { HomeView } from "@/views/HomeView";
import { InventoryView } from "@/views/InventoryView";
import { InstanceDetailView } from "@/views/InstanceDetailView";
import { SecurityView } from "@/views/SecurityView";
import { IdentityVaultView } from "@/views/IdentityVaultView";
import { useConfigStore } from "@/store/useConfigStore";
import { useEffect, useState } from "react";

/**
 * Root Application Component
 * Manages high-level routing and initialization state.
 * Discord-style: No onboarding page, always boot into the main shell.
 */
export function App() {
  const { hydrateCredentialSummary } = useConfigStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    hydrateCredentialSummary().finally(() => {
      setIsInitialized(true);
    });
  }, [hydrateCredentialSummary]);

  if (!isInitialized) return null;

  return (
    <HashRouter>
      <Routes>
        {/* Always redirect to the main app hub */}
        <Route path="/" element={<Navigate to="/app/home" replace />} />
        
        {/* Main application shell - Unified Workspace */}
        <Route path="/app" element={<AppShell />}>
          <Route path="home" element={<HomeView />} />
          <Route path="servers" element={<InventoryView />} />
          <Route path="servers/:id" element={<InstanceDetailView />} />
          <Route path="security" element={<SecurityView />} />
          <Route path="identity" element={<IdentityVaultView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/app/home" replace />} />
      </Routes>
    </HashRouter>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <Box p="10" textAlign="center" border="1px dashed" borderColor="border" borderRadius="3xl" bg="bg.panel/50">
      <Text fontWeight="bold" fontSize="lg" mb="2">{title}</Text>
      <Text color="fg.muted">This module is currently under development.</Text>
    </Box>
  );
}
