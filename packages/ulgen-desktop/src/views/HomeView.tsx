import { Box, Heading, Text, SimpleGrid, Stack, Icon, Circle, HStack, VStack, Button, Badge } from "@chakra-ui/react";
import { Activity, Server, Zap, Shield, Globe, Clock, AlertCircle, Plus, ArrowRight, Cloud, Lock, ShieldCheck } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useAws } from "@/hooks/useAws";
import { useConfigStore } from "@/store/useConfigStore";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MotionBox = (motion as any).create ? (motion as any).create(Box) : motion(Box);

export function HomeView() {
  const { activeRegion, profiles, setShowAccountSettings, setCredentialForm } = useConfigStore();
  const { data, isLoading } = useAws(profiles.length > 0);
  const navigate = useNavigate();

  const instances = data?.instances || [];
  const runningInstances = instances.filter(i => i.state === "running").length;
  const regionsCount = new Set(instances.map(i => i.region)).size;

  if (profiles.length === 0) {
    return <WelcomeHero onConnect={() => setShowAccountSettings(true)} />;
  }

  // Get most recent activity
  const recentInstances = [...instances]
    .sort((a, b) => new Date(b.launched_at || 0).getTime() - new Date(a.launched_at || 0).getTime())
    .slice(0, 5);

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
          {isLoading ? "Synchronizing cloud perimeter..." : `ULGEN is monitoring ${instances.length} instances across ${regionsCount} regions.`}
        </Text>
      </Box>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
          {[1, 2, 3].map(i => <SkeletonLoader key={i} />)}
        </SimpleGrid>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
          <StatCard icon={Activity} label="System Status" value={data ? "Healthy" : "Offline"} color="green.500" />
          <StatCard icon={Server} label="Active Instances" value={runningInstances.toString()} color="blue.500" />
          <StatCard icon={Globe} label="Active Regions" value={regionsCount.toString()} color="purple.500" />
        </SimpleGrid>
      )}

      <PremiumCard hoverable={false}>
        <Box p="8">
          <Stack gap="6">
            <HStack justify="space-between">
              <Heading size="md" fontWeight="black" letterSpacing="0.02em" textTransform="uppercase">Operational Activity</Heading>
              {data && <Text fontSize="xs" color="fg.muted">Last updated {new Date(data.generated_at).toLocaleTimeString()}</Text>}
            </HStack>
            
            <Stack gap="3">
              {recentInstances.length > 0 ? (
                recentInstances.map((instance) => (
                  <HStack 
                    key={instance.id} 
                    p="4" 
                    bg="whiteAlpha.50" 
                    borderRadius="2xl" 
                    border="1px solid" 
                    borderColor="border.muted"
                    justify="space-between"
                    _hover={{ bg: "whiteAlpha.100", cursor: 'pointer' }}
                    onClick={() => navigate(`/app/servers/${instance.id}`)}
                  >
                    <HStack gap="4">
                      <Circle size="10" bg={instance.state === "running" ? "green.500/10" : "gray.500/10"} color={instance.state === "running" ? "green.500" : "gray.400"}>
                        <Server size={18} />
                      </Circle>
                      <VStack align="flex-start" gap="0">
                        <Text fontWeight="bold" fontSize="sm">{instance.name || instance.id}</Text>
                        <Text fontSize="xs" color="fg.muted">{instance.region} • {instance.instance_type}</Text>
                      </VStack>
                    </HStack>
                    <HStack>
                      <Clock size={12} color="gray" />
                      <Text fontSize="xs" color="fg.muted">
                        {instance.launched_at ? formatDistanceToNow(new Date(instance.launched_at), { addSuffix: true }) : "Unknown"}
                      </Text>
                    </HStack>
                  </HStack>
                ))
              ) : (
                <Box 
                  py="20" 
                  textAlign="center" 
                  border="1px dashed" 
                  borderColor="border.muted" 
                  borderRadius="3xl"
                  bg="bg.muted"
                >
                  <VStack gap="2">
                    <AlertCircle size={32} color="var(--chakra-colors-fg-muted)" />
                    <Text color="fg.muted" fontWeight="bold">No instances discovered.</Text>
                    <Text fontSize="xs" color="fg.muted">Your operational inventory will appear here.</Text>
                  </VStack>
                </Box>
              )}
            </Stack>
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

function WelcomeHero({ onConnect }: { onConnect: () => void }) {
  return (
    <Center h="full">
      <VStack gap="12" maxW="800px" textAlign="center">
        <MotionBox
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5 }}
        >
          <VStack gap="4">
            <Badge colorPalette="blue" size="lg" borderRadius="full" px="4">Alpha v0.1.0</Badge>
            <Heading size="6xl" fontWeight="900" letterSpacing="-0.05em" lineHeight="0.85">
               Identity First <br />Infrastructure.
            </Heading>
            <Text fontSize="xl" color="fg.muted" maxW="600px" mx="auto" mt="4">
              Connect your cloud providers to visualize, monitor, and manage your entire mesh network from a single, high-fidelity command center.
            </Text>
          </VStack>
        </MotionBox>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="8" w="full">
          <ProviderChoice 
            name="Amazon Web Services" 
            desc="Access EC2, VPC, and Security Groups instantly." 
            color="orange.500" 
            icon={Cloud} 
            onClick={onConnect}
          />
          <ProviderChoice 
            name="Google Cloud" 
            desc="Manage GCE and cloud projects seamlessly." 
            color="blue.400" 
            icon={Globe} 
            onClick={onConnect}
          />
        </SimpleGrid>

        <HStack gap="8" color="fg.muted" fontSize="xs" fontWeight="bold">
          <HStack><Lock size={14} /><Text>AES-256 ENCRYPTED</Text></HStack>
          <HStack><ShieldCheck size={14} /><Text>LOCAL IDENTITY VAULT</Text></HStack>
        </HStack>
      </VStack>
    </Center>
  );
}

function ProviderChoice({ name, desc, color, icon, onClick }: any) {
  return (
    <PremiumCard onClick={onClick}>
      <VStack p="8" align="flex-start" gap="4" textAlign="left">
        <Circle size="12" bg={`${color}15`} color={color}>
          <Icon as={icon} size="md" />
        </Circle>
        <VStack align="flex-start" gap="1">
          <Text fontWeight="black" fontSize="lg">{name}</Text>
          <Text fontSize="sm" color="fg.muted">{desc}</Text>
        </VStack>
        <Button variant="ghost" color={color} p="0" gap="2" _hover={{ gap: "3" }}>
          Connect Now <ArrowRight size={16} />
        </Button>
      </VStack>
    </PremiumCard>
  );
}

function Center({ children, ...props }: any) {
  return <Box display="flex" alignItems="center" justifyContent="center" {...props}>{children}</Box>;
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
