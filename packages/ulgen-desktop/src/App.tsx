import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Separator,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { InspectorPanel } from "./components/InspectorPanel";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { ResourceTable } from "./components/ResourceTable";
import { TerminalPanel } from "./components/TerminalPanel";
import { useAws } from "./hooks/useAws";
import { useCommandPaletteStore } from "./store/useCommandPaletteStore";

export function App() {
  const [hasEnteredWorkspace, setHasEnteredWorkspace] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { data, isLoading, error, refresh } = useAws(hasEnteredWorkspace);
  const isOpen = useCommandPaletteStore((state) => state.isOpen);
  const open = useCommandPaletteStore((state) => state.open);
  const close = useCommandPaletteStore((state) => state.close);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const isDark = !isMounted || resolvedTheme !== "light";
  const bg = isDark ? "#071019" : "#f4efe7";
  const layer = isDark ? "rgba(9, 18, 30, 0.76)" : "rgba(255, 255, 255, 0.82)";
  const panel = isDark ? "rgba(11, 21, 34, 0.88)" : "rgba(255, 255, 255, 0.95)";
  const soft = isDark ? "rgba(255,255,255,0.05)" : "rgba(17, 35, 52, 0.05)";
  const border = isDark ? "rgba(145, 176, 198, 0.18)" : "rgba(70, 89, 106, 0.12)";
  const muted = isDark ? "#9eb1c4" : "#66788a";
  const text = isDark ? "#eef5fb" : "#16212d";
  const accent = isDark ? "#79d2ff" : "#0d89c8";
  const accentStrong = isDark ? "#2ea7df" : "#0c6f9f";

  const instanceCount = data?.instances.length ?? 0;
  const regionCount = data?.regions_scanned.length ?? 0;

  if (!hasEnteredWorkspace) {
    return (
      <Box minH="100vh" bg={bg} color={text} px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }}>
        <Flex justify="space-between" align="start" gap={6} mb={8} wrap="wrap">
          <Box>
            <Text
              textTransform="uppercase"
              letterSpacing="0.2em"
              fontSize="xs"
              fontWeight="bold"
              color={accent}
            >
              ULGEN
            </Text>
            <Heading
              mt={3}
              fontSize={{ base: "4xl", md: "6xl" }}
              lineHeight="0.95"
              letterSpacing="-0.05em"
              maxW="10ch"
            >
              Own your cloud operations surface.
            </Heading>
          </Box>
          <Button
            variant="outline"
            borderRadius="full"
            borderColor={border}
            bg={soft}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? "Light mode" : "Dark mode"}
          </Button>
        </Flex>

        <Grid templateColumns={{ base: "1fr", xl: "1.45fr 0.75fr" }} gap={6}>
          <GridItem>
            <VStack
              align="stretch"
              gap={6}
              p={{ base: 6, md: 8 }}
              borderRadius="32px"
              bg={layer}
              borderWidth="1px"
              borderColor={border}
              boxShadow="0 18px 40px rgba(18, 28, 38, 0.12)"
            >
              <Badge
                alignSelf="start"
                borderRadius="full"
                px={3}
                py={1.5}
                bg={soft}
                color={accent}
                borderWidth="1px"
                borderColor={border}
              >
                Local-first. Rust-powered. AWS-first.
              </Badge>
              <Heading
                fontSize={{ base: "3xl", md: "5xl" }}
                lineHeight="1"
                letterSpacing="-0.05em"
                maxW="14ch"
              >
                Run infra operations from your machine, not somebody else&apos;s tab.
              </Heading>
              <Text maxW="4xl" color={muted} fontSize="lg" lineHeight="1.8">
                ULGEN keeps credentials local, routes cloud actions through the desktop runtime,
                and leaves hosted sync as an optional layer instead of a requirement.
              </Text>
              <HStack gap={3} wrap="wrap">
                <Button
                  borderRadius="full"
                  px={5}
                  bg={accent}
                  color="white"
                  _hover={{ bg: accentStrong }}
                  onClick={() => setHasEnteredWorkspace(true)}
                >
                  Enter workspace
                </Button>
                <Button
                  variant="outline"
                  borderRadius="full"
                  borderColor={border}
                  bg={soft}
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                >
                  Switch theme
                </Button>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <MetricCard label="Execution model" value="Local-first" panel={panel} border={border} />
                <MetricCard label="Provider path" value="UI → Core → AWS" panel={panel} border={border} />
                <MetricCard label="Current focus" value="EC2 operations" panel={panel} border={border} />
              </SimpleGrid>
            </VStack>
          </GridItem>

          <GridItem>
            <VStack align="stretch" gap={4}>
              <InfoPanel
                title="What you get"
                border={border}
                bg={layer}
                items={[
                  "Three-pane operational workspace",
                  "Command palette with Cmd/Ctrl + K",
                  "Parallel multi-region discovery foundation",
                  "Tauri desktop shell on top of a Rust core",
                ]}
              />
              <InfoPanel
                title="First run flow"
                border={border}
                bg={layer}
                ordered
                items={[
                  "Open the workspace",
                  "Connect AWS credentials next",
                  "Scan regions and inspect instances",
                ]}
              />
            </VStack>
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
            onExit={() => setHasEnteredWorkspace(false)}
            isDark={isDark}
            onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
            bg={layer}
            border={border}
            muted={muted}
            accent={accent}
            soft={soft}
          />
        </GridItem>

        <GridItem>
          <Grid templateColumns={{ base: "1fr", "2xl": "1.45fr 0.8fr" }} gap={5}>
            <GridItem>
              <Stack gap={5}>
                <Flex justify="space-between" align={{ base: "start", lg: "center" }} gap={4} wrap="wrap">
                  <Box>
                    <Text
                      textTransform="uppercase"
                      letterSpacing="0.18em"
                      fontSize="xs"
                      fontWeight="bold"
                      color={accent}
                    >
                      Sovereign Infrastructure Engine
                    </Text>
                    <Heading mt={3} fontSize={{ base: "3xl", md: "5xl" }} lineHeight="0.98" letterSpacing="-0.05em">
                      Operational Workspace
                    </Heading>
                    <Text mt={3} color={muted}>
                      Inventory, inspect, and prepare actions from a single local runtime.
                    </Text>
                  </Box>
                  <HStack gap={3} wrap="wrap">
                    <WorkspaceStat label="Instances" value={String(instanceCount)} panel={panel} border={border} />
                    <WorkspaceStat label="Regions" value={String(regionCount)} panel={panel} border={border} />
                    <Button
                      borderRadius="full"
                      px={5}
                      bg={accent}
                      color="white"
                      _hover={{ bg: accentStrong }}
                      onClick={() => void refresh()}
                    >
                      Refresh Instances
                    </Button>
                  </HStack>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <MetricCard
                    label="Discovery"
                    value="Parallel region scan"
                    description="Designed for async AWS discovery across active regions."
                    panel={panel}
                    border={border}
                  />
                  <MetricCard
                    label="Boundary"
                    value="Credentials stay local"
                    description="Desktop UI talks to the Rust core, not directly to cloud SDKs."
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
                />
              </Stack>
            </GridItem>

            <GridItem>
              <VStack align="stretch" gap={5}>
                <InspectorPanel data={data} bg={panel} border={border} muted={muted} accent={accent} />
                <TerminalPanel bg={panel} border={border} muted={muted} accent={accent} />
              </VStack>
            </GridItem>
          </Grid>
        </GridItem>
      </Grid>

      <CommandPalette bg={panel} border={border} muted={muted} soft={soft} />
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

type InfoPanelProps = {
  title: string;
  items: string[];
  ordered?: boolean;
  border: string;
  bg: string;
};

function InfoPanel({ title, items, ordered = false, border, bg }: InfoPanelProps) {
  return (
    <Box borderRadius="28px" p={6} bg={bg} borderWidth="1px" borderColor={border}>
      <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color="colorPalette.400">
        {title}
      </Text>
      <Stack as={ordered ? "ol" : "ul"} mt={4} ps={4} gap={3}>
        {items.map((item) => (
          <Text as="li" key={item} color="fg.muted" lineHeight="1.7">
            {item}
          </Text>
        ))}
      </Stack>
    </Box>
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
