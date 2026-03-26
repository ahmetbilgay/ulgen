import { Box, chakra, type BoxProps } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = chakra(motion.div) as any;

interface PremiumCardProps extends BoxProps {
  hoverable?: boolean;
}

/**
 * Premium glassmorphic card with spring animations and inner glow.
 * Optimized for the "Deep Space" theme.
 */
export function PremiumCard({ children, hoverable = true, ...props }: PremiumCardProps) {
  return (
    <MotionBox
      whileHover={hoverable ? { y: -2 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      bg="bg.panel"
      borderRadius="2xl"
      p="1"
      border="1px solid"
      borderColor="border.muted"
      position="relative"
      overflow="hidden"
      shadow="sm"
      {...props}
    >
      {children}
    </MotionBox>
  );
}
