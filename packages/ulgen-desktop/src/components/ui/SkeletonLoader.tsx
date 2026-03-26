import { Skeleton, Stack, Box } from "@chakra-ui/react";

export function SkeletonLoader({ type = "card" }: { type?: "card" | "list" | "text" }) {
  if (type === "list") {
    return (
      <Stack gap="4" w="full">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} h="12" borderRadius="xl" />
        ))}
      </Stack>
    );
  }

  if (type === "text") {
    return (
      <Stack gap="2">
        <Skeleton h="4" w="70%" />
        <Skeleton h="4" w="40%" />
      </Stack>
    );
  }

  return (
    <Box p="6" border="1px solid" borderColor="border" borderRadius="2xl">
      <Stack gap="4">
        <Skeleton h="6" w="30%" />
        <Skeleton h="20" w="full" />
        <HStack gap="4">
          <Skeleton h="8" w="20" borderRadius="md" />
          <Skeleton h="8" w="20" borderRadius="md" />
        </HStack>
      </Stack>
    </Box>
  );
}

import { HStack } from "@chakra-ui/react";
