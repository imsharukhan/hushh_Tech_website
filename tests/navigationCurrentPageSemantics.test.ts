// @vitest-environment jsdom

import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/auth/AuthSessionProvider", () => ({
  useAuthSession: () => ({
    status: "unauthenticated",
  }),
}));

import HushhTechFooter, {
  HushhFooterTab,
} from "../src/components/hushh-tech-footer/HushhTechFooter";
import MobileBottomNav from "../src/components/MobileBottomNav";

describe("navigation current-page semantics", () => {
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

  it("marks the active HushhTech footer tab as the current page", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/discover-fund-a"] },
          React.createElement(HushhTechFooter, { activeTab: HushhFooterTab.FUND_A }),
        ),
      );
    });

    const currentTab = container.querySelector("[aria-current='page']");
    const footerTabs = Array.from(container.querySelectorAll("button"));

    expect(currentTab?.textContent).toContain("Fund A");
    expect(footerTabs.filter((tab) => tab.getAttribute("aria-current") === "page")).toHaveLength(1);
  });

  it("marks the active mobile bottom nav item as the current page", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/community"] },
          React.createElement(
            ChakraProvider,
            null,
            React.createElement(MobileBottomNav),
          ),
        ),
      );
    });

    const currentItem = container.querySelector("[aria-current='page']");
    const navItems = Array.from(container.querySelectorAll("[role='group']"));

    expect(currentItem?.textContent).toContain("Community");
    expect(navItems.filter((item) => item.getAttribute("aria-current") === "page")).toHaveLength(1);
  });
});
