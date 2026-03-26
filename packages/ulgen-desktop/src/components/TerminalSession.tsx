import React, { useRef, useCallback, useEffect } from "react";
import { Box, Text, Button, HStack, Badge, Spinner, Center } from "@chakra-ui/react";
import { XTerm, XTermHandle } from "./ui/XTerm";
import { useTerminal } from "@/hooks/useTerminal";
import type { InstanceSummary } from "@/types/cloud";
import { Terminal as TerminalIcon, Power, Play, AlertCircle } from "lucide-react";

interface TerminalSessionProps {
  id: string;
  instance: InstanceSummary;
  username: string;
  keyPath: string | null;
  active: boolean;
  onClose: (id: string) => void;
}

export function TerminalSession({ instance, username, keyPath, active, onClose, id }: TerminalSessionProps) {
  const xtermRef = useRef<XTermHandle>(null);

  const handleTerminalOutput = useCallback((data: string) => {
    xtermRef.current?.write(data);
  }, []);

  const { 
    isConnecting, 
    isRunning, 
    connect, 
    disconnect, 
    send, 
    notice 
  } = useTerminal(
    instance, 
    username, 
    keyPath || undefined, 
    handleTerminalOutput
  );

  const handleData = useCallback((data: string) => {
    send(data);
  }, [send]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box 
      display={active ? "flex" : "none"} 
      flexDirection="column" 
      h="full" 
      w="full"
      position="relative"
    >
      {/* Session Controls */}
      <HStack 
        justify="space-between" 
        bg="bg.muted/50" 
        px="4" 
        py="2" 
        borderBottom="1px solid" 
        borderColor="border"
      >
        <HStack gap="3">
          <Badge colorPalette={isRunning ? "green" : "red"} variant="solid" size="xs">
            {isRunning ? "LIVE" : "DISCONNECTED"}
          </Badge>
          <Text fontSize="xs" color="fg.muted" fontWeight="medium">
            {username}@{instance.name}
          </Text>
        </HStack>
        
        <HStack gap="2">
          {notice && (
             <HStack gap="1" color="fg.muted">
               <AlertCircle size={12} />
               <Text fontSize="10px" maxW="200px" truncate>{notice}</Text>
             </HStack>
          )}
          {!isRunning && !isConnecting && (
            <Button size="xs" variant="ghost" onClick={connect}>
              <Play size={12} /> Reconnect
            </Button>
          )}
          {isRunning && (
            <Button size="xs" variant="ghost" colorPalette="red" onClick={disconnect}>
              <Power size={12} /> Kill
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Terminal View */}
      <Box flex="1" position="relative" bg="black" overflow="hidden">
        {isConnecting && (
          <Center position="absolute" inset="0" bg="black/60" zIndex="10">
            <HStack gap="3">
                <Spinner size="sm" color="blue.500" />
                <Text fontSize="sm" color="white" fontWeight="bold">Establishing Secure Bridge...</Text>
            </HStack>
          </Center>
        )}
        <XTerm 
          ref={xtermRef} 
          onData={handleData} 
        />
      </Box>
    </Box>
  );
}
