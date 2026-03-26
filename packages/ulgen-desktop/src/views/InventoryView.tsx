import { Box, Heading, Text, Stack, HStack, SimpleGrid, Icon, Badge, Button, IconButton, Flex, VStack } from "@chakra-ui/react";
import { RefreshCw, Terminal, Power, MoreVertical, Server, Filter } from "lucide-react";
import { useAws } from "@/hooks/useAws";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useConfigStore } from "@/store/useConfigStore";
import { useInventoryStore } from "@/store/useInventoryStore";
import type { InstanceSummary } from "@/types/cloud";
import { useNavigate } from "react-router-dom";

export function InventoryView() {
  const { activeRegion } = useConfigStore();
  const { data, isLoading, refresh } = useAws(!!activeRegion);
  const { setSelectedInstanceId } = useInventoryStore();
  const navigate = useNavigate();

  const instances = data?.instances || [];

  const handleInstanceSelect = (id: string) => {
    setSelectedInstanceId(id);
    navigate(`/app/servers/${id}`);
  };

  return (
    <Stack gap="6">
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl">Infrastructure Inventory</Heading>
          <Text color="fg.muted">Manage your cloud resources across 12 regions.</Text>
        </Box>
        <HStack gap="3">
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button colorPalette="blue" size="sm">
            <Filter size={14} /> Advanced Filter
          </Button>
        </HStack>
      </Flex>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonLoader key={i} />)}
        </SimpleGrid>
      ) : instances.length === 0 ? (
        <PremiumCard hoverable={false}>
          <Box p="20" textAlign="center">
            <VStack gap="4">
              <Server size={48} color="gray" style={{ opacity: 0.3, margin: '0 auto' }} />
              <Box>
                <Text fontSize="lg" fontWeight="bold">No instances found</Text>
                <Text color="fg.muted">Try switching regions or checking your AWS credentials.</Text>
              </Box>
              <Button variant="subtle" size="sm" onClick={() => navigate('/onboarding')}>Go to Credentials</Button>
            </VStack>
          </Box>
        </PremiumCard>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
          {instances.map((instance) => (
            <InstanceCard 
              key={instance.id} 
              instance={instance} 
              onSelect={() => handleInstanceSelect(instance.id)}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}

function InstanceCard({ instance, onSelect }: { instance: InstanceSummary; onSelect: () => void }) {
  const isRunning = instance.state === "running";
  
  return (
    <PremiumCard onClick={onSelect} cursor="pointer">
      <Box p="5">
        <Stack gap="4">
          <HStack justify="space-between" align="flex-start">
            <Box overflow="hidden">
              <Text fontWeight="bold" fontSize="md" truncate>{instance.name || instance.id}</Text>
              <Text fontSize="xs" color="fg.muted">{instance.id}</Text>
            </Box>
            <Badge colorPalette={isRunning ? "green" : "gray"} variant="subtle" borderRadius="full">
              {instance.state}
            </Badge>
          </HStack>

          <Stack gap="1" py="2">
            <HStack justify="space-between">
              <Text fontSize="xs" color="fg.muted">Type</Text>
              <Text fontSize="xs" fontWeight="bold">{instance.instance_type}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color="fg.muted">Public IP</Text>
              <Text fontSize="xs" fontWeight="bold" fontFamily="mono">{instance.public_ip || "N/A"}</Text>
            </HStack>
          </Stack>

          <HStack justify="space-between" pt="2" borderTop="1px solid" borderColor="border.muted">
            <HStack gap="2">
              <IconButton size="xs" variant="ghost" aria-label="Terminal" borderRadius="md">
                <Terminal size={14} />
              </IconButton>
              <IconButton size="xs" variant="ghost" aria-label="Power" borderRadius="md">
                <Power size={14} />
              </IconButton>
            </HStack>
            <IconButton size="xs" variant="ghost" aria-label="More" borderRadius="md">
              <MoreVertical size={14} />
            </IconButton>
          </HStack>
        </Stack>
      </Box>
    </PremiumCard>
  );
}
