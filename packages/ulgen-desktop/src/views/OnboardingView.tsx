import { Box, VStack, Heading, Text, Stack, Input, Button, HStack, Icon, Circle, SimpleGrid, Badge, Flex } from "@chakra-ui/react";
import { ShieldCheck, Key, Globe, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

export function OnboardingView() {
  const { credentialForm, setCredentialForm, connectProvider, credentialBusy, connectionStatus, credentialNotice } = useConfigStore();
  const [step, setStep] = useState(1);

  const handleNext = async () => {
    if (step === 3) {
      await connectProvider();
      // Only advance to success step if connection is truly OK
    } else {
      setStep(step + 1);
    }
  };

  // Watch for connection success to advance
  useEffect(() => {
    if (step === 3 && connectionStatus?.ok) {
      setStep(4);
    }
  }, [connectionStatus, step]);

  return (
    <Flex minH="100vh" bg="bg.panel" align="center" justify="center" p="6" overflow="hidden">
      <Box maxW="800px" w="full" position="relative">
        <VStack gap="10" align="stretch">
          <VStack gap="2" textAlign="center">
            <Badge colorPalette="blue" variant="surface" borderRadius="full" px="3">Step {step} of 4</Badge>
            <Heading size="3xl" letterSpacing="-0.03em" fontWeight="black">
              {step === 1 ? "Welcome to ULGEN" : "Cloud Connectivity"}
            </Heading>
            <Text color="fg.muted" fontSize="lg">
              {step === 1 ? "The next generation of infrastructure management." : "Securely connect ULGEN to your cloud environment."}
            </Text>
          </VStack>

          <HStack justify="center" gap="4">
            <StepIndicator active={step >= 1} label="Welcome" />
            <Box w="8" h="1px" bg="border" />
            <StepIndicator active={step >= 2} label="Provider" />
            <Box w="8" h="1px" bg="border" />
            <StepIndicator active={step >= 3} label="Details" />
            <Box w="8" h="1px" bg="border" />
            <StepIndicator active={step >= 4} label="Ready" />
          </HStack>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <MotionBox
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <PremiumCard hoverable={false}>
                  <VStack p="12" gap="8" textAlign="center">
                    <Box 
                      p="6" 
                      borderRadius="3xl" 
                      bg="blue.500/10"
                      border="1px solid"
                      borderColor="border.muted"
                    >
                      <ShieldCheck size={64} color="var(--chakra-colors-blue-500)" />
                    </Box>
                    <VStack gap="4">
                      <Heading size="xl">Infinite Scale, Absolute Control</Heading>
                      <Text color="fg.muted" maxW="500px">
                        ULGEN provides a unified, glassmorphic interface to manage your global infrastructure across AWS, and soon GCP & Azure.
                      </Text>
                    </VStack>
                  </VStack>
                </PremiumCard>
              </MotionBox>
            )}

            {step === 2 && (
              <MotionBox
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
                  <ProviderCard 
                    active={true} 
                    name="AWS" 
                    desc="Amazon Web Services" 
                    icon={ShieldCheck} 
                  />
                  <ProviderCard 
                    active={false} 
                    name="GCP" 
                    desc="Google Cloud (Soon)" 
                    icon={Globe} 
                  />
                  <ProviderCard 
                    active={false} 
                    name="Azure" 
                    desc="Microsoft Azure (Soon)" 
                    icon={Key} 
                  />
                </SimpleGrid>
              </MotionBox>
            )}

            {step === 3 && (
              <MotionBox
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <PremiumCard hoverable={false}>
                  <Stack gap="6" p="8">
                  <VStack align="flex-start" gap="1">
                    <Text fontWeight="bold" fontSize="lg">Connection Details</Text>
                    <Text fontSize="xs" color="fg.muted">Credentials are stored locally in your system's secure vault.</Text>
                  </VStack>
                  
                  <Stack gap="4">
                    <Box>
                      <Text fontSize="xs" fontWeight="black" mb="2" color="blue.500" letterSpacing="0.05em">ACCOUNT NAME (ALIAS)</Text>
                      <Input 
                        placeholder="e.g. Master-Production" 
                        bg="bg.muted" 
                        border="1px solid"
                        borderColor="border.muted"
                        borderRadius="xl"
                        _focus={{ borderColor: "blue.500", bg: "bg.muted" }}
                        value={credentialForm.account_name as string}
                        onChange={(e) => setCredentialForm({ ...credentialForm, account_name: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="black" mb="2" color="blue.500" letterSpacing="0.05em">ACCESS KEY ID</Text>
                      <Input 
                        placeholder="AKIA..." 
                        bg="bg.muted" 
                        border="1px solid"
                        borderColor="border.muted"
                        borderRadius="xl"
                        _focus={{ borderColor: "blue.500", bg: "bg.muted" }}
                        value={credentialForm.access_key_id}
                        onChange={(e) => setCredentialForm({ ...credentialForm, access_key_id: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="black" mb="2" color="blue.500" letterSpacing="0.05em">SECRET ACCESS KEY</Text>
                      <Input 
                        type="password" 
                        placeholder="••••••••••••••••" 
                        bg="bg.muted" 
                        border="1px solid"
                        borderColor="border.muted"
                        borderRadius="xl"
                        _focus={{ borderColor: "blue.500", bg: "bg.muted" }}
                        value={credentialForm.secret_access_key}
                        onChange={(e) => setCredentialForm({ ...credentialForm, secret_access_key: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="black" mb="2" color="blue.500" letterSpacing="0.05em">DEFAULT REGION</Text>
                      <Input 
                        placeholder="us-east-1" 
                        bg="bg.muted" 
                        border="1px solid"
                        borderColor="border.muted"
                        borderRadius="xl"
                        _focus={{ borderColor: "blue.500", bg: "bg.muted" }}
                        value={credentialForm.default_region}
                        onChange={(e) => setCredentialForm({ ...credentialForm, default_region: e.target.value })}
                      />
                    </Box>
                  </Stack>

                    {credentialNotice && (
                      <Box p="4" bg={connectionStatus?.ok ? "green.900/20" : "red.900/20"} borderRadius="xl" border="1px solid" borderColor={connectionStatus?.ok ? "green.500/30" : "red.500/30"} animation="fade-in 0.3s ease">
                        <HStack gap="3">
                          <Icon as={connectionStatus?.ok ? CheckCircle2 : AlertCircle} color={connectionStatus?.ok ? "green.400" : "red.400"} />
                          <Text fontSize="xs" fontWeight="medium">{credentialNotice}</Text>
                        </HStack>
                      </Box>
                    )}
                  </Stack>
                </PremiumCard>
              </MotionBox>
            )}

            {step === 4 && (
              <MotionBox
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                textAlign="center"
              >
                <PremiumCard hoverable={false}>
                  <VStack gap="8" p="12">
                    <Circle size="24" bg="blue.500" color="white" position="relative">
                      <CheckCircle2 size={48} />
                    </Circle>
                    <VStack gap="2">
                      <Heading size="2xl" fontWeight="black">Initialization Complete</Heading>
                      <Text color="fg.muted" fontSize="lg">ULGEN is now synchronized with your {credentialForm.account_name} account.</Text>
                    </VStack>
                    <Button colorPalette="blue" size="xl" w="full" borderRadius="2xl" onClick={() => window.location.href = '#/app/home'}>
                      Enter Operations Center
                    </Button>
                  </VStack>
                </PremiumCard>
              </MotionBox>
            )}
          </AnimatePresence>

          {step < 4 && (
            <HStack justify="space-between" mt="4">
              <Button variant="ghost" color="fg.muted" disabled={step === 1 || credentialBusy} onClick={() => setStep(step - 1)} _hover={{ color: "fg", bg: "bg.muted" }}>
                Previous
              </Button>
              <Button 
                colorPalette="blue" 
                size="lg" 
                borderRadius="2xl" 
                px="12"
                h="14"
                fontSize="md"
                fontWeight="bold"
                onClick={handleNext}
                loading={credentialBusy}
                disabled={step === 3 && (!credentialForm.access_key_id || !credentialForm.secret_access_key)}
              >
                {step === 3 ? "Test & Persist" : <HStack gap="2">Next Step <ArrowRight size={20} /></HStack>}
              </Button>
            </HStack>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}

function StepIndicator({ active, label }: { active: boolean; label: string }) {
  return (
    <VStack gap="2">
      <Circle size="3" bg={active ? "blue.500" : "border"} shadow={active ? "0 0 10px var(--chakra-colors-blue-500)" : "none"} />
      <Text fontSize="10px" fontWeight="bold" color={active ? "fg" : "fg.muted"}>{label.toUpperCase()}</Text>
    </VStack>
  );
}

function ProviderCard({ active, name, desc, icon }: any) {
  return (
    <PremiumCard hoverable={active} cursor={active ? "pointer" : "not-allowed"} opacity={active ? 1 : 0.5}>
      <VStack p="6" gap="4" borderColor={active ? "blue.500" : "transparent"} borderWidth="1px" borderRadius="2xl">
        <Icon as={icon} size="xl" color={active ? "blue.500" : "fg.muted"} />
        <VStack gap="1" textAlign="center">
          <Text fontWeight="bold">{name}</Text>
          <Text fontSize="xs" color="fg.muted">{desc}</Text>
        </VStack>
      </VStack>
    </PremiumCard>
  );
}
