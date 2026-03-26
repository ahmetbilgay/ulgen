import { Box, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import type { DiscoveryResult, InstanceSummary } from "../hooks/useAws";

type InspectorPanelProps = {
  data: DiscoveryResult | null;
  selectedInstance: InstanceSummary | null;
  bg: string;
  border: string;
  muted: string;
  accent: string;
};

export function InspectorPanel({
  data,
  selectedInstance,
  bg,
  border,
  muted,
  accent,
}: InspectorPanelProps) {
  const items = [
    { label: "Provider", value: data?.provider ?? "aws" },
    { label: "Regions", value: String(data?.regions_scanned.length ?? 0) },
    { label: "Instances", value: String(data?.instances.length ?? 0) },
    {
      label: "Last snapshot",
      value: data?.generated_at ? new Date(data.generated_at).toLocaleTimeString() : "n/a",
    },
  ];

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
      <SimpleGrid columns={1} gap={4} mt={5}>
        {items.map((item) => (
          <Box key={item.label}>
            <Text color={muted} fontSize="sm">
              {item.label}
            </Text>
            <Text mt={1} fontWeight="bold">
              {item.value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
