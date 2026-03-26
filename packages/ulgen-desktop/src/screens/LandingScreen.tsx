import { Box, Button, Grid, GridItem, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppPalette } from "../hooks/useAppPalette";
import { ThemeIcon } from "../components/ThemeIcon";

const SLIDES = [
  {
    title: "Connect AWS",
    body: "Add your keys locally and keep control on your device.",
  },
  {
    title: "See your servers",
    body: "List EC2 instances in one clean dashboard instead of ten AWS tabs.",
  },
  {
    title: "Work faster",
    body: "Move into keys, security, and access without leaving the app shell.",
  },
];

export function LandingScreen() {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = useState(0);
  const {
    pageBg,
    text,
    muted,
    accent,
    border,
    panel,
    ctaBg,
    ctaHover,
    ctaText,
    subtleBg,
    subtleText,
    soft,
    isDark,
    toggleTheme,
  } = useAppPalette();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % SLIDES.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  const slide = SLIDES[slideIndex];

  return (
    <Box minH="100vh" bg={pageBg} color={text} px={{ base: 4, md: 5, xl: 8 }} py={{ base: 4, md: 5 }} overflow="hidden">
      <Grid
        minH="calc(100vh - 32px)"
        templateColumns={{ base: "1fr", lg: "minmax(0,1.05fr) minmax(360px,0.95fr)" }}
        gap={{ base: 5, md: 6, lg: 8 }}
        maxW="1180px"
        mx="auto"
        alignItems="center"
      >
        <GridItem>
          <Stack gap={{ base: 4, md: 5, lg: 6 }} maxW="600px">
            <HStack justify="space-between" align="center">
              <Text textTransform="uppercase" letterSpacing="0.26em" fontSize="xs" fontWeight="bold" color={accent}>
                Sovereign Cloud Workspace
              </Text>
              <Button borderRadius="full" bg={subtleBg} color={subtleText} _hover={{ bg: soft }} onClick={toggleTheme}>
                <HStack gap={2}>
                  <ThemeIcon mode={isDark ? "light" : "dark"} />
                  <Text>{isDark ? "Light" : "Dark"}</Text>
                </HStack>
              </Button>
            </HStack>

            <Stack gap={{ base: 2, md: 3 }}>
              <Text
                fontSize={{ base: "4xl", sm: "5xl", md: "6xl", xl: "8xl" }}
                lineHeight="0.86"
                letterSpacing="-0.09em"
                fontWeight="black"
              >
                ULGEN
              </Text>
              <Heading
                fontSize={{ base: "2xl", sm: "3xl", md: "4xl", xl: "5xl" }}
                lineHeight="0.94"
                letterSpacing="-0.06em"
                maxW="10ch"
              >
                Simple cloud ops.
              </Heading>
              <Text maxW="32rem" color={muted} fontSize={{ base: "sm", md: "md", xl: "lg" }} lineHeight="1.7">
                Connect your cloud, see your servers, manage access, and move without getting buried in provider UI noise.
              </Text>
            </Stack>

            <HStack gap={2} wrap="wrap" color={muted} fontSize={{ base: "xs", md: "sm" }}>
              <Text>Local-first</Text>
              <Text>•</Text>
              <Text>AWS first</Text>
              <Text>•</Text>
              <Text>Servers</Text>
              <Text>•</Text>
              <Text>Keys</Text>
              <Text>•</Text>
              <Text>Security</Text>
            </HStack>
          </Stack>
        </GridItem>

        <GridItem>
          <Box
            borderRadius={{ base: "28px", md: "32px" }}
            p={{ base: 5, md: 6, xl: 7 }}
            bg={panel}
            borderWidth="1px"
            borderColor={border}
            className="hero-card"
            maxW={{ base: "none", lg: "440px" }}
            ml={{ base: 0, lg: "auto" }}
          >
            <Stack gap={{ base: 4, md: 5 }}>
              <Stack gap={2}>
                <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
                  Start here
                </Text>
                <Heading fontSize={{ base: "xl", sm: "2xl", md: "3xl" }} lineHeight="1.02" letterSpacing="-0.04em">
                  Enter the workspace
                </Heading>
                <Text color={muted} lineHeight="1.7" fontSize={{ base: "sm", md: "md" }}>
                  No account required for now. Add AWS inside the app and start managing infrastructure.
                </Text>
              </Stack>

              <Box
                w="full"
                borderRadius="24px"
                borderWidth="1px"
                borderColor={border}
                bg={soft}
                px={{ base: 4, md: 6 }}
                py={{ base: 4, md: 5 }}
                className="feature-slider"
              >
                <Text textTransform="uppercase" letterSpacing="0.18em" fontSize="xs" fontWeight="bold" color={accent}>
                  {slide.title}
                </Text>
                <Text mt={3} color={muted} lineHeight="1.7" fontSize={{ base: "sm", md: "md" }} className="feature-slide">
                  {slide.body}
                </Text>
                <HStack mt={4} justify="start" gap={2}>
                  {SLIDES.map((item, index) => (
                    <Box
                      key={item.title}
                      h="6px"
                      w={index === slideIndex ? "28px" : "10px"}
                      borderRadius="full"
                      bg={index === slideIndex ? accent : border}
                      transition="all 0.2s ease"
                    />
                  ))}
                </HStack>
              </Box>

              <Button
                borderRadius="full"
                h={{ base: "48px", md: "56px" }}
                bg={ctaBg}
                color={ctaText}
                _hover={{ bg: ctaHover }}
                onClick={() => navigate("/app")}
              >
                Enter workspace
              </Button>

              <Text color={muted} fontSize={{ base: "xs", md: "sm" }}>
                Social login will come later. The current focus is AWS key setup and direct management inside the app.
              </Text>
            </Stack>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}
