// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import DeveloperSettings from "../src/components/DeveloperSettings";

describe("DeveloperSettings accessibility", () => {
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
  });

  it("gives icon-only endpoint copy controls specific accessible names", async () => {
    await act(async () => {
      root.render(React.createElement(DeveloperSettings, { investorSlug: "demo" }));
    });

    const copyButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[aria-label^="Copy"]')
    );

    expect(copyButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Copy MCP Discovery Endpoint",
      "Copy Chat Endpoint",
      "Copy AgentCard Endpoint (A2A)",
    ]);

    for (const button of copyButtons) {
      expect(button.getAttribute("type")).toBe("button");
      expect(button.textContent?.trim()).toBe("");
    }
  });
});
