import { Box, Heading, Text, Stack, HStack, Badge, Button, Icon, SimpleGrid, IconButton, Input, VStack, Separator } from "@chakra-ui/react";
import { ChevronLeft, Terminal as TerminalIcon, Shield, Globe, Cpu, Hash, Play, Square, RefreshCcw, AlertTriangle, Activity } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useAws } from "@/hooks/useAws";
import { useTerminal } from "@/hooks/useTerminal";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useConfigStore } from "@/store/useConfigStore";
import type { SecurityGroupSummary, ResourceMetrics } from "@/types/cloud";
import React from "react";

export function InstanceDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeRegion } = useConfigStore();
  const { data, isLoading } = useAws(!!activeRegion);
  
  const [securityGroups, setSecurityGroups] = useState<SecurityGroupSummary[]>([]);
  const [metrics, setMetrics] = useState<ResourceMetrics | null>(null);
  const [isRebooting, setIsRebooting] = useState(false);
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState(false);

  const instance = data?.instances.find(i => i.id === id);
  const { output, input, setInput, send, connect, isConnecting, isRunning } = useTerminal(instance || null, "ec2-user");

  useEffect(() => {
    if (instance) {
      void invoke<SecurityGroupSummary[]>("fetch_instance_security_groups", { 
        region: instance.region, 
        instanceId: instance.id 
      }).then(setSecurityGroups);
      
      void invoke<ResourceMetrics>("fetch_instance_metrics", { 
        region: instance.region, 
        instanceId: instance.id 
      }).then(setMetrics);
    }
  }, [instance]);

  const handleReboot = async () => {
    if (!instance) return;
    setIsRebooting(true);
    try {
      await invoke("reboot_instance", { region: instance.region, instanceId: instance.id });
    } finally {
      setIsRebooting(false);
    }
  };

  const handleRefreshMetrics = async () => {
    if (!instance) return;
    setIsRefreshingMetrics(true);
    try {
      const result = await invoke<ResourceMetrics>("fetch_instance_metrics", { 
        region: instance.region, 
        instanceId: instance.id 
      });
      setMetrics(result);
    } finally {
      setIsRefreshingMetrics(false);
    }
  };

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
                  <InfoRow icon={Shield} label="Groups" value={securityGroups.length || "0"} />
                </VStack>
              </Stack>
            </Box>
          </PremiumCard>

          <PremiumCard hoverable={false}>
            <Box p="6">
              <Stack gap="4">
                <Heading size="sm">Quick Actions</Heading>
                <SimpleGrid columns={2} gap="3">
                  <Button variant="surface" colorPalette="green" size="sm" disabled={instance.state === "running"}><Play size={14} /> Start</Button>
                  <Button variant="surface" colorPalette="red" size="sm" disabled={instance.state !== "running"}><Square size={14} /> Stop</Button>
                  <Button 
                    variant="surface" 
                    colorPalette="gray" 
                    size="sm" 
                    w="full" 
                    gridColumn="span 2" 
                    onClick={handleReboot}
                    loading={isRebooting}
                  >
                    <RefreshCcw size={14} /> Reboot Instance
                  </Button>
                </SimpleGrid>
              </Stack>
            </Box>
          </PremiumCard>

          <PremiumCard hoverable={false}>
            <Box p="6">
              <Stack gap="4">
                <HStack justify="space-between">
                  <Heading size="sm">Performance Insights</Heading>
                  <IconButton 
                    size="xs" 
                    variant="ghost" 
                    aria-label="Refresh Metrics" 
                    onClick={handleRefreshMetrics}
                    loading={isRefreshingMetrics}
                  >
                    <RefreshCcw size={14} />
                  </IconButton>
                </HStack>
                <VStack align="stretch" gap="4">
                  <MetricProgress label="CPU Utilization" value={metrics?.cpu_percentage} />
                  <MetricProgress label="RAM Usage" value={metrics?.memory_used_bytes && metrics?.memory_total_bytes ? (metrics.memory_used_bytes / metrics.memory_total_bytes) * 100 : undefined} />
                  <MetricProgress label="Disk Space" value={metrics?.disk_usage_percentage} />
                </VStack>
              </Stack>
            </Box>
          </PremiumCard>
        </Stack>

        <Stack gap="6" gridColumn={{ lg: "span 2" }}>
          {/* Security Audit Panel */}
          <PremiumCard hoverable={false}>
            <Box p="6">
              <HStack justify="space-between" mb="4">
                <HStack>
                  <Shield size={18} />
                  <Heading size="sm">Security Audit</Heading>
                </HStack>
                {securityGroups.some(sg => sg.rules.some((r: any) => r.source === "0.0.0.0/0" && r.is_allowed)) && (
                  <Badge colorPalette="red" variant="subtle">
                    <AlertTriangle size={12} style={{ marginRight: '4px' }} /> Low Isolation
                  </Badge>
                )}
              </HStack>
              
              <Stack gap="3">
                {securityGroups.flatMap(sg => sg.rules).slice(0, 5).map((rule, idx) => (
                  <HStack key={idx} justify="space-between" p="2" borderRadius="lg" bg="whiteAlpha.50" border="1px solid" borderColor="border">
                    <HStack gap="3">
                      <Badge size="xs" colorPalette={rule.direction === "Inbound" ? "blue" : "purple"}>
                        {rule.direction}
                      </Badge>
                      <Text fontSize="xs" fontWeight="bold">{rule.protocol.toUpperCase()}</Text>
                      <Text fontSize="xs" color="muted">{rule.port_range}</Text>
                    </HStack>
                    <HStack>
                      <Text fontSize="xs" color={rule.source === "0.0.0.0/0" ? "red.400" : "muted"}>
                        {rule.source}
                      </Text>
                      {rule.source === "0.0.0.0/0" && <AlertTriangle size={12} color="red" />}
                    </HStack>
                  </HStack>
                ))}
                {securityGroups.length === 0 && <Text fontSize="xs" color="muted">No security rules discovered.</Text>}
              </Stack>
            </Box>
          </PremiumCard>

          <PremiumCard hoverable={false} flex="1">
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
                minH="300px"
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

function MetricProgress({ label, value }: { label: string, value?: number | null }) {
  const isAvailable = value !== undefined && value !== null;
  const pct = value ?? 0;
  return (
    <Stack gap="1.5">
      <HStack justify="space-between">
        <Text fontSize="xs" fontWeight="medium">{label}</Text>
        <Text fontSize="xs" color={isAvailable ? "brand.500" : "muted"}>
          {isAvailable ? `${pct.toFixed(1)}%` : "N/A (Connect SSH)"}
        </Text>
      </HStack>
      <Box h="1.5" bg="whiteAlpha.100" borderRadius="full" overflow="hidden">
        {isAvailable && (
          <Box h="full" bgGradient="to-r" gradientFrom="brand.500" gradientTo="blue.400" w={`${pct}%`} />
        )}
      </Box>
    </Stack>
  );
}
