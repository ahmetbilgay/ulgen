import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import type { DiscoveryResult, InstanceSummary } from "../hooks/useAws";

type ResourceTableProps = {
  data: DiscoveryResult | null;
  instances: InstanceSummary[];
  activeRegion: string | null;
  isLoading: boolean;
  error: string | null;
  bg: string;
  border: string;
  muted: string;
  selectedInstanceId: string | null;
  onSelectInstance: (instanceId: string) => void;
};

export function ResourceTable({
  data,
  instances,
  activeRegion,
  isLoading,
  error,
  bg,
  border,
  muted,
  selectedInstanceId,
  onSelectInstance,
}: ResourceTableProps) {
  if (isLoading) {
    return (
      <Box borderRadius="26px" p={6} bg={bg} borderWidth="1px" borderColor={border}>
        <Spinner size="sm" />
        <Text mt={3} color={muted}>
          Scanning active AWS regions...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box borderRadius="26px" p={6} bg={bg} borderWidth="1px" borderColor={border} color="red.400">
        {error}
      </Box>
    );
  }

  return (
    <Box borderRadius="26px" p={6} bg={bg} borderWidth="1px" borderColor={border}>
      <Box display="flex" justifyContent="space-between" alignItems="start" gap={3} mb={5}>
        <Box>
          <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={muted}>
            Servers
          </Text>
          <Heading mt={2} size="lg">
            {activeRegion ? `${activeRegion} inventory` : "Server inventory"}
          </Heading>
        </Box>
        <Text color={muted} fontWeight="medium">
          {instances.length} visible
        </Text>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap="14px">
        {instances.length ? (
          instances.map((instance) => (
            <Box
              key={`${instance.region}:${instance.id}`}
              borderRadius="20px"
              borderWidth="1px"
              borderColor={selectedInstanceId === instance.id ? "#78d8ff" : border}
              bg={selectedInstanceId === instance.id ? "rgba(120, 216, 255, 0.08)" : "transparent"}
              px={4}
              py={4}
              cursor="pointer"
              onClick={() => onSelectInstance(instance.id)}
            >
              <Text fontWeight="bold">{instance.name}</Text>
              <Text mt={1} color={muted} fontSize="sm">
                {instance.instance_type ?? "EC2 instance"}
              </Text>
              <Text mt={3} fontSize="sm">
                State: {instance.state}
              </Text>
              <Text mt={1} color={muted} fontSize="sm">
                {instance.public_ip ?? instance.private_ip ?? "No reachable IP"}
              </Text>
            </Box>
          ))
        ) : (
          <Box borderRadius="20px" borderWidth="1px" borderColor={border} px={4} py={8}>
            <Text color={muted} textAlign="center">
              No servers found in this region.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
