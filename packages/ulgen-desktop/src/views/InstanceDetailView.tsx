"use client";

import { Box, Heading, Text, Stack, HStack, Badge, Button, Icon, SimpleGrid, IconButton, Input, VStack, Separator, Circle, Center, Spinner } from "@chakra-ui/react";
import { ChevronLeft, Terminal as TerminalIcon, Shield, Globe, Cpu, Hash, Play, Square, RefreshCcw, AlertTriangle, Activity, Key, User, FileKey, Plus, X, RefreshCw } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAws } from "@/hooks/useAws";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useConfigStore } from "@/store/useConfigStore";
import { XTerm, XTermHandle } from "@/components/ui/XTerm";
import { TerminalSession } from "@/components/TerminalSession";
import type { SecurityGroupSummary, ResourceMetrics } from "@/types/cloud";


export function InstanceDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeRegion, nodeCredentials, setNodeCredential } = useConfigStore();
  const { data, isLoading } = useAws(!!activeRegion);
  
  const [securityGroups, setSecurityGroups] = useState<SecurityGroupSummary[]>([]);
  const [metrics, setMetrics] = useState<ResourceMetrics | null>(null);
  const [isRebooting, setIsRebooting] = useState(false);
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState(false);

  // SSH Credentials from persistent store (with defaults)
  const credentials = (id && nodeCredentials[id]) || { username: "ec2-user", key_path: null };
  const sshUsername = credentials.username;
  const sshKeyPath = credentials.key_path;

  const instance = data?.instances.find(i => i.id === id);

  const [terminalSessions, setTerminalSessions] = useState<{ id: string; name: string }[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const addTerminalSession = useCallback(() => {
    const newId = Math.random().toString(36).substring(7);
    const newSession = { id: newId, name: `Session ${terminalSessions.length + 1}` };
    setTerminalSessions(prev => [...prev, newSession]);
    setActiveSessionId(newId);
  }, [terminalSessions.length]);

  const removeTerminalSession = useCallback((sid: string) => {
    setTerminalSessions(prev => {
        const filtered = prev.filter(s => s.id !== sid);
        if (activeSessionId === sid) {
            setActiveSessionId(filtered[filtered.length - 1]?.id || null);
        }
        return filtered;
    });
  }, [activeSessionId]);


  const handleReboot = async () => {
    if (!instance) return;
    setIsRebooting(true);
    try {
      await invoke("reboot_instance", { region: instance.region, instanceId: instance.id });
    } finally {
      setIsRebooting(false);
    }
  };

  // Initial session
  useEffect(() => {
    if (terminalSessions.length === 0 && instance) {
        addTerminalSession();
    }
  }, [instance, terminalSessions.length, addTerminalSession]);

  const handleRefreshMetrics = async () => {
    if (!id || !instance) return;
    setIsRefreshingMetrics(true);
    try {
      const result = await invoke<ResourceMetrics>("fetch_instance_metrics", { 
        region: instance.region, 
        instanceId: id 
      });
      setMetrics(result);
    } catch (e) {
      console.error("Failed to fetch metrics:", e);
    } finally {
      setIsRefreshingMetrics(false);
    }
  };

  useEffect(() => {
    if (id) {
      handleRefreshMetrics();
      const interval = setInterval(handleRefreshMetrics, 60000);
      return () => clearInterval(interval);
    }
  }, [id]);

  useEffect(() => {
    if (id && instance) {
        invoke<SecurityGroupSummary[]>("fetch_instance_security_groups", { 
            region: instance.region, 
            instanceId: id 
        })
            .then(setSecurityGroups)
            .catch(console.error);
    }
  }, [id, instance]);

  const selectPemFile = async () => {
    try {
      const selected = await invoke<string | null>("open_pem_dialog");
      if (selected && id) {
        await setNodeCredential(id, sshUsername, selected);
      }
    } catch (e) {
      console.error("Failed to open dialog:", e);
    }
  };

  if (isLoading || !instance) {
    return (
      <Center h="full">
        <VStack gap="4">
          <Spinner size="xl" color="blue.500" />
          <Text fontWeight="bold">Gathering Instance Data...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Stack gap="6" h="full">
      {/* Header Bar */}
      <HStack justify="space-between" bg="bg.panel" p="4" borderRadius="2xl" border="1px solid" borderColor="border">
        <HStack gap="4">
          <IconButton 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/app/servers")}
            aria-label="Back"
          >
            <ChevronLeft />
          </IconButton>
          <VStack align="start" gap="0">
            <HStack>
              <Heading size="md" fontWeight="bold">{instance.name || instance.id}</Heading>
              <Badge colorPalette={instance.state === "running" ? "green" : "gray"} variant="solid" size="xs">
                {instance.state.toUpperCase()}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="fg.muted">{instance.id} • {instance.instance_type} • {instance.region}</Text>
          </VStack>
        </HStack>
        
        <HStack gap="3">
          <Button size="sm" variant="ghost" colorPalette="red"><Square size={14} /> Stop</Button>
          <Button size="sm" variant="ghost" onClick={handleReboot} loading={isRebooting}><RefreshCw size={14} /> Reboot</Button>
        </HStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap="6" flex="1">
        <Stack gap="6">
          <PremiumCard hoverable={false}>
            <Box p="6">
              <Stack gap="4">
                <Heading size="sm" fontWeight="bold">INSTANCE DETAILS</Heading>
                <VStack align="stretch" gap="3">
                  <InfoRow icon={Cpu} label="Instance Type" value={instance.instance_type || "N/A"} />
                  <InfoRow icon={Hash} label="Private IP" value={instance.private_ip} />
                  <InfoRow icon={Hash} label="Public IP" value={instance.public_ip || "N/A"} />
                  <InfoRow icon={Shield} label="Groups" value={securityGroups.length.toString() || "0"} />
                  <InfoRow label="Launch Time" value={instance.launched_at ? new Date(instance.launched_at).toLocaleString() : "N/A"} />
                  <InfoRow label="Platform" value={instance.platform || "Linux"} />
                </VStack>

                <Separator />
                
                <VStack align="stretch" gap="4">
                    <Box>
                        <Text fontSize="10px" fontWeight="black" color="fg.muted" mb="2">SSH USERNAME</Text>
                        <Input 
                            size="sm" 
                            variant="subtle" 
                            value={sshUsername} 
                            onChange={(e) => { 
                              if (id) setNodeCredential(id, e.target.value, sshKeyPath); 
                            }} 
                            placeholder="e.g. ec2-user"
                        />
                    </Box>
                    <Box>
                        <Text fontSize="10px" fontWeight="black" color="fg.muted" mb="2">IDENTITY FILE (.PEM)</Text>
                        <HStack gap="2">
                            <Box flex="1" bg="bg.muted" px="3" py="1.5" borderRadius="md" border="1px solid" borderColor="border">
                                <Text fontSize="xs" truncate color={sshKeyPath ? "fg" : "fg.muted"}>
                                    {sshKeyPath ? sshKeyPath.split('/').pop() : "No file selected"}
                                </Text>
                            </Box>
                            <IconButton 
                                aria-label="Select Key" 
                                size="sm" 
                                variant="outline" 
                                onClick={selectPemFile}
                            >
                                <FileKey size={16} />
                            </IconButton>
                        </HStack>
                    </Box>
                </VStack>
              </Stack>
            </Box>
          </PremiumCard>

          <PremiumCard hoverable={false}>
            <Box p="6">
              <Stack gap="4">
                <HStack justify="space-between">
                  <Heading size="sm" fontWeight="bold">METRICS</Heading>
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
                </VStack>
              </Stack>
            </Box>
          </PremiumCard>
        </Stack>

        <Stack gap="6" gridColumn={{ lg: "span 2" }}>
          <PremiumCard hoverable={false} flex="1">
            <Box p="0" h="full" display="flex" flexDirection="column">
              {/* Tab Bar */}
              <HStack 
                bg="bg.panel" 
                px="4" 
                pt="2" 
                gap="1" 
                borderBottom="1px solid" 
                borderColor="border"
                overflowX="auto"
                css={{
                    "&::-webkit-scrollbar": { display: "none" }
                }}
              >
                {terminalSessions.map(session => (
                    <Box
                        key={session.id}
                        px="4"
                        py="2"
                        cursor="pointer"
                        borderRadius="t-lg"
                        bg={activeSessionId === session.id ? "bg.muted" : "transparent"}
                        border="1px solid"
                        borderColor={activeSessionId === session.id ? "border" : "transparent"}
                        borderBottom="none"
                        position="relative"
                        onClick={() => setActiveSessionId(session.id)}
                        _hover={{ bg: activeSessionId === session.id ? "bg.muted" : "bg.muted/30" }}
                        minW="120px"
                    >
                        <HStack justify="space-between">
                            <HStack gap="2">
                                <TerminalIcon size={12} />
                                <Text fontSize="10px" fontWeight="bold" whiteSpace="nowrap">{session.name}</Text>
                            </HStack>
                            <Box 
                                as="span" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTerminalSession(session.id);
                                }}
                                opacity="0.4"
                                _hover={{ opacity: 1 }}
                            >
                                <X size={10} />
                            </Box>
                        </HStack>
                        {activeSessionId === session.id && (
                            <Box position="absolute" bottom="-1px" left="0" right="0" h="2px" bg="blue.500" />
                        )}
                    </Box>
                ))}
                
                <IconButton 
                    aria-label="New Session" 
                    size="xs" 
                    variant="ghost" 
                    onClick={addTerminalSession}
                    ml="2"
                >
                    <Plus size={14} />
                </IconButton>
              </HStack>
              
              <Box 
                flex="1" 
                bg="black"
                minH="500px"
                position="relative"
              >
                {terminalSessions.map(session => (
                    <TerminalSession 
                        key={session.id}
                        id={session.id}
                        instance={instance}
                        username={sshUsername}
                        keyPath={sshKeyPath}
                        active={activeSessionId === session.id}
                        onClose={removeTerminalSession}
                    />
                ))}
                
                {terminalSessions.length === 0 && (
                    <Center h="full">
                        <VStack gap="2">
                            <TerminalIcon size={40} opacity="0.2" />
                            <Text color="fg.muted">No active terminal sessions.</Text>
                            <Button size="sm" variant="outline" onClick={addTerminalSession}>
                                Spawn New Session
                            </Button>
                        </VStack>
                    </Center>
                )}
              </Box>
            </Box>
          </PremiumCard>

          <PremiumCard hoverable={false}>
            <Box p="6">
              <HStack justify="space-between" mb="3">
                <Heading size="xs" fontWeight="black" color="fg.muted">SECURITY PERIMETER</Heading>
                {securityGroups.some(sg => sg.rules.some((r: any) => r.source === "0.0.0.0/0")) && (
                  <Badge colorPalette="red" variant="subtle" size="xs">
                    LOW ISOLATION DETECTED
                  </Badge>
                )}
              </HStack>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="2">
                {securityGroups.flatMap(sg => sg.rules).slice(0, 6).map((rule, idx) => (
                  <HStack key={idx} justify="space-between" p="1.5" borderRadius="md" bg="bg.muted/30" border="1px solid" borderColor="border">
                    <HStack gap="2">
                      <Badge size="xs" variant="outline">{rule.direction === "Inbound" ? "IN" : "OUT"}</Badge>
                      <Text fontSize="10px" fontWeight="bold">{rule.protocol.toUpperCase()}:{rule.port_range}</Text>
                    </HStack>
                    <Text fontSize="10px" color={rule.source === "0.0.0.0/0" ? "red.400" : "fg.muted"}>
                        {rule.source}
                    </Text>
                  </HStack>
                ))}
              </SimpleGrid>
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
        {icon && <Icon as={icon} size="xs" color="fg.muted" />}
        <Text fontSize="xs" color="fg.muted">{label}</Text>
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
        <Text fontSize="xs" color={isAvailable ? "blue.500" : "fg.muted"}>
          {isAvailable ? `${pct.toFixed(1)}%` : "N/A"}
        </Text>
      </HStack>
      <Box h="1.5" bg="bg.muted" borderRadius="full" overflow="hidden">
        {isAvailable && (
          <Box h="full" bgGradient="to-r" gradientFrom="blue.500" gradientTo="blue.300" w={`${pct}%`} />
        )}
      </Box>
    </Stack>
  );
}
