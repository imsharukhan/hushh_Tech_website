// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("../src/pages/home/logic", () => ({
  useHomeLogic: () => ({
    primaryCTA: {
      text: "Complete Your Hushh Profile",
      action: navigateMock,
      loading: false,
    },
    onNavigate: navigateMock,
  }),
}));

vi.mock("../src/components/hushh-tech-header/HushhTechHeader", () => ({
  default: () => null,
}));

vi.mock("../src/components/hushh-tech-footer/HushhTechFooter", () => ({
  HushhFooterTab: { HOME: "home" },
  default: () => null,
}));

import HomePage from "../src/pages/home/ui";

describe("HomePage focus order", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    navigateMock.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("keeps the product card action in the natural button focus order", async () => {
    await act(async () => {
      root.render(React.createElement(HomePage));
    });

    const buttons = Array.from(container.querySelectorAll("button"));

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "Complete Your Hushh Profilearrow_forward",
      "Discover Fund A",
      "Performance Detailsarrow_forward",
      "Explore Our Approacharrow_right_alt",
      "Learn More",
    ]);
    expect(buttons[2].getAttribute("aria-label")).toBe(
      "View performance details",
    );
    expect(buttons[2].getAttribute("tabindex")).toBeNull();
  });
});
