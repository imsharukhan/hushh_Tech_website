// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../src/pages/discover-fund-a/logic", () => ({
  useDiscoverFundALogic: () => ({
    heroTitle: "Hushh Fund A:",
    heroSubtitle: "AI-Powered Multi-Strategy Alpha.",
    heroDescription: "Fund description",
    targetIRRLabel: "Target Net IRR",
    targetIRRValue: "18-23%",
    targetIRRPeriod: "Annually",
    targetIRRDisclaimer: "Disclaimer",
    philosophySectionTitle: "Investment Philosophy",
    philosophyCards: [{ title: "Risk-First Architecture", description: "Risk" }],
    edgeSectionTitle: "Our Edge",
    sellTheWallHref: "/sell-the-wall",
    edgeCards: [{ title: "Downside Protection", description: "Protection" }],
    assetFocusSectionTitle: "Asset Focus",
    assetFocusDescription: "Assets",
    assetPillars: [{ title: "Cash & Equivalents", description: "Cash" }],
    alphaStackSectionTitle: "Alpha Stack",
    alphaStackSubtitle: "Breakdown",
    alphaStackRows: [
      { label: "Options Premium", value: "4-5%" },
      { label: "Target Net IRR", value: "18-23%", isTotalRow: true },
    ],
    riskSectionTitle: "Risk Management",
    riskCards: [{ title: "Hedging Framework", description: "Hedge" }],
    keyTermsSectionTitle: "Key Terms",
    keyTermsSubtitle: "Terms",
    keyTerms: [{ title: "Liquidity", content: "Quarterly" }],
    shareClasses: [
      {
        shareClass: "Class A",
        minInvestment: "$25M",
        managementFee: "1%",
        performanceFee: "15%",
        hurdleRate: "12%",
      },
      {
        shareClass: "Class B",
        minInvestment: "$5M",
        managementFee: "1.5%",
        performanceFee: "15%",
        hurdleRate: "10%",
      },
      {
        shareClass: "Class C",
        minInvestment: "$1M",
        managementFee: "1.5%",
        performanceFee: "25%",
        hurdleRate: "8%",
      },
    ],
    joinSectionTitle: "Join",
    joinSectionDescription: "Complete profile",
    joinButtonLabel: "Complete Profile",
    handleCompleteProfile: vi.fn(),
  }),
}));

vi.mock("../src/components/hushh-tech-back-header/HushhTechBackHeader", () => ({
  default: () => null,
}));

vi.mock("../src/components/hushh-tech-footer/HushhTechFooter", () => ({
  HushhFooterTab: { FUND_A: "fund-a" },
  default: ({ activeTab }: { activeTab: string }) => (
    React.createElement("nav", {
      "data-active-tab": activeTab,
      "data-testid": "fund-a-footer",
    })
  ),
}));

import FundA from "../src/pages/discover-fund-a/ui";

describe("FundA footer shell", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    navigateMock.mockClear();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("keeps the mobile footer hidden on desktop breakpoints", async () => {
    await act(async () => {
      root.render(React.createElement(FundA));
    });

    const footer = container.querySelector('[data-testid="fund-a-footer"]');

    expect(footer?.getAttribute("data-active-tab")).toBe("fund-a");
    expect(footer?.parentElement?.className).toContain("lg:hidden");
  });

  it("marks feature card icons as decorative", async () => {
    await act(async () => {
      root.render(React.createElement(FundA));
    });

    const featureIcons = Array.from(
      container.querySelectorAll('[data-testid="feature-card-icon"]'),
    );

    expect(featureIcons.length).toBeGreaterThan(0);
    featureIcons.forEach((icon) => {
      expect(icon.getAttribute("aria-hidden")).toBe("true");
    });
  });

  it("stacks share class pricing details on narrow viewports before widening", async () => {
    await act(async () => {
      root.render(React.createElement(FundA));
    });

    const pricingCards = Array.from(
      container.querySelectorAll('[data-testid="share-class-pricing-card"]'),
    );
    const pricingHeaders = Array.from(
      container.querySelectorAll('[data-testid="share-class-pricing-header"]'),
    );
    const pricingMetrics = Array.from(
      container.querySelectorAll('[data-testid="share-class-pricing-metrics"]'),
    );

    expect(pricingCards).toHaveLength(3);
    expect(pricingHeaders).toHaveLength(pricingCards.length);
    expect(pricingMetrics).toHaveLength(pricingCards.length);

    pricingHeaders.forEach((pricingHeader) => {
      expect(pricingHeader.className).toContain("flex-col");
      expect(pricingHeader.className).toContain("sm:flex-row");
    });

    pricingMetrics.forEach((pricingMetricGroup) => {
      expect(pricingMetricGroup.className).toContain("grid-cols-1");
      expect(pricingMetricGroup.className).toContain("sm:grid-cols-3");
    });
  });
});
