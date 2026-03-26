"use client";

import { Box, Heading, Text, Stack, SimpleGrid, HStack, VStack, Badge, Circle, Icon, Button, Spinner, Table, IconButton, Tabs, Input, Textarea, Field } from "@chakra-ui/react";
import { Shield, AlertTriangle, CheckCircle2, Globe, Lock, Search, RefreshCw, Eye, Plus, Trash2, X, Settings2, ArrowRight } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useAws } from "@/hooks/useAws";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useConfigStore } from "@/store/useConfigStore";
import { motion, AnimatePresence } from "framer-motion";

interface SecurityRisk {
  instance_id: string;
  instance_name: string;
  group_id: string;
  group_name: string;
  protocol: string;
  port: number | string;
  source: string;
  severity: "high" | "medium" | "low";
}

interface SecurityGroup {
  id: string;
  name: string;
  rules: any[];
}

const MotionBox = (motion as any).create ? (motion as any).create(Box) : motion(Box);

export function SecurityView() {
  const { activeRegion } = useConfigStore();
  const { data, isLoading: isAwsLoading } = useAws();
  
  const [risks, setRisks] = useState<SecurityRisk[]>([]);
  const [allSGs, setAllSGs] = useState<SecurityGroup[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState("audit");
  
  // Create SG State
  const [newSG, setNewSG] = useState({ name: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);

  const fetchAllSecurityGroups = async () => {
    try {
      const sgs = await invoke<SecurityGroup[]>("list_all_security_groups", { region: activeRegion });
      setAllSGs(sgs);
    } catch (e) {
      console.error("Failed to fetch all SGs:", e);
    }
  };

  const auditSecurity = async () => {
    if (!data?.instances || data.instances.length === 0) return;
    
    setIsAuditing(true);
    const discoveredRisks: SecurityRisk[] = [];

    try {
      const auditPromises = data.instances.map(async (instance) => {
        try {
          const sgs = await invoke<any[]>("fetch_instance_security_groups", {
            region: instance.region,
            instanceId: instance.id
          });

          sgs.forEach(sg => {
            sg.rules.forEach((rule: any) => {
              const isPublic = rule.source === "0.0.0.0/0";
              const sensitivePorts = [22, 3389, 21, 23, 3306, 5432];
              
              // Handle port ranges "22-22" or "all" or specific number
              let isSensitive = false;
              if (rule.port_range === "all") {
                  isSensitive = true;
              } else {
                  const parts = rule.port_range.split("-");
                  const start = parseInt(parts[0]);
                  const end = parts.length > 1 ? parseInt(parts[1]) : start;
                  isSensitive = sensitivePorts.some(p => p >= start && p <= end);
              }
              
              if (isPublic) {
                discoveredRisks.push({
                  instance_id: instance.id,
                  instance_name: instance.name || instance.id,
                  group_id: sg.id,
                  group_name: sg.name,
                  protocol: rule.protocol,
                  port: rule.port_range,
                  source: rule.source,
                  severity: isSensitive ? "high" : "medium"
                });
              }
            });
          });
        } catch (e) {
          console.error(`Failed to audit ${instance.id}:`, e);
        }
      });

      await Promise.all(auditPromises);
      setRisks(discoveredRisks.sort((a, b) => {
        const severityMap = { high: 0, medium: 1, low: 2 };
        return severityMap[a.severity] - severityMap[b.severity];
      }));
      
      // Also refresh the management list
      fetchAllSecurityGroups();
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    if (!isAwsLoading && data?.instances) {
      auditSecurity();
    }
  }, [isAwsLoading, data?.instances, activeRegion]);

  const handleCreateSG = async () => {
    if (!newSG.name) return;
    setIsCreating(true);
    try {
        await invoke("create_security_group", {
            region: activeRegion,
            name: newSG.name,
            description: newSG.description || "Created via Ulgen Watchtower"
        });
        setNewSG({ name: "", description: "" });
        fetchAllSecurityGroups();
    } catch (e) {
        console.error("Failed to create SG:", e);
    } finally {
        setIsCreating(false);
    }
  };

  const handleRevokeRule = async (sgId: string, rule: any) => {
    try {
        // We need to parse port_range back to from/to
        let fromPort = 0;
        let toPort = 65535;
        if (rule.port_range !== "all") {
             const parts = rule.port_range.split("-");
             fromPort = parseInt(parts[0]);
             toPort = parts.length > 1 ? parseInt(parts[1]) : fromPort;
        }

        await invoke("revoke_security_group_ingress", {
            region: activeRegion,
            securityGroupId: sgId,
            rule: {
                cidr: rule.source,
                protocol: rule.protocol,
                from_port: fromPort,
                to_port: toPort,
                description: rule.description
            }
        });
        auditSecurity();
    } catch (e) {
        console.error("Failed to revoke rule:", e);
    }
  };

  const highRisks = risks.filter(r => r.severity === "high").length;

  return (
    <Stack gap="8">
      <Box>
        <HStack justify="space-between" align="flex-end">
          <VStack align="flex-start" gap="1">
            <Text fontSize="xs" fontWeight="black" color="red.500" letterSpacing="0.4em" textTransform="uppercase">Security Watchtower</Text>
            <Heading size="3xl" fontWeight="900" letterSpacing="-0.04em">Network Perimeter</Heading>
            <Text color="fg.muted" fontSize="lg">Proactive inspection and management of security landscapes.</Text>
          </VStack>
          <HStack gap="3">
              <Button 
                variant="outline" 
                size="sm" 
                borderRadius="xl" 
                onClick={auditSecurity}
                loading={isAuditing}
              >
                <RefreshCw size={14} style={{ marginRight: '8px' }} />
                Re-Audit
              </Button>
              <Button 
                colorPalette="blue"
                size="sm" 
                borderRadius="xl" 
                onClick={() => setActiveTab("manage")}
              >
                <Plus size={14} style={{ marginRight: '8px' }} />
                New Group
              </Button>
          </HStack>
        </HStack>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
        <RiskStat 
          label="Detected Risks" 
          value={risks.length.toString()} 
          icon={Shield} 
          color={risks.length > 0 ? "orange.500" : "green.500"} 
        />
        <RiskStat 
          label="Critical Exposures" 
          value={highRisks.toString()} 
          icon={AlertTriangle} 
          color={highRisks > 0 ? "red.500" : "green.500"} 
        />
        <RiskStat 
          label="Total Groups" 
          value={allSGs.length.toString()} 
          icon={Globe} 
          color="blue.500" 
        />
      </SimpleGrid>

      <Box>
        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
          <Tabs.List bg="bg.muted" p="1" borderRadius="2xl" border="none">
            <Tabs.Trigger value="audit" borderRadius="xl">
               <Shield size={14} style={{ marginRight: '8px' }} />
               Risk Audit
            </Tabs.Trigger>
            <Tabs.Trigger value="manage" borderRadius="xl">
               <Settings2 size={14} style={{ marginRight: '8px' }} />
               Manage Groups
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="audit" mt="6">
            <AnimatePresence mode="wait">
              <MotionBox
                key="audit-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PremiumCard>
                  <Box p="6">
                    <VStack align="stretch" gap="6">
                      <HStack justify="space-between">
                         <Heading size="md" fontWeight="black">ACTIVE THREATS</Heading>
                         <Badge colorPalette="red" variant="subtle">{risks.length} EXPOSURES</Badge>
                      </HStack>
                      
                      {isAuditing ? (
                        <VStack py="20" gap="4">
                          <Spinner size="xl" color="blue.500" />
                          <Text fontWeight="bold">Scanning mesh network for vulnerabilities...</Text>
                        </VStack>
                      ) : risks.length > 0 ? (
                        <Box overflowX="auto">
                          <Table.Root size="sm" variant="line">
                            <Table.Header>
                              <Table.Row>
                                <Table.ColumnHeader>Severity</Table.ColumnHeader>
                                <Table.ColumnHeader>Instance</Table.ColumnHeader>
                                <Table.ColumnHeader>Port / Protocol</Table.ColumnHeader>
                                <Table.ColumnHeader>Source</Table.ColumnHeader>
                                <Table.ColumnHeader>Action</Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {risks.map((risk, idx) => (
                                <Table.Row key={idx} _hover={{ bg: "bg.muted/30" }}>
                                  <Table.Cell>
                                    <Badge colorPalette={risk.severity === 'high' ? 'red' : 'orange'} variant="solid" size="xs">
                                      {risk.severity.toUpperCase()}
                                    </Badge>
                                  </Table.Cell>
                                  <Table.Cell>
                                      <VStack align="flex-start" gap="0">
                                          <Text fontWeight="bold" fontSize="sm">{risk.instance_name}</Text>
                                          <Text fontSize="10px" color="fg.muted">{risk.group_name}</Text>
                                      </VStack>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Badge variant="outline" size="xs">{risk.protocol.toUpperCase()}: {risk.port}</Badge>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <HStack gap="1" color="red.400">
                                       <Globe size={12} />
                                       <Text fontSize="xs" fontWeight="bold">{risk.source}</Text>
                                    </HStack>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Button 
                                        variant="ghost" 
                                        size="xs" 
                                        color="red.500" 
                                        onClick={() => handleRevokeRule(risk.group_id, {
                                            source: risk.source,
                                            protocol: risk.protocol,
                                            port_range: risk.port.toString()
                                        })}
                                    >
                                      <Lock size={12} style={{ marginRight: '4px' }} /> Revoke
                                    </Button>
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table.Root>
                        </Box>
                      ) : (
                        <VStack py="20" gap="2" border="1px dashed" borderColor="border.muted" borderRadius="2xl">
                          <CheckCircle2 size={48} color="var(--chakra-colors-green-500)" />
                          <Text fontWeight="black" fontSize="xl">Shields Up. No risks found.</Text>
                          <Text color="fg.muted">Your network perimeter in {activeRegion} is currently isolated.</Text>
                        </VStack>
                      )}
                    </VStack>
                  </Box>
                </PremiumCard>
              </MotionBox>
            </AnimatePresence>
          </Tabs.Content>

          <Tabs.Content value="manage" mt="6">
            <VStack align="stretch" gap="6">
                {/* Creation Form */}
                <PremiumCard>
                    <Box p="6">
                        <VStack align="stretch" gap="4">
                            <Text fontWeight="black" fontSize="sm" letterSpacing="0.1em" color="blue.500">PROVISION NEW SECURITY BOUNDARY</Text>
                            <HStack gap="4">
                                <Box flex="1">
                                    <Input 
                                        placeholder="Group Name (e.g. WebApp-Firewall)" 
                                        variant="subtle" 
                                        value={newSG.name}
                                        onChange={(e) => setNewSG({...newSG, name: e.target.value})}
                                    />
                                </Box>
                                <Box flex="2">
                                    <Input 
                                        placeholder="Description of this security tier..." 
                                        variant="subtle" 
                                        value={newSG.description}
                                        onChange={(e) => setNewSG({...newSG, description: e.target.value})}
                                    />
                                </Box>
                                <Button colorPalette="blue" onClick={handleCreateSG} loading={isCreating}>
                                    Initialize Group
                                </Button>
                            </HStack>
                        </VStack>
                    </Box>
                </PremiumCard>

                {/* List of Groups */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
                    {allSGs.map(sg => (
                        <PremiumCard key={sg.id}>
                            <Box p="6">
                                <VStack align="stretch" gap="4">
                                    <HStack justify="space-between">
                                        <VStack align="flex-start" gap="0">
                                            <Text fontWeight="black" fontSize="lg">{sg.name}</Text>
                                            <Text fontSize="10px" color="fg.muted" fontFamily="mono">{sg.id}</Text>
                                        </VStack>
                                        <IconButton aria-label="Delete" variant="ghost" size="sm" color="red.500" onClick={async () => {
                                            if(window.confirm("Are you sure you want to decommission this security group?")) {
                                                await invoke("delete_security_group", { region: activeRegion, securityGroupId: sg.id });
                                                fetchAllSecurityGroups();
                                            }
                                        }}>
                                            <Trash2 size={16} />
                                        </IconButton>
                                    </HStack>

                                    <Box h="1px" bg="border.muted" />

                                    <VStack align="stretch" gap="2">
                                        <Text fontSize="10px" fontWeight="black" color="fg.muted">INBOUND POLICIES</Text>
                                        {sg.rules.filter(r => r.direction === 'Inbound').length === 0 ? (
                                            <Text fontSize="xs" color="fg.muted" fontStyle="italic">No inbound rules defined.</Text>
                                        ) : (
                                            <Stack gap="2">
                                                {sg.rules.filter(r => r.direction === 'Inbound').map((rule, idx) => (
                                                    <HStack key={idx} justify="space-between" bg="bg.muted/50" p="2" borderRadius="lg">
                                                        <HStack gap="3">
                                                            <Badge size="xs" variant="outline">{rule.protocol.toUpperCase()}</Badge>
                                                            <Text fontSize="xs" fontWeight="bold">{rule.port_range}</Text>
                                                            <ArrowRight size={10} color="gray" />
                                                            <Text fontSize="xs" fontFamily="mono">{rule.source}</Text>
                                                        </HStack>
                                                        <IconButton aria-label="Revoke" variant="ghost" size="xs" color="red.400" onClick={() => handleRevokeRule(sg.id, rule)}>
                                                            <X size={12} />
                                                        </IconButton>
                                                    </HStack>
                                                ))}
                                            </Stack>
                                        )}
                                    </VStack>
                                </VStack>
                            </Box>
                        </PremiumCard>
                    ))}
                </SimpleGrid>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Stack>
  );
}

function RiskStat({ label, value, icon, color }: any) {
  return (
    <PremiumCard>
      <Box p="6">
        <HStack justify="space-between">
          <VStack align="flex-start" gap="1">
            <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">{label}</Text>
            <Text fontSize="3xl" fontWeight="black">{value}</Text>
          </VStack>
          <Circle size="12" bg={`${color}15`} color={color}>
            <Icon as={icon} size="md" />
          </Circle>
        </HStack>
      </Box>
    </PremiumCard>
  );
}
