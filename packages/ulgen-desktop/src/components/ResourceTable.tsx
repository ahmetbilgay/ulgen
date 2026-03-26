import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import type { DiscoveryResult } from "../hooks/useAws";

type ResourceTableProps = {
  data: DiscoveryResult | null;
  isLoading: boolean;
  error: string | null;
  bg: string;
  border: string;
  muted: string;
};

export function ResourceTable({ data, isLoading, error, bg, border, muted }: ResourceTableProps) {
  if (isLoading) {
    return (
      <Box borderRadius="26px" p={6} bg={bg} borderWidth="1px" borderColor={border}>
        <Spinner size="sm" />
        <Text mt={3} color={muted}>
          Scanning active AWS regions...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box borderRadius="26px" p={6} bg={bg} borderWidth="1px" borderColor={border} color="red.400">
        {error}
      </Box>
    );
  }

  return (
    <Box borderRadius="26px" p={6} bg={bg} borderWidth="1px" borderColor={border}>
      <Box display="flex" justifyContent="space-between" alignItems="start" gap={3} mb={5}>
        <Box>
          <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color="colorPalette.400">
            Inventory
          </Text>
          <Heading mt={2} size="lg">
            Unified Resource List
          </Heading>
        </Box>
        <Text color={muted} fontWeight="medium">
          {data?.instances.length ?? 0} instances
        </Text>
      </Box>

      <Box overflowX="auto">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Name", "Region", "State", "Public IP", "Private IP"].map((column) => (
                <th
                  key={column}
                  style={{
                    padding: "12px 8px",
                    textAlign: "left",
                    color: muted,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    borderBottom: `1px solid ${border}`,
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.instances.length ? (
              data.instances.map((instance) => (
                <tr key={`${instance.region}:${instance.id}`}>
                  <Cell border={border}>{instance.name}</Cell>
                  <Cell border={border}>{instance.region}</Cell>
                  <Cell border={border}>{instance.state}</Cell>
                  <Cell border={border}>{instance.public_ip ?? "n/a"}</Cell>
                  <Cell border={border}>{instance.private_ip ?? "n/a"}</Cell>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: "32px 8px", textAlign: "center", color: muted }}>
                  No EC2 instances discovered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}

type CellProps = {
  children: React.ReactNode;
  border: string;
};

function Cell({ children, border }: CellProps) {
  return (
    <td
      style={{
        padding: "14px 8px",
        borderBottom: `1px solid ${border}`,
      }}
    >
      {children}
    </td>
  );
}
