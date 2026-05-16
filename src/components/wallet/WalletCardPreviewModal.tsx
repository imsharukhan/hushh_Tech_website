import { useEffect, useState, type MouseEvent } from "react";
import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { Eye, ExternalLink } from "lucide-react";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import type { WalletPreviewModel } from "../../services/walletPass";

interface WalletCardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: WalletPreviewModel | null;
  appleWalletSupported: boolean;
  appleWalletSupportMessage: string;
  onAddToAppleWallet?: () => void | Promise<void>;
  isApplePassLoading?: boolean;
  googleWalletAvailable: boolean;
  googleWalletSupportMessage: string;
  onAddToGoogleWallet?: () => void | Promise<void>;
  isGooglePassLoading?: boolean;
}

/* ── 24K bullion gold surface ── */
const BULLION_GOLD_SURFACE =
  "linear-gradient(138deg, #5C3A0A 0%, #8B6914 10%, #C49520 22%, #D4A930 34%, #F5D86A 48%, #ECC94B 58%, #C49520 72%, #8B6914 88%, #5C3A0A 100%)";
const BULLION_GOLD_GLOW =
  "radial-gradient(circle at 18% 16%, rgba(255,243,190,0.48), transparent 34%), radial-gradient(circle at 75% 38%, rgba(255,230,140,0.36), transparent 40%), radial-gradient(circle at 85% 80%, rgba(140,100,20,0.28), transparent 34%)";
const BULLION_GOLD_SHEEN =
  "linear-gradient(118deg, rgba(255,255,255,0) 12%, rgba(255,249,225,0.2) 28%, rgba(255,255,255,0.65) 47%, rgba(255,243,196,0.18) 62%, rgba(255,255,255,0) 80%)";
const BULLION_GOLD_FINISH =
  "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 16%, transparent 38%, transparent 68%, rgba(60,40,10,0.22) 100%)";

function formatPreviewMembershipId(membershipId: string) {
  const trimmedMembershipId = membershipId.trim();

  if (trimmedMembershipId.length <= 28) {
    return trimmedMembershipId;
  }

  return `${trimmedMembershipId.slice(0, 18)}…${trimmedMembershipId.slice(-6)}`;
}

function getHolderNameTypography(holderName: string) {
  const normalizedName = holderName.trim().replace(/\s+/g, " ");
  const words = normalizedName.length > 0 ? normalizedName.split(" ") : [];
  const nameLength = normalizedName.length;
  const longestWordLength = words.reduce(
    (longest, word) => Math.max(longest, word.length),
    0
  );

  if (nameLength > 32 || longestWordLength > 12 || words.length > 3) {
    return {
      fontSize: "clamp(1.12rem, 0.94rem + 1vw, 1.9rem)",
      lineHeight: "1.12",
      minHeight: "calc(1.12em * 2)",
    };
  }

  if (nameLength > 18 || longestWordLength > 8 || words.length > 1) {
    return {
      fontSize: "clamp(1.32rem, 1rem + 1.65vw, 2.35rem)",
      lineHeight: "1.1",
      minHeight: "calc(1.1em * 2)",
    };
  }

  return {
    fontSize: "clamp(1.7rem, 1.05rem + 3vw, 3.35rem)",
    lineHeight: "1.04",
    minHeight: "calc(1.04em * 2)",
  };
}

export default function WalletCardPreviewModal({
  isOpen,
  onClose,
  preview,
  appleWalletSupported,
  appleWalletSupportMessage,
  onAddToAppleWallet,
  isApplePassLoading = false,
  googleWalletAvailable,
  googleWalletSupportMessage,
  onAddToGoogleWallet,
  isGooglePassLoading = false,
}: WalletCardPreviewModalProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [supportsInteractiveTilt, setSupportsInteractiveTilt] = useState(false);
  const qrFrameSize = useBreakpointValue({ base: 98, sm: 112, md: 128 }) ?? 98;
  const qrPadding = useBreakpointValue({ base: 9, sm: 10, md: 12 }) ?? 9;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tiltSupportQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updatePreferences = () => {
      setReducedMotion(reducedMotionQuery.matches);
      setSupportsInteractiveTilt(tiltSupportQuery.matches);
    };

    updatePreferences();

    if (
      typeof reducedMotionQuery.addEventListener === "function" &&
      typeof tiltSupportQuery.addEventListener === "function"
    ) {
      reducedMotionQuery.addEventListener("change", updatePreferences);
      tiltSupportQuery.addEventListener("change", updatePreferences);
      return () => {
        reducedMotionQuery.removeEventListener("change", updatePreferences);
        tiltSupportQuery.removeEventListener("change", updatePreferences);
      };
    }

    reducedMotionQuery.addListener(updatePreferences);
    tiltSupportQuery.addListener(updatePreferences);
    return () => {
      reducedMotionQuery.removeListener(updatePreferences);
      tiltSupportQuery.removeListener(updatePreferences);
    };
  }, []);

  if (!preview) {
    return null;
  }

  const previewMembershipId = formatPreviewMembershipId(preview.membershipId);
  const holderNameTypography = getHolderNameTypography(preview.holderName);
  const qrSize = qrFrameSize - qrPadding * 2;
  const hasPublicProfileUrl = Boolean(preview.profileUrl);
  const enableCardTilt = supportsInteractiveTilt && !reducedMotion;
  const modalAppleSupportMessage = appleWalletSupportMessage
    ? "On iPhone, in Wallet-supported browsers."
    : appleWalletSupportMessage;
  const modalGoogleSupportMessage = googleWalletSupportMessage
    ? "Google Wallet soon."
    : googleWalletSupportMessage;
  const profileLinkDescription = hasPublicProfileUrl
    ? preview.profileUrl
    : "Shared soon";
  const sheenTranslateX = enableCardTilt ? rotation.y * 3.4 : 0;
  const sheenTranslateY = enableCardTilt ? rotation.x * -2.4 : 0;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!enableCardTilt) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const rotateY = ((offsetX / rect.width) - 0.5) * 3.2;
    const rotateX = (0.5 - offsetY / rect.height) * 3.2;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "xl" }} isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
      <ModalContent
        mx={{ base: 0, md: 4 }}
        my={{ base: 0, md: 8 }}
        maxW={{ base: "100vw", md: "min(100vw - 2rem, 64rem)" }}
        borderRadius={{ base: 0, md: "28px" }}
        bg="white"
        overflow="hidden"
      >
        <ModalHeader display="none" />
        <ModalCloseButton
          aria-label="Close wallet preview"
          top={4}
          right={4}
          w={10}
          h={10}
          borderRadius="full"
          bg="gray.100"
          _hover={{ bg: "gray.200" }}
          color="gray.600"
        />
        <ModalBody px={6} pt={10} pb={8}>
          <VStack spacing={5} align="stretch">
            {/* Onboarding-style heading block */}
            <Box>
              <Text
                fontSize="10px"
                letterSpacing="0.2em"
                textTransform="uppercase"
                color="gray.400"
                fontWeight="600"
                mb={2}
              >
                HUSHH GOLD
              </Text>
              <Text
                fontFamily="'Playfair Display', serif"
                fontSize={{ base: "2.25rem", md: "2.75rem" }}
                fontWeight="normal"
                lineHeight="1.1"
                letterSpacing="-0.02em"
                color="gray.900"
              >
                Hushh Gold{" "}
                <Text as="span" fontStyle="italic" color="gray.400">
                  Pass
                </Text>
              </Text>
              <Text fontSize="sm" color="gray.500" mt={2}>
                A polished gold preview of your Hushh investor membership card.
              </Text>
            </Box>

            <Box sx={{ perspective: "1600px" }}>
              <Box
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                data-testid="wallet-preview-shell"
                data-tilt-enabled={enableCardTilt ? "true" : "false"}
                transform={
                  enableCardTilt
                    ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.003, 1.003, 1.003)`
                    : "none"
                }
                transition={
                  enableCardTilt
                    ? "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)"
                    : "none"
                }
                sx={enableCardTilt ? { transformStyle: "preserve-3d" } : undefined}
              >
                <Box
                  position="relative"
                  mx="auto"
                  w="min(100%, 32rem)"
                  aspectRatio={1.586}
                  borderRadius="30px"
                  px={{ base: 4, sm: 5, md: 6 }}
                  py={{ base: 4, sm: 5, md: 6 }}
                  background={`${BULLION_GOLD_GLOW}, ${BULLION_GOLD_SURFACE}`}
                  color="#24190c"
                  border="1.5px solid rgba(255,240,190,0.6)"
                  boxShadow="0 32px 80px rgba(40, 28, 8, 0.36), 0 8px 24px rgba(80, 56, 12, 0.2), inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -14px 36px rgba(90, 60, 14, 0.22)"
                  overflow="hidden"
                >
                  {/* Inner border glow */}
                  <Box
                    position="absolute"
                    inset="10px"
                    borderRadius="24px"
                    border="1px solid rgba(255,248,220,0.38)"
                    pointerEvents="none"
                  />
                  <Box
                    position="absolute"
                    inset="0"
                    bg={BULLION_GOLD_FINISH}
                    pointerEvents="none"
                  />
                  <Box
                    position="absolute"
                    inset="-12% -18%"
                    bg={BULLION_GOLD_SHEEN}
                    opacity={0.84}
                    transform={`translate3d(${sheenTranslateX}px, ${sheenTranslateY}px, 0)`}
                    transition={
                      enableCardTilt
                        ? "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)"
                        : "none"
                    }
                    mixBlendMode="screen"
                    pointerEvents="none"
                  />

                  <Box
                    display="grid"
                    h="100%"
                    gridTemplateColumns="minmax(0, 1fr) auto"
                    gridTemplateRows="auto minmax(0, 1fr) auto"
                    columnGap={{ base: 3, md: 4 }}
                    rowGap={{ base: 3, md: 4 }}
                  >
                    <VStack align="flex-start" spacing={0.5} minW={0}>
                      <Text
                        fontSize="clamp(0.7rem, 0.58rem + 0.5vw, 0.9rem)"
                        letterSpacing="clamp(0.22em, 0.14em + 0.3vw, 0.34em)"
                        fontWeight="800"
                        color="#000000"
                        noOfLines={1}
                      >
                        {preview.badgeText}
                      </Text>
                      <Text
                        fontSize="clamp(0.62rem, 0.56rem + 0.22vw, 0.78rem)"
                        fontWeight="700"
                        letterSpacing="0.04em"
                        color="#000000"
                        noOfLines={1}
                      >
                        {preview.title}
                      </Text>
                    </VStack>
                    <Box
                      justifySelf="end"
                      alignSelf="start"
                      px={{ base: 2.5, sm: 3, md: 3.5 }}
                      py={{ base: 1.25, md: 1.75 }}
                      borderRadius="999px"
                      bg="rgba(20, 14, 5, 0.78)"
                      border="1px solid rgba(200,160,40,0.4)"
                      backdropFilter="blur(10px)"
                      maxW={{ base: "8.75rem", md: "9.5rem" }}
                      boxShadow="inset 0 1px 0 rgba(255,240,180,0.18), 0 8px 20px rgba(40, 28, 8, 0.28)"
                    >
                      <Text
                        fontSize="clamp(0.58rem, 0.54rem + 0.22vw, 0.76rem)"
                        fontWeight="700"
                        letterSpacing="0.16em"
                        textAlign="center"
                        noOfLines={1}
                        color="#E8C547"
                        textShadow="0 0 8px rgba(232,197,71,0.3)"
                      >
                        GOLD MEMBER
                      </Text>
                    </Box>

                    <VStack
                      gridColumn="1"
                      gridRow="2"
                      align="flex-start"
                      justify="flex-start"
                      spacing={{ base: 1, md: 1.5 }}
                      pt={{ base: 1.5, md: 1.75 }}
                      minW={0}
                    >
                      <Text
                        fontSize="clamp(0.74rem, 0.68rem + 0.24vw, 0.92rem)"
                        fontWeight="700"
                        letterSpacing="0.12em"
                        textTransform="uppercase"
                        color="#000000"
                        noOfLines={1}
                      >
                        {preview.organizationName}
                      </Text>
                      <Text
                        data-testid="wallet-preview-holder-name"
                        fontSize={holderNameTypography.fontSize}
                        fontWeight="700"
                        color="#000000"
                        lineHeight={holderNameTypography.lineHeight}
                        minH={holderNameTypography.minHeight}
                        noOfLines={2}
                        overflowWrap="anywhere"
                      >
                        {preview.holderName}
                      </Text>
                    </VStack>

                    <VStack
                      gridColumn="1"
                      gridRow="3"
                      align="flex-start"
                      justify="flex-end"
                      spacing={{ base: 1.5, md: 1.75 }}
                      minW={0}
                    >
                      {/* Investor class — luxury dark pill */}
                      <Box
                        data-testid="wallet-preview-investment-class"
                        px={{ base: 2.5, md: 3 }}
                        py={{ base: 1, md: 1.25 }}
                        borderRadius="999px"
                        bg="rgba(18, 12, 4, 0.8)"
                        border="1px solid rgba(220,180,60,0.35)"
                        boxShadow="inset 0 1px 0 rgba(255,240,180,0.12), 0 4px 12px rgba(30, 20, 6, 0.22)"
                      >
                        <Text
                          fontSize="clamp(0.6rem, 0.56rem + 0.2vw, 0.76rem)"
                          fontWeight="700"
                          letterSpacing="0.1em"
                          color="#E8C547"
                          noOfLines={1}
                          textShadow="0 0 6px rgba(232,197,71,0.25)"
                        >
                          Investor · {preview.investmentClass}
                        </Text>
                      </Box>
                      <Text
                        data-testid="wallet-preview-email"
                        fontSize="clamp(0.66rem, 0.62rem + 0.22vw, 0.82rem)"
                        fontWeight="700"
                        letterSpacing="0.03em"
                        color="#000000"
                        noOfLines={1}
                      >
                        {preview.email}
                      </Text>
                    </VStack>

                    <Box
                      gridColumn="2"
                      gridRow="3"
                      justifySelf="end"
                      alignSelf="end"
                      data-testid="wallet-preview-qr"
                      boxSize={`${qrFrameSize}px`}
                      bg="rgba(255,252,247,0.98)"
                      border="1px solid rgba(154, 109, 29, 0.18)"
                      borderRadius={{ base: "18px", md: "22px" }}
                      p={`${qrPadding}px`}
                      boxShadow="0 12px 28px rgba(92, 63, 13, 0.18), inset 0 1px 0 rgba(255,255,255,0.76)"
                    >
                      <Box boxSize={`${qrSize}px`}>
                        <QRCodeSVG
                          value={preview.qrValue}
                          size={qrSize}
                          bgColor="#FFFFFF"
                          fgColor="#0B1120"
                          level="M"
                          includeMargin={false}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Details rows — onboarding border-bottom pattern */}
            <VStack spacing={0} align="stretch">
              <HStack
                py={4}
                borderBottom="1px solid"
                borderColor="gray.200"
                spacing={3}
              >
                <Box
                  w={10}
                  h={10}
                  borderRadius="full"
                  bg="gray.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Eye size={18} color="#6B7280" />
                </Box>
                <Box flex={1} minW={0}>
                  <Text fontSize="sm" fontWeight="600" color="gray.900">
                    Details
                  </Text>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    mt={0.5}
                    overflowWrap="anywhere"
                  >
                    ID · {preview.membershipId}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    overflowWrap="anywhere"
                  >
                    Email · {preview.email}
                  </Text>
                </Box>
              </HStack>

              {hasPublicProfileUrl ? (
                <Box
                  as="a"
                  href={preview.profileUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="wallet-preview-profile-link"
                  display="block"
                  _hover={{ bg: "gray.50" }}
                  transition="background 120ms ease"
                  borderRadius="md"
                  mx={-2}
                  px={2}
                >
                  <HStack
                    py={4}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    spacing={3}
                  >
                    <Box
                      w={10}
                      h={10}
                      borderRadius="full"
                      bg="gray.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <ExternalLink size={18} color="#6B7280" />
                    </Box>
                    <Box flex={1} minW={0}>
                      <Text fontSize="sm" fontWeight="600" color="gray.900">
                        Profile
                      </Text>
                      <Text
                        data-testid="wallet-preview-profile-url"
                        fontSize="xs"
                        color="gray.500"
                        mt={0.5}
                        overflowWrap="anywhere"
                      >
                        {profileLinkDescription}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ) : (
                <HStack
                  py={4}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                  spacing={3}
                  opacity={0.6}
                >
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg="gray.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <ExternalLink size={18} color="#6B7280" />
                  </Box>
                  <Box flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight="600" color="gray.900">
                      Profile
                    </Text>
                    <Text
                      data-testid="wallet-preview-profile-url"
                      fontSize="xs"
                      color="gray.500"
                      mt={0.5}
                    >
                      {profileLinkDescription}
                    </Text>
                  </Box>
                </HStack>
              )}
            </VStack>

            {/* Wallet actions */}
            <VStack spacing={3} align="stretch" pt={1}>
              {appleWalletSupported ? (
                <Button
                  leftIcon={<FaApple />}
                  bg="#0B1120"
                  color="white"
                  borderRadius="full"
                  h="52px"
                  fontSize="sm"
                  fontWeight="600"
                  onClick={onAddToAppleWallet}
                  isLoading={isApplePassLoading}
                  loadingText="Opening..."
                  _hover={{ bg: "#1a2332" }}
                  _active={{ bg: "#0B1120", transform: "scale(0.98)" }}
                >
                  Add to Apple Wallet
                </Button>
              ) : (
                <Text fontSize="xs" color="gray.500">
                  {modalAppleSupportMessage}
                </Text>
              )}

              {googleWalletAvailable ? (
                <Button
                  leftIcon={<FcGoogle />}
                  bg="white"
                  color="gray.900"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="full"
                  h="52px"
                  fontSize="sm"
                  fontWeight="600"
                  onClick={onAddToGoogleWallet}
                  isLoading={isGooglePassLoading}
                  loadingText="Opening..."
                  _hover={{ bg: "gray.50", borderColor: "gray.300" }}
                  _active={{ bg: "gray.100", transform: "scale(0.98)" }}
                >
                  Add to Google Wallet
                </Button>
              ) : (
                <Text fontSize="xs" color="gray.500">
                  {modalGoogleSupportMessage}
                </Text>
              )}
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
