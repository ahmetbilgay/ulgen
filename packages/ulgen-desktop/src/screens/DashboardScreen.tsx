import { invoke } from "@tauri-apps/api/core";
import { Box, Button, Flex, Grid, GridItem, Heading, HStack, IconButton, SimpleGrid, Stack, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CommandPalette } from "../components/CommandPalette";
import { InspectorPanel } from "../components/InspectorPanel";
import { NavigationSidebar } from "../components/NavigationSidebar";
import { ProviderModal } from "../components/ProviderModal";
import { ResourceTable } from "../components/ResourceTable";
import { TerminalPanel } from "../components/TerminalPanel";
import { ThemeIcon } from "../components/ThemeIcon";
import { useAppPalette } from "../hooks/useAppPalette";
import { useAuth } from "../hooks/useAuth";
import { useAws } from "../hooks/useAws";
import { useTerminal } from "../hooks/useTerminal";
import { useCommandPaletteStore } from "../store/useCommandPaletteStore";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

export function DashboardScreen() {
  const palette = useAppPalette();
  const { signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [serverView, setServerView] = useState<"list" | "detail">("list");
  const [instanceActionBusy, setInstanceActionBusy] = useState(false);
  const [instanceActionNotice, setInstanceActionNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const params = useParams();
  const isOpen = useCommandPaletteStore((state) => state.isOpen);
  const open = useCommandPaletteStore((state) => state.open);
  const close = useCommandPaletteStore((state) => state.close);

  const {
    activeSection,
    setActiveSection,
    selectedProvider,
    isProviderModalOpen,
    providerModalStep,
    credentialSummary,
    credentialForm,
    credentialNotice,
    connectionStatus,
    credentialBusy,
    activeRegion,
    setActiveRegion,
    selectedInstanceId,
    sshUsername,
    preparedCommand,
    terminalNotice,
    terminalBusy,
    setCredentialForm,
    setSelectedInstanceId,
    setSshUsername,
    openProviderModal,
    closeProviderModal,
    openAwsConnectionStep,
    setProviderModalStep,
    hydrateCredentialSummary,
    connectProvider,
    clearCredentials,
    prepareTerminal,
  } = useWorkspaceStore();

  const routeSection = params.section;
  const validSections = ["home", "servers", "keys", "security"] as const;
  const normalizedSection = validSections.find((section) => section === routeSection);
  const isValidSection = Boolean(normalizedSection);

  useEffect(() => {
    if (normalizedSection && normalizedSection !== activeSection) {
      setActiveSection(normalizedSection);
    }
  }, [activeSection, normalizedSection, setActiveSection]);

  if (!isValidSection) {
    return <Navigate to="/app/home" replace />;
  }

  const hasAwsProvider = Boolean(credentialSummary?.is_configured);
  const awsEnabled = selectedProvider === "aws" && hasAwsProvider && activeSection === "servers";
  const { data, isLoading, error, refresh } = useAws(awsEnabled);

  useEffect(() => {
    void hydrateCredentialSummary();
  }, [hydrateCredentialSummary]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, isOpen, open]);

  useEffect(() => {
    if (!data?.instances.length) {
      setSelectedInstanceId(null);
      setServerView("list");
      return;
    }

    if (!selectedInstanceId || !data.instances.some((instance) => instance.id === selectedInstanceId)) {
      setSelectedInstanceId(data.instances[0].id);
    }
  }, [data, selectedInstanceId, setSelectedInstanceId]);

  useEffect(() => {
    if (activeSection !== "servers") {
      setServerView("list");
    }
  }, [activeSection]);

  const selectedInstance = useMemo(() => {
    return data?.instances.find((instance) => instance.id === selectedInstanceId) ?? null;
  }, [data, selectedInstanceId]);

  useEffect(() => {
    if (!data?.regions_scanned.length) {
      return;
    }

    if (!activeRegion || !data.regions_scanned.includes(activeRegion)) {
      setActiveRegion(data.regions_scanned[0]);
    }
  }, [activeRegion, data, setActiveRegion]);

  const filteredInstances = useMemo(() => {
    if (!data?.instances.length) {
      return [];
    }

    if (!activeRegion) {
      return data.instances;
    }

    return data.instances.filter((instance) => instance.region === activeRegion);
  }, [activeRegion, data]);

  const instanceCount = data?.instances.length ?? 0;
  const regionCount = data?.regions_scanned.length ?? 0;
  const terminal = useTerminal(selectedInstance, sshUsername);

  async function handleInstanceAction(action: "start" | "stop") {
    if (!selectedInstance) {
      return;
    }

    setInstanceActionBusy(true);
    setInstanceActionNotice(null);

    try {
      await invoke(action === "start" ? "start_instance" : "stop_instance", {
        region: selectedInstance.region,
        instanceId: selectedInstance.id,
      });
      setInstanceActionNotice(
        action === "start"
          ? `Start request sent for ${selectedInstance.name}.`
          : `Stop request sent for ${selectedInstance.name}.`,
      );
      await refresh();
    } catch (cause) {
      setInstanceActionNotice(cause instanceof Error ? cause.message : `Failed to ${action} instance.`);
    } finally {
      setInstanceActionBusy(false);
    }
  }

  async function handleCopyCommand() {
    if (!preparedCommand) {
      return;
    }

    try {
      await navigator.clipboard.writeText(preparedCommand);
    } catch {
      // Ignore clipboard failures for now; the command is still visible.
    }
  }

  return (
    <Box minH="100vh" bg={palette.pageBg} color={palette.text} p={{ base: 4, md: 5 }}>
      <Grid templateColumns={{ base: "1fr", xl: sidebarCollapsed ? "76px 1fr" : "220px 1fr" }} gap={4}>
        <GridItem display={{ base: "none", xl: "block" }}>
          <NavigationSidebar
            activeSection={activeSection}
            onSectionChange={(section) => navigate(`/app/${section}`)}
            collapsed={sidebarCollapsed}
            bg={palette.chrome}
            border={palette.border}
            muted={palette.muted}
            accent={palette.accent}
            buttonBg={palette.navButtonBg}
            buttonText={palette.navButtonText}
            buttonHoverBg={palette.navButtonHover}
          />
        </GridItem>

        <GridItem>
          <Stack gap={5}>
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              px={{ base: 4, md: 5 }}
              py={3}
              bg={palette.chrome}
              borderWidth="1px"
              borderColor={palette.border}
              borderRadius="20px"
            >
              <HStack gap={3}>
                <IconButton
                  aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                  borderRadius="full"
                  variant="outline"
                  onClick={() => setSidebarCollapsed((current) => !current)}
                >
                  <Box as="span" display="inline-flex" alignItems="center" justifyContent="center" w="16px" h="16px">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M2 4.5H14M2 8H14M2 11.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </Box>
                </IconButton>
                <Stack gap={0.5}>
                  <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={palette.accent}>
                    Dashboard
                  </Text>
                  <Text fontWeight="semibold">
                    {activeSection === "home"
                      ? "Home"
                      : activeSection === "servers"
                        ? "Servers"
                        : activeSection === "keys"
                          ? "Keys"
                          : "Security"}
                  </Text>
                </Stack>
              </HStack>

              <HStack gap={2}>
                {hasAwsProvider ? (
                  <Box
                    as="label"
                    display="flex"
                    alignItems="center"
                    px={4}
                    h="40px"
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor={palette.border}
                    bg={palette.panel}
                  >
                    <select
                      value={activeRegion ?? ""}
                      onChange={(event) => setActiveRegion(event.target.value)}
                      style={{
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: "inherit",
                        font: "inherit",
                        width: "100%",
                      }}
                    >
                      {(data?.regions_scanned.length ? data.regions_scanned : [credentialSummary?.default_region ?? "us-east-1"]).map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </Box>
                ) : null}
                <IconButton aria-label="Toggle theme" borderRadius="full" variant="outline" onClick={palette.toggleTheme}>
                  <ThemeIcon mode={palette.isDark ? "light" : "dark"} />
                </IconButton>
                <Button borderRadius="full" variant="outline" onClick={openProviderModal}>
                  Providers
                </Button>
                <Button borderRadius="full" variant="outline" onClick={signOut}>
                  Sign out
                </Button>
              </HStack>
            </Flex>

            <Flex justify="space-between" align={{ base: "start", lg: "center" }} gap={4} wrap="wrap">
              <Stack gap={3}>
                <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={palette.accent}>
                  Workspace
                </Text>
                <Heading fontSize={{ base: "3xl", md: "4xl" }} lineHeight="0.98" letterSpacing="-0.05em">
                  {!hasAwsProvider
                    ? "Add a provider"
                    : activeSection === "home"
                    ? "Workspace home"
                      : activeSection === "servers"
                        ? "Server management"
                        : activeSection === "keys"
                          ? "Key management"
                      : "Security groups"}
                </Heading>
                <Text maxW="3xl" color={palette.muted}>
                  {!hasAwsProvider
                    ? "Connect AWS to start managing infrastructure."
                    : activeSection === "home"
                      ? "Start here for connection health, inventory status, and quick actions."
                      : activeSection === "servers"
                        ? "Inspect EC2 inventory, choose a machine, and prepare access."
                        : activeSection === "keys"
                          ? "Review provider credentials and access setup."
                      : "Track security-group actions and network posture."}
                </Text>
              </Stack>

              <HStack gap={3} wrap="wrap">
                {hasAwsProvider ? <WorkspaceStat label="Provider" value="AWS" panel={palette.panel} border={palette.border} muted={palette.muted} /> : null}
                {hasAwsProvider ? <WorkspaceStat label="Region" value={activeRegion ?? credentialSummary?.default_region ?? "n/a"} panel={palette.panel} border={palette.border} muted={palette.muted} /> : null}
                {hasAwsProvider ? <WorkspaceStat label="Instances" value={String(instanceCount)} panel={palette.panel} border={palette.border} muted={palette.muted} /> : null}
                {hasAwsProvider ? <WorkspaceStat label="Regions" value={String(regionCount)} panel={palette.panel} border={palette.border} muted={palette.muted} /> : null}
                <Button
                  borderRadius="full"
                  px={5}
                  bg={palette.ctaBg}
                  color={palette.ctaText}
                  _hover={{ bg: palette.ctaHover }}
                  onClick={hasAwsProvider ? () => void refresh() : openProviderModal}
                >
                  {hasAwsProvider ? "Refresh Instances" : "Add provider"}
                </Button>
              </HStack>
            </Flex>

            {!hasAwsProvider ? (
              <EmptyProviderState panel={palette.panel} border={palette.border} muted={palette.muted} accent={palette.accent} onAddProvider={openProviderModal} />
            ) : null}

            {hasAwsProvider && activeSection === "home" ? (
              <HomeSection
                panel={palette.panel}
                border={palette.border}
                muted={palette.muted}
                accent={palette.accent}
                region={credentialSummary?.default_region ?? "n/a"}
                instanceCount={instanceCount}
                regionCount={regionCount}
                connectionMessage={connectionStatus?.message ?? "Connected to AWS successfully."}
                providerPreview={credentialSummary?.access_key_preview ?? "AWS connected"}
                activeRegion={activeRegion ?? credentialSummary?.default_region ?? "n/a"}
                selectedInstance={selectedInstance}
                preparedCommand={preparedCommand}
                onOpenServers={() => navigate("/app/servers")}
                onOpenKeys={() => navigate("/app/keys")}
                onOpenSecurity={() => navigate("/app/security")}
                onRefresh={() => void refresh()}
                onManageProviders={openProviderModal}
              />
            ) : null}

            {hasAwsProvider && activeSection === "servers" ? (
              serverView === "list" ? (
                <Stack gap={5}>
                  <Box borderRadius="24px" p={5} bg={palette.panel} borderWidth="1px" borderColor={palette.border}>
                    <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={palette.accent}>
                      Servers
                    </Text>
                    <Heading mt={2} size="lg">
                      Pick a server to inspect and connect
                    </Heading>
                    <Text mt={3} color={palette.muted} lineHeight="1.7">
                      Start from the cards below. Choose a machine in the active region, then open the detail screen for status, metadata, and SSH access.
                    </Text>
                  </Box>

                  <ResourceTable
                    data={data}
                    instances={filteredInstances}
                    activeRegion={activeRegion}
                    isLoading={isLoading}
                    error={error}
                    bg={palette.panel}
                    border={palette.border}
                    muted={palette.muted}
                    selectedInstanceId={selectedInstanceId}
                    onSelectInstance={(instanceId) => {
                      setSelectedInstanceId(instanceId);
                      setServerView("detail");
                    }}
                  />
                </Stack>
              ) : (
                <Stack gap={5}>
                  <HStack justify="space-between" align={{ base: "start", md: "center" }} wrap="wrap">
                    <Stack gap={2}>
                      <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={palette.accent}>
                        Server detail
                      </Text>
                      <Heading size="lg">{selectedInstance?.name ?? "Selected server"}</Heading>
                      <Text color={palette.muted}>
                        Review live details, operate the instance, then prepare SSH access from the same screen.
                      </Text>
                    </Stack>
                    <Button borderRadius="full" variant="outline" onClick={() => setServerView("list")}>
                      Back to servers
                    </Button>
                  </HStack>

                  <Grid templateColumns={{ base: "1fr", "2xl": "1.05fr 0.95fr" }} gap={5}>
                    <GridItem>
                      <VStack align="stretch" gap={5}>
                        <InspectorPanel
                          data={data}
                          selectedInstance={selectedInstance}
                          actionBusy={instanceActionBusy}
                          actionNotice={instanceActionNotice}
                          onStart={() => void handleInstanceAction("start")}
                          onStop={() => void handleInstanceAction("stop")}
                          bg={palette.panel}
                          border={palette.border}
                          muted={palette.muted}
                          accent={palette.accent}
                        />
                      </VStack>
                    </GridItem>
                    <GridItem>
                      <TerminalPanel
                        selectedInstance={selectedInstance}
                        sshUsername={sshUsername}
                        onUsernameChange={setSshUsername}
                        terminalInput={terminal.input}
                        onTerminalInputChange={terminal.setInput}
                        onConnect={() => void terminal.connect()}
                        onDisconnect={() => void terminal.disconnect()}
                        onSend={() => void terminal.send()}
                        onCopyCommand={() => void handleCopyCommand()}
                        preparedCommand={preparedCommand}
                        terminalOutput={terminal.output}
                        terminalNotice={terminal.notice ?? terminalNotice}
                        bg={palette.panel}
                        border={palette.border}
                        muted={palette.muted}
                        accent={palette.accent}
                        busy={terminal.isConnecting || terminalBusy}
                        isRunning={terminal.isRunning}
                        hasSession={terminal.hasSession}
                      />
                    </GridItem>
                  </Grid>
                </Stack>
              )
            ) : null}

            {hasAwsProvider && activeSection === "keys" ? (
              <KeysSection
                panel={palette.panel}
                border={palette.border}
                muted={palette.muted}
                summary={credentialSummary?.access_key_preview ?? "Not connected"}
                region={credentialSummary?.default_region ?? "n/a"}
                onManageProvider={openProviderModal}
                onClearCredentials={clearCredentials}
                busy={credentialBusy}
              />
            ) : null}

            {hasAwsProvider && activeSection === "security" ? (
              <SecuritySection panel={palette.panel} border={palette.border} muted={palette.muted} accent={palette.accent} />
            ) : null}
          </Stack>
        </GridItem>
      </Grid>

      <CommandPalette bg={palette.panel} border={palette.border} muted={palette.muted} soft={palette.soft} />

      {isProviderModalOpen ? (
        <ProviderModal
          panel={palette.panel}
          shell={palette.chrome}
          border={palette.border}
          muted={palette.muted}
          accent={palette.accent}
          soft={palette.soft}
          primaryButtonBg={palette.ctaBg}
          primaryButtonHover={palette.ctaHover}
          primaryButtonText={palette.ctaText}
          secondaryButtonBg={palette.subtleBg}
          secondaryButtonText={palette.subtleText}
          providerModalStep={providerModalStep}
          onClose={closeProviderModal}
          onSelectAws={openAwsConnectionStep}
          credentialForm={credentialForm}
          onCredentialChange={setCredentialForm}
          credentialSummary={credentialSummary}
          credentialNotice={credentialNotice}
          onConnect={connectProvider}
          busy={credentialBusy}
        />
      ) : null}
    </Box>
  );
}

type HomeSectionProps = {
  panel: string;
  border: string;
  muted: string;
  accent: string;
  providerPreview: string;
  activeRegion: string;
  region: string;
  instanceCount: number;
  regionCount: number;
  connectionMessage: string;
  selectedInstance: { name: string } | null;
  preparedCommand: string | null;
  onOpenServers: () => void;
  onOpenKeys: () => void;
  onOpenSecurity: () => void;
  onRefresh: () => void;
  onManageProviders: () => void;
};

function HomeSection({
  panel,
  border,
  muted,
  accent,
  providerPreview,
  activeRegion,
  region,
  instanceCount,
  regionCount,
  connectionMessage,
  selectedInstance,
  preparedCommand,
  onOpenServers,
  onOpenKeys,
  onOpenSecurity,
  onRefresh,
  onManageProviders,
}: HomeSectionProps) {
  return (
    <Stack gap={5}>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <StatusCard
          panel={panel}
          border={border}
          muted={muted}
          label="Provider"
          value={providerPreview}
          detail={`AWS connected · region ${activeRegion}`}
        />
        <StatusCard
          panel={panel}
          border={border}
          muted={muted}
          label="Inventory"
          value={`${instanceCount} instances`}
          detail={`${regionCount} region scanned · default ${region}`}
        />
        <StatusCard
          panel={panel}
          border={border}
          muted={muted}
          label="Connection"
          value={preparedCommand ? "SSH ready" : "Connected"}
          detail={preparedCommand ? `Prepared for ${selectedInstance?.name ?? "selected instance"}` : connectionMessage}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5}>
        <Box borderRadius="28px" p={6} bg={panel} borderWidth="1px" borderColor={border}>
          <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
            Quick actions
          </Text>
          <Heading mt={2} size="lg">
            Start from the right place
          </Heading>
          <Text mt={4} color={muted} lineHeight="1.8">
            ULGEN keeps the daily flow simple: check provider and region, jump into servers, then prepare access or security work from there.
          </Text>
          <Stack mt={5} gap={3}>
            <Button borderRadius="full" justifyContent="start" onClick={onOpenServers}>
              Open server management
            </Button>
            <Button borderRadius="full" justifyContent="start" variant="outline" onClick={onOpenKeys}>
              Open key management
            </Button>
            <Button borderRadius="full" justifyContent="start" variant="outline" onClick={onOpenSecurity}>
              Open security groups
            </Button>
          </Stack>
        </Box>

        <Box borderRadius="28px" p={6} bg={panel} borderWidth="1px" borderColor={border}>
          <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
            Quick guide
          </Text>
          <Heading mt={2} size="lg">
            How this app works
          </Heading>
          <Stack mt={5} gap={3}>
            <InstructionRow border={border} step="1" text="Use Providers to change credentials, switch account, or update the default region." />
            <InstructionRow border={border} step="2" text="Pick the active region from the top bar to focus on one environment." />
            <InstructionRow border={border} step="3" text="Open Servers to inspect cards, click one server, and connect from the detail panel." />
          </Stack>
          <HStack mt={5} gap={3} wrap="wrap">
            <Button borderRadius="full" onClick={onRefresh}>
              Refresh inventory
            </Button>
            <Button borderRadius="full" variant="outline" onClick={onManageProviders}>
              Manage provider
            </Button>
          </HStack>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}

type StatusCardProps = {
  panel: string;
  border: string;
  muted: string;
  label: string;
  value: string;
  detail: string;
};

function StatusCard({ panel, border, muted, label, value, detail }: StatusCardProps) {
  return (
    <Box borderRadius="24px" p={5} bg={panel} borderWidth="1px" borderColor={border}>
      <Text color={muted} textTransform="uppercase" letterSpacing="0.14em" fontSize="xs">
        {label}
      </Text>
      <Heading mt={3} fontSize="xl">
        {value}
      </Heading>
      <Text mt={3} color={muted} lineHeight="1.7">
        {detail}
      </Text>
    </Box>
  );
}

type EmptyProviderStateProps = {
  panel: string;
  border: string;
  muted: string;
  accent: string;
  onAddProvider: () => void;
};

function EmptyProviderState({ panel, border, muted, accent, onAddProvider }: EmptyProviderStateProps) {
  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5}>
      <Box borderRadius="30px" p={{ base: 6, md: 8 }} bg={panel} borderWidth="1px" borderColor={border}>
        <Stack gap={6} align={{ base: "start", md: "center" }} textAlign={{ base: "left", md: "center" }}>
          <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
            Provider setup
          </Text>
          <Heading size="lg">Add AWS and start.</Heading>
          <Text maxW="34rem" color={muted} lineHeight="1.8">
            Keep the first step simple: connect a provider, then manage servers, keys, and security from the same dashboard.
          </Text>
          <Button borderRadius="full" onClick={onAddProvider}>
            Add provider
          </Button>
          <HStack gap={2} wrap="wrap" color={muted} fontSize="sm">
            <Text>Servers</Text>
            <Text>•</Text>
            <Text>Keys</Text>
            <Text>•</Text>
            <Text>Security</Text>
          </HStack>
        </Stack>
      </Box>

      <Box borderRadius="30px" p={{ base: 6, md: 8 }} bg={panel} borderWidth="1px" borderColor={border}>
        <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
          How to get AWS keys
        </Text>
        <Heading mt={2} size="lg">
          Grab credentials once, then paste them into ULGEN
        </Heading>
        <Stack mt={5} gap={3}>
          <InstructionRow border={border} step="1" text="Open AWS Console and go to IAM." />
          <InstructionRow border={border} step="2" text="Create or select a user with EC2 read/manage permissions." />
          <InstructionRow border={border} step="3" text="Open Security credentials and create an access key." />
          <InstructionRow border={border} step="4" text="Copy Access key ID and Secret access key into the provider modal." />
        </Stack>
      </Box>
    </SimpleGrid>
  );
}

type KeysSectionProps = {
  panel: string;
  border: string;
  muted: string;
  summary: string;
  region: string;
  onManageProvider: () => void;
  onClearCredentials: () => Promise<void>;
  busy: boolean;
};

function KeysSection({ panel, border, muted, summary, region, onManageProvider, onClearCredentials, busy }: KeysSectionProps) {
  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5}>
      <Box borderRadius="28px" p={6} bg={panel} borderWidth="1px" borderColor={border}>
        <Heading size="lg">Provider credentials</Heading>
        <Text mt={4} color={muted} lineHeight="1.8">
          AWS credentials stay on this device. Use this screen to reconnect the provider, rotate keys, or clear local access entirely.
        </Text>
        <Box mt={5} p={4} borderRadius="18px" borderWidth="1px" borderColor={border}>
          <Text color={muted} fontSize="sm">
            Active profile
          </Text>
          <Text mt={1} fontWeight="bold">
            {summary}
          </Text>
          <Text mt={1} color={muted}>
            Region: {region}
          </Text>
        </Box>
        <HStack mt={5} gap={3} wrap="wrap">
          <Button borderRadius="full" onClick={onManageProvider}>
            Manage provider
          </Button>
          <Button borderRadius="full" variant="outline" onClick={() => void onClearCredentials()} disabled={busy}>
            Clear credentials
          </Button>
        </HStack>
      </Box>

      <Box borderRadius="28px" p={6} bg={panel} borderWidth="1px" borderColor={border}>
        <Heading size="lg">Access roadmap</Heading>
        <Text mt={4} color={muted} lineHeight="1.8">
          This screen becomes the home for provider keys, local key references, access templates, and later per-environment SSH defaults.
        </Text>
        <Stack mt={5} gap={3}>
          <ScreenRow border={border} label="Cloud provider" value="AWS" />
          <ScreenRow border={border} label="Storage" value="Local secure storage" />
          <ScreenRow border={border} label="Next step" value="SSH keypair and profile flows" />
        </Stack>
      </Box>
    </SimpleGrid>
  );
}

type SecuritySectionProps = {
  panel: string;
  border: string;
  muted: string;
  accent: string;
};

function SecuritySection({ panel, border, muted, accent }: SecuritySectionProps) {
  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5}>
      <Box borderRadius="28px" p={6} bg={panel} borderWidth="1px" borderColor={border}>
        <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
          Security groups
        </Text>
        <Heading mt={2} size="lg">
          Network actions stay next to operations
        </Heading>
        <Text mt={4} color={muted} lineHeight="1.8">
          This section is reserved for authorize-IP, ingress review, and environment-aware security group actions against the workloads you operate.
        </Text>
        <Stack mt={5} gap={3}>
          <ScreenRow border={border} label="Primary action" value="Authorize current IP" />
          <ScreenRow border={border} label="Scope" value="Selected environment" />
          <ScreenRow border={border} label="Future" value="Rule diff and audit trail" />
        </Stack>
      </Box>

      <Box borderRadius="28px" p={6} bg={panel} borderWidth="1px" borderColor={border}>
        <Heading size="lg">Security posture context</Heading>
        <Text mt={4} color={muted} lineHeight="1.8">
          Once instances, groups, and regions are linked, this area will show relationships and safe quick actions per service boundary.
        </Text>
      </Box>
    </SimpleGrid>
  );
}

type WorkspaceStatProps = {
  label: string;
  value: string;
  panel: string;
  border: string;
  muted: string;
};

function WorkspaceStat({ label, value, panel, border, muted }: WorkspaceStatProps) {
  return (
    <Box minW="110px" borderRadius="18px" p={3} bg={panel} borderWidth="1px" borderColor={border}>
      <Text color={muted} fontSize="xs">
        {label}
      </Text>
      <Text mt={1} fontWeight="bold" fontSize="lg">
        {value}
      </Text>
    </Box>
  );
}

type ScreenRowProps = {
  border: string;
  label: string;
  value: string;
};

function ScreenRow({ border, label, value }: ScreenRowProps) {
  return (
    <Flex justify="space-between" align="center" borderWidth="1px" borderColor={border} borderRadius="16px" px={4} py={3} gap={4}>
      <Text>{label}</Text>
      <Text fontWeight="bold" textAlign="right">
        {value}
      </Text>
    </Flex>
  );
}

type InstructionRowProps = {
  border: string;
  step: string;
  text: string;
};

function InstructionRow({ border, step, text }: InstructionRowProps) {
  return (
    <HStack align="start" gap={3} borderWidth="1px" borderColor={border} borderRadius="16px" px={4} py={3}>
      <Box minW="28px" h="28px" borderRadius="full" display="grid" placeItems="center" bg="rgba(22, 119, 201, 0.12)" fontWeight="bold">
        {step}
      </Box>
      <Text lineHeight="1.6">{text}</Text>
    </HStack>
  );
}
