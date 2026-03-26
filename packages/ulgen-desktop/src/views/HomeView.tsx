import { Box, Heading, Text, SimpleGrid, Stack, Icon, Circle, HStack, VStack } from "@chakra-ui/react";
import { Activity, Server, Zap, Shield } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";

export function HomeView() {
  return (
    <Stack gap="10">
      <Box px="2">
        <Text fontSize="xs" fontWeight="black" color="blue.500" letterSpacing="0.4em" mb="2" textTransform="uppercase">
          Operational Terminal
        </Text>
        <Heading size="4xl" fontWeight="900" letterSpacing="-0.04em" lineHeight="0.9">
          Welcome back, Operator
        </Heading>
        <Text color="fg.muted" fontSize="lg" mt="4" fontWeight="medium">
          ULGEN is synchronized and monitoring 12 global availability zones.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
        <StatCard icon={Activity} label="System Status" value="Healthy" color="green.500" />
        <StatCard icon={Server} label="Active Instances" value="0" color="blue.500" />
        <StatCard icon={Zap} label="Operations" value="Ready" color="orange.500" />
      </SimpleGrid>

      <PremiumCard hoverable={false}>
        <Box p="8">
          <Stack gap="6">
            <Heading size="md" fontWeight="black" letterSpacing="0.02em" textTransform="uppercase">Operational Activity</Heading>
            <Box 
              py="20" 
              textAlign="center" 
              border="1px dashed" 
              borderColor="border.muted" 
              borderRadius="3xl"
              bg="bg.muted"
              position="relative"
              overflow="hidden"
            >
              <VStack gap="2" position="relative" zIndex="1">
                <Text color="fg.muted" fontWeight="bold">No recent operations detected in the last 24 hours.</Text>
                <Text fontSize="xs" color="fg.muted">Provisioned instances and terminal sessions will appear here.</Text>
              </VStack>
            </Box>
          </Stack>
        </Box>
      </PremiumCard>

      <Box>
        <Heading size="md" mb="4" fontWeight="black" letterSpacing="0.02em" textTransform="uppercase">Suggested Actions</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
          <ActionCard 
            title="Provision New Instance" 
            desc="Deploy a new EC2 instance with pre-configured settings." 
            icon={Zap} 
            color="orange.500"
          />
          <ActionCard 
            title="Security Audit" 
            desc="Scan your open ports and security group rules." 
            icon={Shield} 
            color="red.500" 
          />
        </SimpleGrid>
      </Box>
    </Stack>
  );
}

function ActionCard({ title, desc, icon, color }: any) {
  return (
    <PremiumCard>
      <Box p="5">
        <HStack gap="4">
          <Circle size="10" bg={`${color}15`} color={color}>
            <Icon as={icon} size="sm" />
          </Circle>
          <VStack align="flex-start" gap="0">
            <Text fontWeight="bold" fontSize="sm">{title}</Text>
            <Text fontSize="xs" color="fg.muted">{desc}</Text>
          </VStack>
        </HStack>
      </Box>
    </PremiumCard>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <PremiumCard>
      <Box p="6">
        <Stack direction="row" justify="space-between" align="center">
          <Stack gap="1">
            <Text fontSize="xs" color="fg.muted" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">{label}</Text>
            <Text fontSize="3xl" fontWeight="bold">{value}</Text>
          </Stack>
          <Box p="4" bg="bg.muted" borderRadius="2xl" border="1px solid" borderColor="border.muted">
            <Icon as={icon} color={color} size="lg" />
          </Box>
        </Stack>
      </Box>
    </PremiumCard>
  );
}
