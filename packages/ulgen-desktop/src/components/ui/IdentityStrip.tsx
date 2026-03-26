import { Box, VStack, Circle, Text, IconButton, Portal, Input, Button, Badge, SimpleGrid, Icon, HStack, Heading, Flex } from "@chakra-ui/react";
import { Plus, Settings, Key, User, Cloud, X, Check, CheckCircle2, AlertCircle, Trash2, Globe } from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const MotionBox = motion(Box);

export function IdentityStrip() {
  const { 
    profiles, 
    switchProfile, 
    deleteProfile,
    credentialSummary, 
    credentialForm,
    setCredentialForm,
    connectProvider,
    credentialBusy,
    credentialNotice,
    connectionStatus,
    showAccountSettings,
    setShowAccountSettings
  } = useConfigStore();

  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);

  const getProviderColor = (provider: string) => {
    switch(provider.toLowerCase()) {
      case 'aws': return 'orange.500';
      case 'google': return 'blue.400';
      case 'azure': return 'blue.600';
      default: return 'blue.500';
    }
  };

  return (
    <>
      <Box 
        w="72px" 
        h="100vh" 
        bg="bg.panel" 
        borderRight="1px solid" 
        borderColor="border.muted"
        py="4"
        display="flex"
        flexDirection="column"
        alignItems="center"
        zIndex="100"
        position="relative"
      >
        <VStack gap="6" flex="1" w="full">
          {/* App Logo */}
          <Circle size="12" bg="blue.600" color="white" mb="2" fontWeight="black" fontSize="xl" cursor="pointer" boxShadow="0 0-15px var(--chakra-colors-blue-600)66">
            U
          </Circle>

          <Box h="1px" w="10" bg="border.muted" />

          {/* Profiles List */}
          <VStack gap="3" w="full">
            {profiles.map((profile) => {
              const isActive = credentialSummary?.account_name === profile.name;
              const color = getProviderColor(profile.provider);
              const displayName = profile.name || `${profile.provider.toUpperCase()} Account`;
              
              return (
                <Box 
                  key={profile.name} 
                  position="relative" 
                  w="full" 
                  display="flex" 
                  justifyContent="center"
                  onMouseEnter={() => setHoveredProfile(profile.name)}
                  onMouseLeave={() => setHoveredProfile(null)}
                >
                  <AnimatePresence>
                    {isActive && (
                        <MotionBox 
                          initial={{ height: 0 }}
                          animate={{ height: "20px" }}
                          exit={{ height: 0 }}
                          position="absolute"
                          left="0"
                          top="50%"
                          transform="translateY(-50%)"
                          w="4px"
                          bg="blue.400"
                          borderRadius="0 4px 4px 0"
                        />
                    )}
                  </AnimatePresence>

                  <VStack 
                    as="button"
                    onClick={() => switchProfile(profile.name)}
                    w="12"
                    h="12"
                    borderRadius={isActive ? "xl" : "2xl"}
                    bg={isActive ? color : "bg.muted/30"}
                    color={isActive ? "white" : "fg.muted"}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{ 
                      borderRadius: "xl", 
                      bg: isActive ? color : color, 
                      color: "white",
                      transform: "scale(1.05)"
                    }}
                    justify="center"
                    align="center"
                    boxShadow={isActive ? `0 0 20px ${color}66` : "none"}
                  >
                    <Text fontWeight="black" fontSize="sm">
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </VStack>

                  {/* Discord-style Tooltip */}
                  <AnimatePresence>
                    {hoveredProfile === profile.name && (
                      <Portal>
                        <MotionBox
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          position="fixed"
                          left="82px"
                          top={`${(profiles.indexOf(profile) * 60) + 120}px`} // Rough calculation, better using refs in production
                          bg="bg.panel"
                          p="4"
                          borderRadius="2xl"
                          border="1px solid"
                          borderColor="border.muted"
                          boxShadow="2xl"
                          zIndex="2000"
                          pointerEvents="none"
                          minW="200px"
                        >
                          <VStack align="flex-start" gap="2">
                            <HStack justify="space-between" w="full">
                              <Badge colorPalette={profile.provider === 'aws' ? 'orange' : 'blue'} size="xs" variant="solid">
                                {profile.provider.toUpperCase()}
                              </Badge>
                              {isActive && <Badge colorPalette="green" size="xs">ACTIVE</Badge>}
                            </HStack>
                            <Text fontWeight="black" fontSize="md" lineHeight="shorter">{displayName}</Text>
                            <Box h="1px" w="full" bg="border.muted" my="1" />
                            <VStack align="flex-start" gap="1">
                              <HStack gap="2">
                                <Key size={10} color="var(--chakra-colors-fg-muted)" />
                                <Text fontSize="10px" color="fg.muted" fontWeight="bold">{profile.preview}</Text>
                              </HStack>
                              <HStack gap="2">
                                <Globe size={10} color="var(--chakra-colors-fg-muted)" />
                                <Text fontSize="10px" color="fg.muted" fontWeight="bold">{profile.default_region}</Text>
                              </HStack>
                            </VStack>
                          </VStack>
                          
                          {/* Tooltip Arrow */}
                          <Box 
                            position="absolute" 
                            left="-6px" 
                            top="20px" 
                            w="12px" 
                            h="12px" 
                            bg="bg.panel" 
                            borderLeft="1px solid" 
                            borderBottom="1px solid" 
                            borderColor="border.muted"
                            transform="rotate(45deg)"
                          />
                        </MotionBox>
                      </Portal>
                    )}
                  </AnimatePresence>
                </Box>
              );
            })}

            <IconButton 
              aria-label="Add Provider" 
              title="Add Cloud Provider"
              variant="ghost" 
              size="lg" 
              w="12" 
              h="12" 
              borderRadius="2xl" 
              bg="bg.muted/20"
              color="green.400"
              border="1px dashed"
              borderColor="green.500/30"
              _hover={{ borderRadius: "xl", bg: "green.500", color: "white", borderStyle: "solid" }}
              onClick={() => {
                setCredentialForm({
                  account_name: "",
                  access_key_id: "",
                  secret_access_key: "",
                  default_region: "us-east-1"
                });
                setShowAccountSettings(true);
              }}
            >
              <Plus size={24} />
            </IconButton>
          </VStack>
        </VStack>

        <VStack gap="4" mt="auto">
          <IconButton 
            variant="ghost" 
            aria-label="Account Portal" 
            title="Identity Console"
            size="md" 
            borderRadius="xl"
            color="fg.muted"
            _hover={{ color: "fg", bg: "bg.muted" }}
            onClick={() => setShowAccountSettings(true)}
          >
            <Settings size={20} />
          </IconButton>
        </VStack>
      </Box>

      {/* Quick Identity Modal */}
      <AnimatePresence>
        {showAccountSettings && (
          <Portal>
            <Box position="fixed" inset="0" bg="black/60" backdropFilter="blur(4px)" zIndex="1000" onClick={() => setShowAccountSettings(false)}>
              <Flex align="center" justify="center" h="full" p="8">
                <MotionBox
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  bg="bg.panel"
                  w="full"
                  maxW="1100px"
                  maxH="90vh"
                  borderRadius="3xl"
                  border="1px solid"
                  borderColor="border.muted"
                  boxShadow="dark-lg"
                  overflow="hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Flex h="full">
                    {/* Modal Sidebar (Profile List) */}
                    <Box w="300px" borderRight="1px solid" borderColor="border.muted" p="6" bg="bg.muted/30">
                      <VStack align="stretch" gap="6">
                        <HStack justify="space-between" mb="2">
                          <VStack align="flex-start" gap="0">
                            <Text fontWeight="black" fontSize="xs" color="blue.500" letterSpacing="0.1em">IDENTITY_VAULT</Text>
                            <Text fontSize="xl" fontWeight="black">Profiles</Text>
                          </VStack>
                          <IconButton aria-label="Close" variant="ghost" size="sm" onClick={() => setShowAccountSettings(false)}>
                            <X size={16} />
                          </IconButton>
                        </HStack>

                        <VStack gap="2" align="stretch">
                          {profiles.map(p => (
                            <HStack 
                              key={p.name} 
                              p="3" 
                              bg={credentialSummary?.account_name === p.name ? "blue.500/10" : "transparent"}
                              border="1px solid"
                              borderColor={credentialSummary?.account_name === p.name ? "blue.500/30" : "transparent"}
                              borderRadius="xl"
                              cursor="pointer"
                              _hover={{ bg: "bg.subtle" }}
                              onClick={() => switchProfile(p.name)}
                              justify="space-between"
                            >
                              <VStack align="flex-start" gap="0">
                                <Text fontSize="sm" fontWeight="bold">{p.name || `${p.provider.toUpperCase()} Account`}</Text>
                                <Text fontSize="10px" color="fg.muted">{p.preview}</Text>
                              </VStack>
                              <HStack gap="1">
                                {credentialSummary?.account_name === p.name && <Badge colorPalette="green" size="xs" variant="solid">ACTIVE</Badge>}
                                <IconButton 
                                  aria-label="Delete" 
                                  variant="ghost" 
                                  size="xs" 
                                  color="red.500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteProfile(p.name);
                                  }}
                                >
                                  <Trash2 size={12} />
                                </IconButton>
                              </HStack>
                            </HStack>
                          ))}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            w="full" 
                            mt="2"
                            justifyContent="center" 
                            gap="2" 
                            color="blue.500"
                            borderStyle="dashed"
                            onClick={() => setCredentialForm({ 
                              account_name: "", 
                              access_key_id: "", 
                              secret_access_key: "", 
                              default_region: "us-east-1" 
                            })}
                          >
                            <Plus size={14} /> Add New
                          </Button>
                        </VStack>
                      </VStack>
                    </Box>

                    {/* Modal Content (Edit Form) */}
                    <Box flex="1" p="8" overflowY="auto">
                      <VStack align="stretch" gap="10">
                        <Box>
                          <Heading size="lg" fontWeight="black">Identity Configuration</Heading>
                          <Text color="fg.muted" fontSize="sm">Define your cloud access context and operational secrets.</Text>
                        </Box>

                        <SimpleGrid columns={2} gap="6">
                          <Box>
                            <Text fontSize="xs" fontWeight="black" mb="2" color="fg.muted" letterSpacing="0.1em">PROFILE ALIAS</Text>
                            <Input 
                              placeholder="e.g. AWS_CORE_PRODUCTION" 
                              variant="subtle" 
                              value={credentialForm.account_name}
                              onChange={e => setCredentialForm({...credentialForm, account_name: e.target.value})}
                            />
                          </Box>
                          <Box>
                            <Text fontSize="xs" fontWeight="black" mb="2" color="fg.muted" letterSpacing="0.1em">DEFAULT REGION</Text>
                            <Input 
                              placeholder="us-east-1" 
                              variant="subtle"
                              value={credentialForm.default_region}
                              onChange={e => setCredentialForm({...credentialForm, default_region: e.target.value})}
                            />
                          </Box>
                          <Box>
                            <Text fontSize="xs" fontWeight="black" mb="2" color="fg.muted" letterSpacing="0.1em">ACCESS KEY ID</Text>
                            <Input 
                              placeholder="AKIA..." 
                              variant="subtle"
                              value={credentialForm.access_key_id}
                              onChange={e => setCredentialForm({...credentialForm, access_key_id: e.target.value})}
                            />
                          </Box>
                          <Box>
                            <Text fontSize="xs" fontWeight="black" mb="2" color="fg.muted" letterSpacing="0.1em">SECRET ACCESS KEY</Text>
                            <Input 
                              type="password" 
                              placeholder="••••••••••••••••" 
                              variant="subtle"
                              value={credentialForm.secret_access_key}
                              onChange={e => setCredentialForm({...credentialForm, secret_access_key: e.target.value})}
                            />
                          </Box>
                        </SimpleGrid>

                        {credentialNotice && (
                          <Box p="4" bg={connectionStatus?.ok ? "green.900/10" : "blue.900/10"} borderRadius="xl" border="1px solid" borderColor={connectionStatus?.ok ? "green.500" : "blue.500"}>
                            <HStack gap="3">
                              <Icon as={connectionStatus?.ok ? CheckCircle2 : AlertCircle} color={connectionStatus?.ok ? "green.400" : "blue.400"} />
                              <Text fontSize="xs" fontWeight="medium">{credentialNotice}</Text>
                            </HStack>
                          </Box>
                        )}

                        <HStack justify="flex-end" gap="4">
                          <Button variant="ghost" onClick={() => setShowAccountSettings(false)}>Dismiss</Button>
                          <Button colorPalette="blue" px="10" borderRadius="xl" onClick={connectProvider} loading={credentialBusy}>Authorize & Connect</Button>
                        </HStack>
                      </VStack>
                    </Box>
                  </Flex>
                </MotionBox>
              </Flex>
            </Box>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
}
