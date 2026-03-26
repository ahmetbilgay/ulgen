import { Box } from "@chakra-ui/react";

type ThemeIconProps = {
  mode: "light" | "dark";
};

export function ThemeIcon({ mode }: ThemeIconProps) {
  if (mode === "light") {
    return (
      <Box as="span" display="inline-flex" alignItems="center" justifyContent="center" w="16px" h="16px">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 1.4V3.1M8 12.9V14.6M1.4 8H3.1M12.9 8H14.6M3.3 3.3L4.5 4.5M11.5 11.5L12.7 12.7M12.7 3.3L11.5 4.5M4.5 11.5L3.3 12.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </Box>
    );
  }

  return (
    <Box as="span" display="inline-flex" alignItems="center" justifyContent="center" w="16px" h="16px">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10.9 1.9a5.9 5.9 0 1 0 3.2 10.8A6.6 6.6 0 0 1 10.9 1.9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </Box>
  );
}
