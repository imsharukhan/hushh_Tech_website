// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import NWSScoreBadge from "../src/components/profile/NWSScoreBadge";

describe("NWSScoreBadge", () => {
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

  it("announces the loading skeleton without exposing decorative shimmer blocks", async () => {
    await act(async () => {
      root.render(React.createElement(NWSScoreBadge, { result: null, loading: true }));
    });

    const status = container.querySelector('[role="status"]');
    const skeletonBlocks = status?.querySelectorAll('[aria-hidden="true"]');

    expect(status).not.toBeNull();
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.getAttribute("aria-busy")).toBe("true");
    expect(status?.getAttribute("aria-label")).toBe("Loading Network Worth Score");
    expect(skeletonBlocks).toHaveLength(2);
  });
});
