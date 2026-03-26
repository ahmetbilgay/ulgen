"use client";

import { Box, VStack, Heading, Text, Stack, Input, Button, HStack, Icon, Circle, Badge, SimpleGrid, IconButton } from "@chakra-ui/react";
import { Key, CheckCircle2, AlertCircle, ShieldCheck, Trash2, UserPlus, ArrowLeftRight, Plus, Cloud, ChevronRight, Settings2, Lock, Shield } from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const MotionBox = (motion as any).create ? (motion as any).create(Box) : motion(Box);

export function IdentityVaultView() {
  const { 
    credentialForm, 
    setCredentialForm, 
    connectProvider, 
    credentialBusy, 
    connectionStatus, 
    credentialNotice,
    credentialSummary,
    profiles,
    switchProfile,
    deleteProfile
  } = useConfigStore();

  const [isAdding, setIsAdding] = useState(profiles.length === 0);

  const handleSave = async () => {
    await connectProvider();
    if (connectionStatus?.ok) {
        setIsAdding(false);
    }
  };

  const handleAddNew = () => {
    setCredentialForm({
        account_name: "",
        access_key_id: "",
        secret_access_key: "",
        default_region: "us-east-1"
    });
    setIsAdding(true);
  };

  return (
    <Stack gap="10" maxW="1200px">
      <Box px="2">
        <HStack justify="space-between" align="flex-end">
          <VStack align="flex-start" gap="1">
            <Text fontSize="xs" fontWeight="black" color="blue.500" letterSpacing="0.4em" textTransform="uppercase">Security Foundation</Text>
            <Heading size="3xl" fontWeight="900" letterSpacing="-0.04em">Identity Vault</Heading>
            <Text color="fg.muted" fontSize="lg">Manage your encrypted cloud credentials and operational context.</Text>
          </VStack>
          {!isAdding && (
            <Button 
              colorPalette="blue" 
              variant="subtle" 
              gap="2" 
              borderRadius="xl"
              onClick={handleAddNew}
            >
              <Plus size={16} /> New Identity
            </Button>
          )}
        </HStack>
      </Box>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <MotionBox
            key="add-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PremiumCard hoverable={false}>
              <Box p="8">
                <VStack align="stretch" gap="8">
                  <HStack justify="space-between">
                    <VStack align="flex-start" gap="1">
                      <HStack gap="2">
                        <IconButton 
                          aria-label="Back" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsAdding(false)}
                          hidden={profiles.length === 0}
                        >
                          <ChevronRight style={{ transform: 'rotate(180deg)' }} />
                        </IconButton>
                        <Text fontWeight="black" fontSize="xs" textTransform="uppercase" letterSpacing="0.1em" color="blue.500">
                          {profiles.length === 0 ? "First Time Setup" : "Add Identity"}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="fg.muted">Establish a new operational context with encrypted credentials.</Text>
                    </VStack>
                    <Badge variant="surface" colorPalette="blue" px="3" borderRadius="xl">AWS PROVIDER</Badge>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="8">
                    <Box>
                      <Text fontSize="xs" fontWeight="black" mb="2" color="fg.muted" letterSpacing="0.05em" textTransform="uppercase">Vault Alias</Text>
                      <Input 
                        placeholder="e.g. CORE_PROD" 
                        variant="subtle"
                        size="lg"
                        value={credentialForm.account_name}
                        onChange={(e) => setCredentialForm({ ...credentialForm, account_name: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="black" mb="2" color="fg.muted" letterSpacing="0.05em" textTransform="uppercase">Operational Region</Text>
                      <Input 
                        placeholder="us-east-1" 
                        variant="subtle"
                        size="lg"
                        value={credentialForm.default_region}
                        onChange={(e) => setCredentialForm({ ...credentialForm, default_region: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="black" mb="2" color="fg.muted" letterSpacing="0.05em" textTransform="uppercase">Access Key ID</Text>
                      <Input 
                        placeholder="AKIA..." 
                        variant="subtle"
                        size="lg"
                        value={credentialForm.access_key_id}
                        onChange={(e) => setCredentialForm({ ...credentialForm, access_key_id: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="black" mb="2" color="fg.muted" letterSpacing="0.05em" textTransform="uppercase">Secret Access Key</Text>
                      <Input 
                        type="password" 
                        placeholder="••••••••••••••••" 
                        variant="subtle"
                        size="lg"
                        value={credentialForm.secret_access_key}
                        onChange={(e) => setCredentialForm({ ...credentialForm, secret_access_key: e.target.value })}
                      />
                    </Box>
                  </SimpleGrid>

                  {credentialNotice && (
                    <Box p="4" bg={connectionStatus?.ok ? "green.900/10" : "red.900/10"} borderRadius="xl" border="1px solid" borderColor={connectionStatus?.ok ? "green.500/20" : "red.500/20"}>
                      <HStack gap="3">
                        <Icon as={connectionStatus?.ok ? CheckCircle2 : AlertCircle} color={connectionStatus?.ok ? "green.400" : "red.400"} />
                        <Text fontSize="xs" fontWeight="medium">{credentialNotice}</Text>
                      </HStack>
                    </Box>
                  )}

                  <HStack justify="flex-end" gap="4">
                    {profiles.length > 0 && (
                      <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel Flush</Button>
                    )}
                    <Button 
                      colorPalette="blue" 
                      size="lg" 
                      px="12"
                      borderRadius="xl" 
                      onClick={handleSave}
                      loading={credentialBusy}
                    >
                      Authorize & Store
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </PremiumCard>
          </MotionBox>
        ) : (
          <MotionBox
            key="profile-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
              {profiles.map((profile) => {
                const isActive = credentialSummary?.account_name === profile.name;
                return (
                  <PremiumCard key={profile.name} hoverable={true}>
                    <Box p="6">
                      <VStack align="stretch" gap="5">
                        <HStack justify="space-between">
                          <Circle size="10" bg={isActive ? "blue.500/10" : "bg.muted"} color={isActive ? "blue.500" : "fg.muted"}>
                            <Lock size={20} />
                          </Circle>
                          {isActive && <Badge colorPalette="green" variant="subtle">ACTIVE</Badge>}
                        </HStack>

                        <VStack align="flex-start" gap="0">
                          <Text fontWeight="black" fontSize="lg" letterSpacing="-0.01em">{profile.name}</Text>
                          <Text fontSize="xs" color="fg.muted">{profile.provider.toUpperCase()} • {profile.preview}</Text>
                        </VStack>

                        <HStack gap="4" pt="2">
                           <VStack align="flex-start" gap="0">
                             <Text fontSize="10px" color="fg.muted" fontWeight="bold">MGMT REGION</Text>
                             <Text fontSize="xs" fontWeight="bold">{profile.default_region}</Text>
                           </VStack>
                        </HStack>

                        <Box h="1px" bg="border.muted" />

                        <HStack justify="space-between">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            gap="2" 
                            color={isActive ? "blue.500" : "fg"}
                            disabled={isActive}
                            onClick={() => switchProfile(profile.name)}
                          >
                            <ArrowLeftRight size={14} /> {isActive ? "Connected" : "Switch Context"}
                          </Button>
                          <HStack gap="1">
                            <IconButton 
                              aria-label="Edit" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setCredentialForm({
                                    account_name: profile.name,
                                    access_key_id: "", 
                                    secret_access_key: "",
                                    default_region: profile.default_region
                                });
                                setIsAdding(true);
                              }}
                            >
                              <Settings2 size={16} />
                            </IconButton>
                            <IconButton 
                              aria-label="Delete" 
                              variant="ghost" 
                              size="sm" 
                              color="red.500"
                              onClick={() => deleteProfile(profile.name)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </HStack>
                        </HStack>
                      </VStack>
                    </Box>
                  </PremiumCard>
                );
              })}

              {/* Add New Tile */}
              <Box 
                as="button"
                onClick={handleAddNew}
                h="full"
                minH="240px"
                border="2px dashed"
                borderColor="border.muted"
                borderRadius="3xl"
                transition="all 0.2s"
                _hover={{ borderColor: "blue.500", bg: "blue.500/5", transform: "translateY(-4px)" }}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap="4"
              >
                <Circle size="12" bg="bg.muted" color="fg.muted">
                  <Plus size={24} />
                </Circle>
                <VStack gap="1">
                  <Text fontWeight="bold">Link New Identity</Text>
                  <Text fontSize="xs" color="fg.muted">Add a cloud provider profile</Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </MotionBox>
        )}
      </AnimatePresence>

      <PremiumCard hoverable={false}>
        <Box p="6">
          <HStack gap="6">
             <Circle size="12" bg="green.500/10" color="green.500">
               <ShieldCheck size={24} />
             </Circle>
             <VStack align="flex-start" gap="0">
               <Text fontWeight="bold">Cryptographic Isolation</Text>
               <Text fontSize="xs" color="fg.muted">Ulgen uses hardware-backed AES-256 GCM encryption. Your secrets are never stored in plain text and never leave this node.</Text>
             </VStack>
          </HStack>
        </Box>
      </PremiumCard>
    </Stack>
  );
}
