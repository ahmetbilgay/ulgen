import { Badge, Box, Button, Flex, Heading, HStack, Input, Stack, Text } from "@chakra-ui/react";
import type { Dispatch, SetStateAction } from "react";
import type { AwsCredentialInput, AwsCredentialSummary } from "../store/useWorkspaceStore";

type ProviderModalProps = {
  panel: string;
  shell: string;
  border: string;
  muted: string;
  accent: string;
  soft: string;
  primaryButtonBg: string;
  primaryButtonHover: string;
  primaryButtonText: string;
  secondaryButtonBg: string;
  secondaryButtonText: string;
  providerModalStep: "select" | "connect";
  onClose: () => void;
  onSelectAws: () => void;
  credentialForm: AwsCredentialInput;
  onCredentialChange: Dispatch<SetStateAction<AwsCredentialInput>>;
  credentialSummary: AwsCredentialSummary | null;
  credentialNotice: string | null;
  onConnect: () => Promise<void>;
  busy: boolean;
};

export function ProviderModal({
  panel,
  shell,
  border,
  muted,
  accent,
  soft,
  primaryButtonBg,
  primaryButtonHover,
  primaryButtonText,
  secondaryButtonBg,
  secondaryButtonText,
  providerModalStep,
  onClose,
  onSelectAws,
  credentialForm,
  onCredentialChange,
  credentialSummary,
  credentialNotice,
  onConnect,
  busy,
}: ProviderModalProps) {
  return (
    <Box className="modal-backdrop" onClick={onClose}>
      <Box
        className="modal-shell"
        width="min(760px, calc(100vw - 32px))"
        borderRadius="32px"
        p={6}
        bg={shell}
        borderWidth="1px"
        borderColor={border}
        onClick={(event) => event.stopPropagation()}
      >
        <Flex justify="space-between" align="start" gap={4}>
          <Box>
            <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
              Provider setup
            </Text>
            <Heading mt={2} size="lg">
              {providerModalStep === "select" ? "Add a provider" : "Connect AWS"}
            </Heading>
            <Text mt={3} color={muted} maxW="2xl">
              Add providers from inside the dashboard. AWS is available now and the structure is ready for more clouds later.
            </Text>
          </Box>
          <Button variant="ghost" borderRadius="full" onClick={onClose}>
            Close
          </Button>
        </Flex>

        {providerModalStep === "select" ? (
          <Stack gap={3} mt={6}>
            <ProviderOptionCard
              label="Amazon Web Services"
              state="Available"
              accent={accent}
              border={border}
              bg={panel}
              muted={muted}
              onClick={onSelectAws}
            />
            <ProviderOptionCard
              label="Google Cloud"
              state="Coming soon"
              accent={muted}
              border={border}
              bg={panel}
              muted={muted}
              disabled
            />
            <ProviderOptionCard
              label="Microsoft Azure"
              state="Coming soon"
              accent={muted}
              border={border}
              bg={panel}
              muted={muted}
              disabled
            />
          </Stack>
        ) : null}

        {providerModalStep === "connect" ? (
          <Box mt={6}>
            <Stack gap={4}>
              <LabeledField
                label="Access key ID"
                value={credentialForm.access_key_id}
                onChange={(value) => onCredentialChange((current) => ({ ...current, access_key_id: value }))}
                placeholder="AKIA..."
              />
              <LabeledField
                label="Secret access key"
                value={credentialForm.secret_access_key}
                onChange={(value) => onCredentialChange((current) => ({ ...current, secret_access_key: value }))}
                placeholder="AWS secret access key"
                type="password"
              />
              <LabeledField
                label="Session token"
                value={credentialForm.session_token ?? ""}
                onChange={(value) => onCredentialChange((current) => ({ ...current, session_token: value }))}
                placeholder="Optional for temporary credentials"
              />
              <LabeledField
                label="Default region"
                value={credentialForm.default_region}
                onChange={(value) => onCredentialChange((current) => ({ ...current, default_region: value }))}
                placeholder="us-east-1"
              />
            </Stack>

            {credentialSummary?.is_configured ? (
              <Box mt={5} p={4} borderRadius="18px" borderWidth="1px" borderColor={border}>
                <Text color={muted} fontSize="sm">
                  Saved profile
                </Text>
                <Text mt={1} fontWeight="bold">
                  {credentialSummary.access_key_preview ?? "Configured"}
                </Text>
                <Text mt={1} color={muted}>
                  Region: {credentialSummary.default_region ?? credentialForm.default_region}
                </Text>
              </Box>
            ) : null}

            {credentialNotice ? (
              <Box mt={5} p={4} borderRadius="18px" borderWidth="1px" borderColor={border} bg={soft}>
                <Text color={muted} lineHeight="1.6">
                  {credentialNotice}
                </Text>
              </Box>
            ) : null}

            <HStack mt={6} gap={3} wrap="wrap">
              <Button
                borderRadius="full"
                bg={primaryButtonBg}
                color={primaryButtonText}
                _hover={{ bg: primaryButtonHover }}
                onClick={() => void onConnect()}
                disabled={busy}
              >
                Add provider
              </Button>
              <Button borderRadius="full" bg={secondaryButtonBg} color={secondaryButtonText} _hover={{ bg: soft }} onClick={onClose}>
                Close
              </Button>
            </HStack>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

type ProviderOptionCardProps = {
  label: string;
  state: string;
  accent: string;
  border: string;
  bg: string;
  muted: string;
  disabled?: boolean;
  onClick?: () => void;
};

function ProviderOptionCard({
  label,
  state,
  accent,
  border,
  bg,
  muted,
  disabled = false,
  onClick,
}: ProviderOptionCardProps) {
  return (
    <Button
      justifyContent="space-between"
      alignItems="center"
      h="auto"
      px={5}
      py={5}
      borderRadius="22px"
      borderWidth="1px"
      borderColor={border}
      bg={bg}
      color="inherit"
      onClick={onClick}
      disabled={disabled}
      _hover={disabled ? undefined : { transform: "translateY(-1px)", borderColor: accent }}
    >
      <Stack align="start" gap={1}>
        <Text fontWeight="bold">{label}</Text>
        <Text fontSize="sm" color={muted}>
          {state}
        </Text>
      </Stack>
      <Badge
        borderRadius="full"
        px={3}
        py={1}
        bg={disabled ? "transparent" : "rgba(121, 210, 255, 0.10)"}
        color={accent}
        borderWidth="1px"
        borderColor={disabled ? border : accent}
      >
        {state}
      </Badge>
    </Button>
  );
}

type LabeledFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
};

function LabeledField({ label, value, placeholder, onChange, type = "text" }: LabeledFieldProps) {
  return (
    <Box>
      <Text mb={2} fontSize="sm" fontWeight="medium">
        {label}
      </Text>
      <Input value={value} type={type} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} borderRadius="16px" />
    </Box>
  );
}
