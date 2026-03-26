import { Box, Heading, Text, Stack, HStack, Badge, Button, Icon, SimpleGrid, IconButton, Input, VStack } from "@chakra-ui/react";
import { ChevronLeft, Terminal as TerminalIcon, Shield, Globe, Cpu, Hash, Play, Square, RefreshCcw } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAws } from "@/hooks/useAws";
import { useTerminal } from "@/hooks/useTerminal";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useConfigStore } from "@/store/useConfigStore";
import React from "react";

export function InstanceDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeRegion } = useConfigStore();
  const { data, isLoading } = useAws(!!activeRegion);
  
  const instance = data?.instances.find(i => i.id === id);
  const { output, input, setInput, send, connect, isConnecting, isRunning } = useTerminal(instance || null, "ec2-user");

  if (isLoading) return <SkeletonLoader type="card" />;
  if (!instance) return <Box p="10">Instance not found.</Box>;

  return (
    <Stack gap="6">
      <HStack>
        <IconButton variant="ghost" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </IconButton>
        <VStack align="flex-start" gap="0">
          <HStack gap="3">
            <Heading size="xl">{instance.name || instance.id}</Heading>
            <Badge colorPalette={instance.state === "running" ? "green" : "gray"}>{instance.state}</Badge>
          </HStack>
          <Text color="muted" fontSize="sm">{instance.id} • {instance.region}</Text>
        </VStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap="6">
        <Stack gap="6" gridColumn={{ lg: "span 1" }}>
          <PremiumCard hoverable={false}>
            <Box p="6">
              <Stack gap="4">
                <Heading size="sm">Instance Specifications</Heading>
                <VStack align="stretch" gap="3">
                  <InfoRow icon={Cpu} label="Instance Type" value={instance.instance_type || "N/A"} />
                  <InfoRow icon={Hash} label="Private IP" value={instance.private_ip || "N/A"} />
                  <InfoRow icon={Globe} label="Public IP" value={instance.public_ip || "N/A"} />
                  <InfoRow icon={Shield} label="Security" value="Default Group" />
                </VStack>
              </Stack>
            </Box>
          </PremiumCard>

          <PremiumCard hoverable={false}>
            <Box p="6">
              <Stack gap="4">
                <Heading size="sm">Quick Actions</Heading>
                <SimpleGrid columns={2} gap="3">
                  <Button variant="surface" colorPalette="green" size="sm"><Play size={14} /> Start</Button>
                  <Button variant="surface" colorPalette="red" size="sm"><Square size={14} /> Stop</Button>
                  <Button variant="surface" colorPalette="gray" size="sm" w="full" gridColumn="span 2"><RefreshCcw size={14} /> Reboot Instance</Button>
                </SimpleGrid>
              </Stack>
            </Box>
          </PremiumCard>
        </Stack>

        <Stack gap="6" gridColumn={{ lg: "span 2" }}>
          <PremiumCard hoverable={false} h="full">
            <Box p="6" h="full" display="flex" flexDirection="column">
              <HStack justify="space-between" mb="4">
                <HStack>
                  <TerminalIcon size={18} />
                  <Heading size="sm">Cloud Terminal</Heading>
                </HStack>
                <Button 
                  size="xs" 
                  colorPalette={isRunning ? "red" : "brand"} 
                  onClick={connect}
                  loading={isConnecting}
                >
                  {isRunning ? "Disconnect" : "Connect via SSH"}
                </Button>
              </HStack>
              
              <Box 
                flex="1" 
                bg="black" 
                p="4" 
                borderRadius="xl" 
                fontFamily="mono" 
                fontSize="xs" 
                color="green.400"
                overflowY="auto"
                minH="400px"
              >
                <pre style={{ whiteSpace: 'pre-wrap' }}>
                  {output || (isConnecting ? "Establishing secure connection..." : "Terminal session inactive. Click connect to start.")}
                </pre>
              </Box>

              <HStack mt="4">
                <Input 
                  placeholder="Enter command..." 
                  variant="subtle" 
                  size="sm" 
                  borderRadius="lg"
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && send()}
                  disabled={!isRunning}
                />
                <Button size="sm" colorPalette="brand" onClick={send} disabled={!isRunning}>Execute</Button>
              </HStack>
            </Box>
          </PremiumCard>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}

function InfoRow({ icon, label, value }: any) {
  return (
    <HStack justify="space-between">
      <HStack gap="2">
        <Icon as={icon} size="xs" color="muted" />
        <Text fontSize="xs" color="muted">{label}</Text>
      </HStack>
      <Text fontSize="xs" fontWeight="bold">{value}</Text>
    </HStack>
  );
}
