import { invoke } from "@tauri-apps/api/core";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { InspectorPanel } from "./components/InspectorPanel";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { ResourceTable } from "./components/ResourceTable";
import { TerminalPanel } from "./components/TerminalPanel";
import { useAuth } from "./hooks/useAuth";
import { type InstanceSummary, useAws } from "./hooks/useAws";
import { useCommandPaletteStore } from "./store/useCommandPaletteStore";

type AwsCredentialInput = {
  access_key_id: string;
  secret_access_key: string;
  session_token?: string | null;
  default_region: string;
};

type AwsCredentialSummary = {
  is_configured: boolean;
  access_key_preview?: string | null;
  default_region?: string | null;
};

type AwsConnectionStatus = {
  ok: boolean;
  message: string;
  region_count: number;
};

type OnboardingStage = "welcome" | "auth" | "provider" | "aws" | "workspace";
type CloudProviderOption = "aws" | "gcp" | "azure";

const EMPTY_FORM: AwsCredentialInput = {
  access_key_id: "",
  secret_access_key: "",
  session_token: "",
  default_region: "us-east-1",
};

export function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [stage, setStage] = useState<OnboardingStage>("welcome");
  const [selectedProvider, setSelectedProvider] = useState<CloudProviderOption>("aws");
  const [credentialSummary, setCredentialSummary] = useState<AwsCredentialSummary | null>(null);
  const [credentialForm, setCredentialForm] = useState<AwsCredentialInput>(EMPTY_FORM);
  const [credentialNotice, setCredentialNotice] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<AwsConnectionStatus | null>(null);
  const [credentialBusy, setCredentialBusy] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [sshUsername, setSshUsername] = useState("ec2-user");
  const [preparedCommand, setPreparedCommand] = useState<string | null>(null);
  const [terminalNotice, setTerminalNotice] = useState<string | null>(null);
  const [terminalBusy, setTerminalBusy] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();
  const { isReady, isAuthenticated, email, signIn, signOut } = useAuth();
  const shouldLoadAws = stage === "workspace" && selectedProvider === "aws";
  const { data, isLoading, error, refresh } = useAws(shouldLoadAws);
  const isOpen = useCommandPaletteStore((state) => state.isOpen);
  const open = useCommandPaletteStore((state) => state.open);
  const close = useCommandPaletteStore((state) => state.close);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    void hydrateCredentialSummary();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    setStage(isAuthenticated ? "provider" : "welcome");
  }, [isAuthenticated, isReady]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && stage === "workspace") {
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
  }, [close, isOpen, open, stage]);

  useEffect(() => {
    if (!data?.instances.length) {
      setSelectedInstanceId(null);
      return;
    }

    if (!selectedInstanceId || !data.instances.some((instance) => instance.id === selectedInstanceId)) {
      setSelectedInstanceId(data.instances[0].id);
    }
  }, [data, selectedInstanceId]);

  const selectedInstance = useMemo(() => {
    return data?.instances.find((instance) => instance.id === selectedInstanceId) ?? null;
  }, [data, selectedInstanceId]);

  const isDark = !isMounted || resolvedTheme !== "light";
  const bg = isDark ? "#08111b" : "#f6efe5";
  const hero = isDark ? "linear-gradient(135deg, rgba(14, 24, 39, 0.96), rgba(8, 16, 28, 0.94))" : "linear-gradient(135deg, rgba(255, 252, 246, 0.98), rgba(247, 238, 227, 0.98))";
  const layer = isDark ? "rgba(9, 18, 30, 0.76)" : "rgba(255, 255, 255, 0.82)";
  const panel = isDark ? "rgba(11, 21, 34, 0.88)" : "rgba(255, 255, 255, 0.95)";
  const soft = isDark ? "rgba(255,255,255,0.05)" : "rgba(17, 35, 52, 0.05)";
  const border = isDark ? "rgba(145, 176, 198, 0.18)" : "rgba(70, 89, 106, 0.12)";
  const muted = isDark ? "#9eb1c4" : "#66788a";
  const text = isDark ? "#eef5fb" : "#16212d";
  const accent = isDark ? "#79d2ff" : "#0d89c8";
  const accentStrong = isDark ? "#2ea7df" : "#0c6f9f";
  const primaryButtonBg = isDark ? "#f2b15a" : "#0f1720";
  const primaryButtonHover = isDark ? "#f6c173" : "#243240";
  const primaryButtonText = isDark ? "#111722" : "#f8fbfd";
  const secondaryButtonBg = isDark ? "rgba(121, 210, 255, 0.10)" : "#e9f4fb";
  const secondaryButtonText = isDark ? "#dff6ff" : "#0b6b9a";
  const navButtonBg = isDark ? "#142434" : "#f3efe8";
  const navButtonHoverBg = isDark ? "#1b3147" : "#ebe2d5";
  const navButtonText = isDark ? "#edf5fb" : "#16212d";
  const providerAvailableBg = isDark ? "rgba(18, 34, 49, 0.98)" : "#ffffff";
  const providerComingSoonBg = isDark ? "rgba(10, 18, 28, 0.72)" : "#f3efe8";

  const instanceCount = data?.instances.length ?? 0;
  const regionCount = data?.regions_scanned.length ?? 0;

  async function hydrateCredentialSummary() {
    try {
      const summary = await invoke<AwsCredentialSummary>("load_aws_credentials");
      setCredentialSummary(summary);
      if (summary.default_region) {
        setCredentialForm((current) => ({
          ...current,
          default_region: summary.default_region ?? current.default_region,
        }));
      }
    } catch (cause) {
      setCredentialNotice(cause instanceof Error ? cause.message : "Failed to load saved AWS credentials.");
    }
  }

  function handleAuthSubmit() {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthNotice("Enter email and password to continue.");
      return;
    }

    signIn(authEmail.trim());
    setAuthNotice(null);
    setStage("provider");
  }

  async function handleSaveCredentials() {
    setCredentialBusy(true);
    setCredentialNotice(null);

    try {
      const summary = await invoke<AwsCredentialSummary>("save_aws_credentials", {
        input: {
          ...credentialForm,
          session_token: credentialForm.session_token || null,
        },
      });
      setCredentialSummary(summary);
      setCredentialNotice("AWS credentials saved to local secure storage.");
    } catch (cause) {
      setCredentialNotice(cause instanceof Error ? cause.message : "Failed to save AWS credentials.");
    } finally {
      setCredentialBusy(false);
    }
  }

  async function handleTestConnection() {
    setCredentialBusy(true);
    setConnectionStatus(null);

    try {
      const status = await invoke<AwsConnectionStatus>("test_aws_connection", {
        input: {
          ...credentialForm,
          session_token: credentialForm.session_token || null,
        },
      });
      setConnectionStatus(status);
      setCredentialNotice(status.message);
      setStage("workspace");
      await hydrateCredentialSummary();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "AWS connection test failed.";
      setConnectionStatus({ ok: false, message, region_count: 0 });
      setCredentialNotice(message);
    } finally {
      setCredentialBusy(false);
    }
  }

  async function handleClearCredentials() {
    setCredentialBusy(true);

    try {
      await invoke("clear_aws_credentials");
      setCredentialSummary({
        is_configured: false,
        access_key_preview: null,
        default_region: null,
      });
      setCredentialForm(EMPTY_FORM);
      setConnectionStatus(null);
      setCredentialNotice("Saved AWS credentials cleared.");
    } catch (cause) {
      setCredentialNotice(cause instanceof Error ? cause.message : "Failed to clear AWS credentials.");
    } finally {
      setCredentialBusy(false);
    }
  }

  async function handlePrepareTerminal() {
    if (!selectedInstance) {
      setTerminalNotice("Select an EC2 instance before preparing an SSH session.");
      return;
    }

    setTerminalBusy(true);
    setTerminalNotice(null);

    try {
      const command = await invoke<string>("prepare_ssh_session", {
        instance: selectedInstance,
        username: sshUsername,
      });
      setPreparedCommand(command);
      setTerminalNotice("SSH command prepared. Full in-app terminal streaming is the next backend step.");
    } catch (cause) {
      setPreparedCommand(null);
      setTerminalNotice(cause instanceof Error ? cause.message : "Failed to prepare SSH command.");
    } finally {
      setTerminalBusy(false);
    }
  }

  function handleProviderSelect(provider: CloudProviderOption) {
    setSelectedProvider(provider);
    if (provider === "aws") {
      setStage("aws");
    }
  }

  function handleExitWorkspace() {
    setStage("provider");
  }

  function handleSignOut() {
    signOut();
    setSelectedProvider("aws");
    setStage("welcome");
    setPreparedCommand(null);
    setTerminalNotice(null);
  }

  if (!isReady) {
    return <CenteredStage bg={bg} color={text}><Text>Preparing ULGEN...</Text></CenteredStage>;
  }

  if (stage !== "workspace") {
    return (
      <Box minH="100vh" bg={bg} color={text} px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }}>
        <Flex justify="space-between" align="start" gap={6} mb={8} wrap="wrap">
          <Box>
            <Text textTransform="uppercase" letterSpacing="0.2em" fontSize="xs" fontWeight="bold" color={accent}>
              ULGEN
            </Text>
            <Heading mt={3} fontSize={{ base: "4xl", md: "6xl" }} lineHeight="0.95" letterSpacing="-0.05em" maxW="10ch">
              Local-first infrastructure control.
            </Heading>
          </Box>
          <Button variant="outline" borderRadius="full" borderColor={border} bg={soft} onClick={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? "Light mode" : "Dark mode"}
          </Button>
        </Flex>

        <Grid templateColumns={{ base: "1fr", xl: "1.18fr 0.82fr" }} gap={6}>
          <GridItem>
            <VStack
              align="stretch"
              gap={6}
              p={{ base: 6, md: 8 }}
              borderRadius="36px"
              bg={hero}
              borderWidth="1px"
              borderColor={border}
              boxShadow="0 18px 40px rgba(18, 28, 38, 0.12)"
            >
              <Badge alignSelf="start" borderRadius="full" px={3} py={1.5} bg={soft} color={accent} borderWidth="1px" borderColor={border}>
                Rust core. Desktop-first. Provider-driven.
              </Badge>
              <Heading fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1" letterSpacing="-0.05em" maxW="13ch">
                Sign in, choose a cloud, and land in a focused operator workspace.
              </Heading>
              <Text maxW="4xl" color={muted} fontSize="lg" lineHeight="1.8">
                ULGEN should guide the operator through one clear path: authenticate, pick a service, connect credentials, then operate with context.
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <MetricCard label="Stage 1" value="Welcome & auth" panel={panel} border={border} description="Start with identity, not an empty console." />
                <MetricCard label="Stage 2" value="Provider choice" panel={panel} border={border} description="AWS today, other clouds visibly on deck." />
                <MetricCard label="Stage 3" value="Operational workspace" panel={panel} border={border} description="List, inspect, and prepare terminal access." />
              </SimpleGrid>
            </VStack>
          </GridItem>

          <GridItem>
            {stage === "welcome" ? (
              <StageCard title="Welcome" eyebrow="Start" border={border} bg={layer} accent={accent}>
                <Text color={muted} lineHeight="1.8">
                  Begin with a short login flow, then choose which cloud service you want ULGEN to target.
                </Text>
                <Stack gap={3} mt={6}>
                  <Button
                    borderRadius="full"
                    bg={primaryButtonBg}
                    color={primaryButtonText}
                    _hover={{ bg: primaryButtonHover }}
                    onClick={() => setStage("auth")}
                  >
                    Get started
                  </Button>
                  <Button
                    variant="outline"
                    borderRadius="full"
                    borderColor={border}
                    bg={secondaryButtonBg}
                    color={secondaryButtonText}
                    _hover={{ bg: soft }}
                    onClick={() => setStage("auth")}
                  >
                    Sign in
                  </Button>
                </Stack>
              </StageCard>
            ) : null}

            {stage === "auth" ? (
              <StageCard title="Sign in" eyebrow="Auth" border={border} bg={layer} accent={accent}>
                <Stack gap={4}>
                  <LabeledField
                    label="Work email"
                    value={authEmail}
                    onChange={setAuthEmail}
                    placeholder="you@company.com"
                  />
                  <LabeledField
                    label="Password"
                    value={authPassword}
                    onChange={setAuthPassword}
                    placeholder="Your password"
                    type="password"
                  />
                </Stack>
                {authNotice ? (
                  <Text mt={4} color="red.400">
                    {authNotice}
                  </Text>
                ) : null}
                <HStack mt={6} gap={3}>
                  <Button borderRadius="full" onClick={() => setStage("welcome")}>
                    Back
                  </Button>
                  <Button
                    borderRadius="full"
                    bg={primaryButtonBg}
                    color={primaryButtonText}
                    _hover={{ bg: primaryButtonHover }}
                    onClick={handleAuthSubmit}
                  >
                    Continue to services
                  </Button>
                </HStack>
              </StageCard>
            ) : null}

            {stage === "provider" ? (
              <StageCard title="Select a service" eyebrow="Providers" border={border} bg={layer} accent={accent}>
                <Text color={muted} lineHeight="1.8">
                  Start with the provider you want to operate. AWS is active now; the rest are visible so the product direction feels clear.
                </Text>
                <Stack gap={3} mt={6}>
                  <ProviderOptionCard
                    label="Amazon Web Services"
                    state="Available"
                    accent={accent}
                    border={border}
                    bg={providerAvailableBg}
                    textColor={text}
                    muted={muted}
                    onClick={() => handleProviderSelect("aws")}
                  />
                  <ProviderOptionCard
                    label="Google Cloud"
                    state="Coming soon"
                    accent={muted}
                    border={border}
                    bg={providerComingSoonBg}
                    textColor={text}
                    muted={muted}
                    disabled
                  />
                  <ProviderOptionCard
                    label="Microsoft Azure"
                    state="Coming soon"
                    accent={muted}
                    border={border}
                    bg={providerComingSoonBg}
                    textColor={text}
                    muted={muted}
                    disabled
                  />
                </Stack>
                <HStack mt={6} gap={3}>
                  <Button borderRadius="full" onClick={handleSignOut}>
                    Sign out
                  </Button>
                  <Text color={muted} fontSize="sm">
                    Signed in as {email ?? "local user"}
                  </Text>
                </HStack>
              </StageCard>
            ) : null}

            {stage === "aws" ? (
              <StageCard title="Connect AWS" eyebrow="AWS" border={border} bg={layer} accent={accent}>
                <Stack gap={4}>
                  <LabeledField
                    label="Access key ID"
                    value={credentialForm.access_key_id}
                    onChange={(value) => setCredentialForm((current) => ({ ...current, access_key_id: value }))}
                    placeholder="AKIA..."
                  />
                  <LabeledField
                    label="Secret access key"
                    value={credentialForm.secret_access_key}
                    onChange={(value) => setCredentialForm((current) => ({ ...current, secret_access_key: value }))}
                    placeholder="AWS secret access key"
                    type="password"
                  />
                  <LabeledField
                    label="Session token"
                    value={credentialForm.session_token ?? ""}
                    onChange={(value) => setCredentialForm((current) => ({ ...current, session_token: value }))}
                    placeholder="Optional for temporary credentials"
                  />
                  <LabeledField
                    label="Default region"
                    value={credentialForm.default_region}
                    onChange={(value) => setCredentialForm((current) => ({ ...current, default_region: value }))}
                    placeholder="us-east-1"
                  />
                </Stack>

                {credentialSummary?.is_configured ? (
                  <Box mt={5} p={4} borderRadius="18px" borderWidth="1px" borderColor={border}>
                    <Text color={muted} fontSize="sm">
                      Saved profile
                    </Text>
                    <Text mt={1} fontWeight="bold">
                      {credentialSummary.access_key_preview ?? "Configured"}
                    </Text>
                    <Text mt={1} color={muted}>
                      Region: {credentialSummary.default_region ?? credentialForm.default_region}
                    </Text>
                  </Box>
                ) : null}

                {credentialNotice ? (
                  <Text mt={4} color={connectionStatus?.ok === false ? "red.400" : muted} lineHeight="1.6">
                    {credentialNotice}
                  </Text>
                ) : null}

                <HStack mt={6} gap={3} wrap="wrap">
                  <Button borderRadius="full" onClick={() => setStage("provider")}>
                    Back
                  </Button>
                  <Button borderRadius="full" onClick={handleSaveCredentials} disabled={credentialBusy}>
                    Save locally
                  </Button>
                  <Button borderRadius="full" bg={accent} color="white" _hover={{ bg: accentStrong }} onClick={handleTestConnection} disabled={credentialBusy}>
                    Connect AWS
                  </Button>
                  <Button variant="outline" borderRadius="full" borderColor={border} onClick={() => setStage("workspace")}>
                    Continue without AWS
                  </Button>
                </HStack>

                {credentialSummary?.is_configured ? (
                  <Button mt={3} size="sm" variant="ghost" onClick={handleClearCredentials} disabled={credentialBusy}>
                    Clear saved credentials
                  </Button>
                ) : null}
              </StageCard>
            ) : null}
          </GridItem>
        </Grid>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bg} color={text} p={{ base: 4, md: 5 }}>
      <Grid templateColumns={{ base: "1fr", xl: "280px 1fr" }} gap={5}>
        <GridItem>
          <NavigationSidebar
            onRefresh={refresh}
            onExit={handleExitWorkspace}
            isDark={isDark}
            onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
            bg={layer}
            border={border}
            muted={muted}
            accent={accent}
            soft={soft}
            text={text}
            buttonBg={navButtonBg}
            buttonText={navButtonText}
            buttonHoverBg={navButtonHoverBg}
          />
        </GridItem>

        <GridItem>
          <Grid templateColumns={{ base: "1fr", "2xl": "1.45fr 0.8fr" }} gap={5}>
            <GridItem>
              <Stack gap={5}>
                <Flex justify="space-between" align={{ base: "start", lg: "center" }} gap={4} wrap="wrap">
                  <Box>
                    <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
                      {selectedProvider === "aws" ? "Amazon Web Services" : "Cloud provider"}
                    </Text>
                    <Heading mt={3} fontSize={{ base: "3xl", md: "5xl" }} lineHeight="0.98" letterSpacing="-0.05em">
                      Operational Workspace
                    </Heading>
                    <Text mt={3} color={muted}>
                      Signed in as {email ?? "local user"} · {credentialSummary?.is_configured ? `AWS configured for ${credentialSummary.default_region ?? "default region"}` : "No cloud credentials connected yet"}
                    </Text>
                  </Box>
                  <HStack gap={3} wrap="wrap">
                    <WorkspaceStat label="Instances" value={String(instanceCount)} panel={panel} border={border} />
                    <WorkspaceStat label="Regions" value={String(regionCount)} panel={panel} border={border} />
                    <Button
                      borderRadius="full"
                      px={5}
                      bg={primaryButtonBg}
                      color={primaryButtonText}
                      _hover={{ bg: primaryButtonHover }}
                      onClick={() => void refresh()}
                    >
                      Refresh Instances
                    </Button>
                  </HStack>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                  <MetricCard
                    label="Mode"
                    value="Service-first UX"
                    description="Auth, provider selection, and then workspace."
                    panel={panel}
                    border={border}
                  />
                  <MetricCard
                    label="Cloud"
                    value={selectedProvider.toUpperCase()}
                    description={selectedProvider === "aws" ? "Active provider" : "Provider not yet available"}
                    panel={panel}
                    border={border}
                  />
                  <MetricCard
                    label="Access"
                    value={credentialSummary?.is_configured ? credentialSummary.access_key_preview ?? "Configured" : "Not connected"}
                    description={connectionStatus?.message ?? "Connect credentials to unlock real discovery."}
                    panel={panel}
                    border={border}
                  />
                </SimpleGrid>

                <ResourceTable
                  data={data}
                  isLoading={isLoading}
                  error={error}
                  bg={panel}
                  border={border}
                  muted={muted}
                  selectedInstanceId={selectedInstanceId}
                  onSelectInstance={setSelectedInstanceId}
                />
              </Stack>
            </GridItem>

            <GridItem>
              <VStack align="stretch" gap={5}>
                <InspectorPanel
                  data={data}
                  selectedInstance={selectedInstance}
                  bg={panel}
                  border={border}
                  muted={muted}
                  accent={accent}
                />
                <TerminalPanel
                  selectedInstance={selectedInstance}
                  sshUsername={sshUsername}
                  onUsernameChange={setSshUsername}
                  onPrepare={handlePrepareTerminal}
                  preparedCommand={preparedCommand}
                  terminalNotice={terminalNotice}
                  bg={panel}
                  border={border}
                  muted={muted}
                  accent={accent}
                  busy={terminalBusy}
                />
              </VStack>
            </GridItem>
          </Grid>
        </GridItem>
      </Grid>

      <CommandPalette bg={panel} border={border} muted={muted} soft={soft} />
    </Box>
  );
}

type CenteredStageProps = {
  bg: string;
  color: string;
  children: React.ReactNode;
};

function CenteredStage({ bg, color, children }: CenteredStageProps) {
  return (
    <Flex minH="100vh" align="center" justify="center" bg={bg} color={color}>
      {children}
    </Flex>
  );
}

type StageCardProps = {
  title: string;
  eyebrow: string;
  border: string;
  bg: string;
  accent: string;
  children: React.ReactNode;
};

function StageCard({ title, eyebrow, border, bg, accent, children }: StageCardProps) {
  return (
    <Box borderRadius="30px" p={6} bg={bg} borderWidth="1px" borderColor={border}>
      <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
        {eyebrow}
      </Text>
      <Heading mt={2} size="lg">
        {title}
      </Heading>
      <Box mt={5}>{children}</Box>
    </Box>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  description?: string;
  panel: string;
  border: string;
};

function MetricCard({ label, value, description, panel, border }: MetricCardProps) {
  return (
    <Box borderRadius="24px" p={5} bg={panel} borderWidth="1px" borderColor={border}>
      <Text textTransform="uppercase" letterSpacing="0.14em" fontSize="xs" color="colorPalette.400">
        {label}
      </Text>
      <Heading mt={3} fontSize="xl">
        {value}
      </Heading>
      {description ? (
        <Text mt={3} color="fg.muted">
          {description}
        </Text>
      ) : null}
    </Box>
  );
}

type ProviderOptionCardProps = {
  label: string;
  state: string;
  accent: string;
  border: string;
  bg: string;
  textColor: string;
  muted: string;
  disabled?: boolean;
  onClick?: () => void;
};

function ProviderOptionCard({
  label,
  state,
  accent,
  border,
  bg,
  textColor,
  muted,
  disabled = false,
  onClick,
}: ProviderOptionCardProps) {
  return (
    <Button
      justifyContent="space-between"
      alignItems="center"
      h="auto"
      px={5}
      py={5}
      borderRadius="22px"
      borderWidth="1px"
      borderColor={border}
      bg={bg}
      color={textColor}
      onClick={onClick}
      disabled={disabled}
      _hover={
        disabled
          ? undefined
          : {
              transform: "translateY(-1px)",
              borderColor: accent,
            }
      }
    >
      <Stack align="start" gap={1}>
        <Text fontWeight="bold">{label}</Text>
        <Text fontSize="sm" color={muted}>
          {state}
        </Text>
      </Stack>
      <Badge
        borderRadius="full"
        px={3}
        py={1}
        bg={disabled ? "transparent" : "rgba(121, 210, 255, 0.10)"}
        color={accent}
        borderWidth="1px"
        borderColor={disabled ? border : accent}
      >
        {state}
      </Badge>
    </Button>
  );
}

type WorkspaceStatProps = {
  label: string;
  value: string;
  panel: string;
  border: string;
};

function WorkspaceStat({ label, value, panel, border }: WorkspaceStatProps) {
  return (
    <Box minW="110px" borderRadius="18px" p={3} bg={panel} borderWidth="1px" borderColor={border}>
      <Text color="fg.muted" fontSize="xs">
        {label}
      </Text>
      <Text mt={1} fontWeight="bold" fontSize="lg">
        {value}
      </Text>
    </Box>
  );
}

type LabeledFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
};

function LabeledField({ label, value, placeholder, onChange, type = "text" }: LabeledFieldProps) {
  return (
    <Box>
      <Text mb={2} fontSize="sm" fontWeight="medium">
        {label}
      </Text>
      <Input value={value} type={type} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} borderRadius="16px" />
    </Box>
  );
}
