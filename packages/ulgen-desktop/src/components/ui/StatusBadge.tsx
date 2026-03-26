import { Badge, HStack, Circle, Text, Box } from "@chakra-ui/react";

interface StatusBadgeProps {
  status: "connected" | "disconnected" | "error" | "loading";
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = {
    connected: { color: "green", text: label || "Live" },
    disconnected: { color: "gray", text: label || "Offline" },
    error: { color: "red", text: label || "Error" },
    loading: { color: "yellow", text: label || "Busy" },
  };

  const { color, text } = config[status];

  return (
    <Badge variant="subtle" textTransform="none">
      <HStack gap="2" px="3" py="1" borderRadius="full" bg={`${color}.500/10`} border="1px solid" borderColor={`${color}.500/20`}>
        <Box w="1.5" h="1.5" borderRadius="full" bg={`${color}.500`} shadow={`0 0 8px var(--chakra-colors-${color}-500)`} />
        <Text fontSize="10px" fontWeight="black" color={`${color}.500`} letterSpacing="0.05em">{text}</Text>
      </HStack>
    </Badge>
  );
}
