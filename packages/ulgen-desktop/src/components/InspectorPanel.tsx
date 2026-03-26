import { Box, Button, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import type { DiscoveryResult, InstanceSummary } from "../hooks/useAws";

type InspectorPanelProps = {
  data: DiscoveryResult | null;
  selectedInstance: InstanceSummary | null;
  actionBusy: boolean;
  actionNotice: string | null;
  onStart: () => void;
  onStop: () => void;
  bg: string;
  border: string;
  muted: string;
  accent: string;
};

export function InspectorPanel({
  data,
  selectedInstance,
  actionBusy,
  actionNotice,
  onStart,
  onStop,
  bg,
  border,
  muted,
  accent,
}: InspectorPanelProps) {
  const launchedAt = selectedInstance?.launched_at ? new Date(selectedInstance.launched_at).toLocaleString() : "n/a";
  const state = selectedInstance?.state ?? "unknown";
  const isRunning = state === "running";

  return (
    <Box borderRadius="26px" p={6} bg={bg} borderWidth="1px" borderColor={border}>
      <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
        Context
      </Text>
      <Heading mt={2} size="lg">
        Inspector
      </Heading>
      <Box mt={5} p={4} borderRadius="18px" borderWidth="1px" borderColor={border}>
        <Text color={muted} fontSize="sm">
          Selected instance
        </Text>
        <Text mt={1} fontWeight="bold">
          {selectedInstance?.name ?? "No instance selected"}
        </Text>
        <Text mt={2} color={muted} fontSize="sm">
          {selectedInstance
            ? `${selectedInstance.region} · ${selectedInstance.state} · ${selectedInstance.public_ip ?? selectedInstance.private_ip ?? "no ip"}`
            : "Choose an EC2 instance from the list to inspect connection details."}
        </Text>
      </Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={5}>
        <DetailItem label="State" value={state} muted={muted} />
        <DetailItem label="Region" value={selectedInstance?.region ?? "n/a"} muted={muted} />
        <DetailItem label="Type" value={selectedInstance?.instance_type ?? "n/a"} muted={muted} />
        <DetailItem label="Launched" value={launchedAt} muted={muted} />
        <DetailItem label="Public IP" value={selectedInstance?.public_ip ?? "n/a"} muted={muted} />
        <DetailItem label="Private IP" value={selectedInstance?.private_ip ?? "n/a"} muted={muted} />
      </SimpleGrid>

      <Stack mt={5} gap={3}>
        <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
          Actions
        </Text>
        <HStack gap={3} wrap="wrap">
          <Button borderRadius="full" onClick={onStart} disabled={!selectedInstance || isRunning || actionBusy}>
            Start server
          </Button>
          <Button borderRadius="full" variant="outline" onClick={onStop} disabled={!selectedInstance || !isRunning || actionBusy}>
            Stop server
          </Button>
        </HStack>
        {actionNotice ? (
          <Text color={muted} lineHeight="1.6">
            {actionNotice}
          </Text>
        ) : null}
      </Stack>

      <SimpleGrid columns={1} gap={4} mt={5}>
        <DetailItem label="Provider" value={data?.provider ?? "aws"} muted={muted} />
        <DetailItem label="Regions" value={String(data?.regions_scanned.length ?? 0)} muted={muted} />
        <DetailItem label="Instances" value={String(data?.instances.length ?? 0)} muted={muted} />
        <DetailItem
          label="Last snapshot"
          value={data?.generated_at ? new Date(data.generated_at).toLocaleTimeString() : "n/a"}
          muted={muted}
        />
      </SimpleGrid>
    </Box>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
  muted: string;
};

function DetailItem({ label, value, muted }: DetailItemProps) {
  return (
    <Box>
      <Text color={muted} fontSize="sm">
        {label}
      </Text>
      <Text mt={1} fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}
