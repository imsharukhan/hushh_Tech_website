// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/pages/profile/logic", () => ({
  useProfileLogic: () => ({
    onboardingStatus: {
      loading: false,
    },
    primaryCTA: {
      text: "Complete Your Hushh Profile",
      action: vi.fn(),
    },
    handleDiscoverFundA: vi.fn(),
  }),
}));

vi.mock("../src/components/hushh-tech-back-header/HushhTechBackHeader", () => ({
  default: () => null,
}));

vi.mock("../src/components/hushh-tech-footer/HushhTechFooter", () => ({
  HushhFooterTab: { PROFILE: "profile" },
  default: () => null,
}));

import ProfilePage from "../src/pages/profile/ui";

describe("ProfilePage CTA group", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
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

  it("uses responsive grid alignment for the profile CTAs", async () => {
    await act(async () => {
      root.render(React.createElement(ProfilePage));
    });

    const ctaGroup = container.querySelector('[data-testid="profile-cta-group"]');

    expect(ctaGroup?.className).toContain("grid");
    expect(ctaGroup?.className).toContain("gap-3");
    expect(ctaGroup?.className).toContain("sm:grid-cols-2");
    expect(ctaGroup?.textContent).toContain("Complete Your Hushh Profile");
    expect(ctaGroup?.textContent).toContain("Discover Fund A");
  });
});
