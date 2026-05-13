// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import theme from "../src/theme";

const fetchPublicInvestorProfileBySlugMock = vi.fn();
const fetchGoogleWalletAvailabilityMock = vi.fn();
const buildGoldPassPreviewModelMock = vi.fn(
  (input: { name?: string; slug?: string }) => ({
    badgeText: "HUSHH GOLD",
    title: "Hushh Gold Investor Pass",
    holderName: input.name || "Hushh Investor",
    organizationName: "Hushh",
    membershipId: input.slug || "hushh-investor",
    investmentClass: "Class C",
    email: "—",
    qrValue: input.slug
      ? `https://hushhtech.com/investor/${input.slug}`
      : "https://hushhtech.com",
    profileUrl: input.slug
      ? `https://hushhtech.com/investor/${input.slug}`
      : null,
  })
);

vi.mock("../src/services/investorProfile", () => ({
  fetchPublicInvestorProfileBySlug: (slug: string) =>
    fetchPublicInvestorProfileBySlugMock(slug),
}));

vi.mock("../src/services/walletPass", () => ({
  APPLE_WALLET_SUPPORT_MESSAGE:
    "Available on iPhone in Wallet-supported browsers.",
  GOOGLE_WALLET_SUPPORT_MESSAGE:
    "Google Wallet is temporarily unavailable while we finish the wallet issuer setup.",
  buildGoldPassPreviewModel: (input: { name?: string; slug?: string }) =>
    buildGoldPassPreviewModelMock(input),
  downloadHushhGoldPass: vi.fn(),
  fetchGoogleWalletAvailability: () => fetchGoogleWalletAvailabilityMock(),
  isAppleWalletSupported: () => false,
  launchGoogleWalletPass: vi.fn(),
}));

vi.mock("../src/utils/useFooterVisibility", () => ({
  useFooterVisibility: () => undefined,
}));

vi.mock("../src/components/hushh-tech-back-header/HushhTechBackHeader", () => ({
  default: ({ onBackClick }: { onBackClick?: () => void }) =>
    React.createElement(
      "button",
      { type: "button", onClick: onBackClick },
      "Back"
    ),
}));

vi.mock("../src/components/InvestorChatWidget", () => ({
  InvestorChatWidget: () => React.createElement("div", null, "Investor Chat Widget"),
}));

vi.mock("../src/components/wallet/WalletCardPreviewModal", () => ({
  default: () => null,
}));

import PublicInvestorProfilePage from "../src/pages/investor/PublicInvestorProfile";

describe("PublicInvestorProfilePage", () => {
  let container: HTMLDivElement;
  let root: Root;

  const renderPage = async (slug: string) => {
    await act(async () => {
      root.render(
        React.createElement(
          ChakraProvider,
          { theme },
          React.createElement(
            MemoryRouter,
            { initialEntries: [`/investor/${slug}`] },
            React.createElement(
              Routes,
              null,
              React.createElement(Route, {
                path: "/investor/:slug",
                element: React.createElement(PublicInvestorProfilePage),
              })
            )
          )
        )
      );

      vi.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    window.scrollTo = vi.fn();
    window.open = vi.fn();
    fetchPublicInvestorProfileBySlugMock.mockReset();
    fetchGoogleWalletAvailabilityMock.mockReset();
    buildGoldPassPreviewModelMock.mockClear();
    fetchGoogleWalletAvailabilityMock.mockResolvedValue({
      available: false,
      message:
        "Google Wallet is temporarily unavailable while we finish the wallet issuer setup.",
      provider: "none",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
    );

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
      vi.runOnlyPendingTimers();
    });
    container.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows full names and verified copy for confirmed public profiles", async () => {
    const longEmail =
      "n***h@exceptionally-long-investor-domain-name-for-layout-testing.example";

    fetchPublicInvestorProfileBySlugMock.mockResolvedValue({
      slug: "neelesh-meena-4960f9fe",
      profile_url: "https://hushhtech.com/investor/neelesh-meena-4960f9fe",
      is_confirmed: true,
      basic_info: {
        name: "Neelesh Meena",
        email: longEmail,
        age: 32,
        organisation: "Hushh",
      },
      investor_profile: {
        primary_goal: {
          value: "long_term_growth",
          confidence: 0.82,
          rationale: "Matched from profile context",
        },
        sector_preferences: {
          value: ["private-credit-and-ai-infrastructure-allocation-with-a-long-custom-note"],
          confidence: 0.76,
          rationale: "Long profile metadata should wrap within the card instead of forcing horizontal overflow.",
        },
      },
      onboarding_data: null,
      shadow_profile: null,
    });

    await renderPage("neelesh-meena-4960f9fe");

    const heading = container.querySelector("h1");

    expect(heading?.textContent).toContain("Neelesh Meena");
    expect(container.textContent).toContain("Verified Investor Profile");
    expect(container.textContent).toContain("Verified");
    expect(container.textContent).toContain("Investment Profile");

    const emailValue = container.querySelector(
      '[data-testid="profile-email-value"]',
    ) as HTMLElement | null;

    expect(emailValue?.textContent).toBe(longEmail);
    expect(emailValue?.className).toContain("break-words");
    expect(emailValue?.style.overflowWrap).toBe("anywhere");

    const metadataValues = container.querySelectorAll('[data-testid="profile-metadata-value"]');
    const longMetadataValue = Array.from(metadataValues).find((value) =>
      value.textContent?.includes("private-credit-and-ai-infrastructure")
    ) as HTMLElement | undefined;

    expect(longMetadataValue).toBeTruthy();
    expect(longMetadataValue?.className).toContain("break-words");
    expect(longMetadataValue?.style.overflowWrap).toBe("anywhere");
  });

  it("shows basic shared pages for unconfirmed public profiles without verified copy", async () => {
    fetchPublicInvestorProfileBySlugMock.mockResolvedValue({
      slug: "ankit-kumar-singh-2597e6b8",
      profile_url: "https://hushhtech.com/investor/ankit-kumar-singh-2597e6b8",
      is_confirmed: false,
      basic_info: {
        name: "Ankit Kumar Singh",
        email: "a***h@example.com",
        age: null,
        organisation: null,
      },
      investor_profile: null,
      onboarding_data: null,
      shadow_profile: null,
    });

    await renderPage("ankit-kumar-singh-2597e6b8");

    const heading = container.querySelector("h1");

    expect(heading?.textContent).toContain("Ankit Kumar Singh");
    expect(container.textContent).toContain("Public Investor Profile");
    expect(container.textContent).toContain("Shared by investor");
    expect(container.textContent).toContain("Public");
    expect(container.textContent).not.toContain("Verified Investor Profile");
    expect(container.textContent).not.toContain("AI Analyzed");
  });
});
