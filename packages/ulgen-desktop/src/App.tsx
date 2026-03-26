import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import { AppShell } from "@/layouts/AppShell";
import { HomeView } from "@/views/HomeView";
import { InventoryView } from "@/views/InventoryView";
import { OnboardingView } from "@/views/OnboardingView";
import { InstanceDetailView } from "@/views/InstanceDetailView";
import { useConfigStore } from "@/store/useConfigStore";
import { useEffect, useState } from "react";

/**
 * Root Application Component
 * Manages high-level routing and initialization state.
 */
export function App() {
  const { activeRegion, connectionStatus, hydrateCredentialSummary, credentialSummary } = useConfigStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    hydrateCredentialSummary().finally(() => {
      setIsInitialized(true);
    });
  }, [hydrateCredentialSummary]);

  if (!isInitialized) return null;

  const hasCredentials = credentialSummary?.is_configured || !!activeRegion || connectionStatus?.ok;

  return (
    <HashRouter>
      <Routes>
        {/* entry point */}
        <Route path="/" element={<Navigate to={hasCredentials ? "/app/home" : "/onboarding"} replace />} />
        
        {/* onboarding flow */}
        <Route path="/onboarding" element={<OnboardingView />} />
        
        {/* main application shell */}
        <Route path="/app" element={<AppShell />}>
          <Route path="home" element={<HomeView />} />
          <Route path="servers" element={<InventoryView />} />
          <Route path="servers/:id" element={<InstanceDetailView />} />
          
          {/* placeholders for future modules */}
          <Route path="keys" element={<Placeholder title="SSH Key Management" />} />
          <Route path="security" element={<Placeholder title="Security Group Inspector" />} />
          <Route path="settings" element={<Placeholder title="System Preferences" />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/app/home" replace />} />
      </Routes>
    </HashRouter>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <Box p="10" textAlign="center" border="1px dashed" borderColor="border" borderRadius="3xl" bg="whiteAlpha.50">
      <Text fontWeight="bold" fontSize="lg" mb="2">{title}</Text>
      <Text color="muted">This module is currently under development.</Text>
    </Box>
  );
}
