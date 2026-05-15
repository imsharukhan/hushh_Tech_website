// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import HushhStudioApp from "../src/hushh-studio/App";
import { DEFAULT_VIDEO_SETTINGS } from "../src/hushh-studio/types";

vi.mock("../src/hushh-studio/hooks/useVideoGeneration", () => ({
  useVideoGeneration: () => ({
    isGenerating: false,
    progress: {
      status: "idle",
      progress: 0,
      message: "",
      pollingAttempts: 0,
    },
    currentVideo: null,
    gallery: [],
    settings: DEFAULT_VIDEO_SETTINGS,
    error: null,
    generateFromText: vi.fn(),
    generateFromImage: vi.fn(),
    extendVideo: vi.fn(),
    updateSettings: vi.fn(),
    removeFromGallery: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe("Hushh Studio clickable accessibility", () => {
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

  it("uses a named native button for the image upload drop zone", async () => {
    await act(async () => {
      root.render(React.createElement(HushhStudioApp));
    });

    const imageModeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Image to Video")
    );

    await act(async () => {
      imageModeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const uploadButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Upload source image"]'
    );

    expect(uploadButton).not.toBeNull();
    expect(uploadButton?.getAttribute("type")).toBe("button");
    expect(uploadButton?.className).toContain("aspect-video");
    expect(uploadButton?.querySelector('input[type="file"]')).toBeNull();
    expect(container.querySelector('div[aria-label="Upload source image"]')).toBeNull();
  });
});
