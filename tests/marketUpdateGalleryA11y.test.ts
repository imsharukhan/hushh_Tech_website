// @vitest-environment jsdom

import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MarketUpdateGallery from "../src/components/MarketUpdateGallery";

vi.mock("../src/services/runtime/mainWeb", () => ({
  getSupabaseStoragePublicUrl: () => "https://cdn.example.com",
}));

const loadedChartPattern = /\/market-updates\/dmu-test\/[12]\.png$/;

const flushPromises = async () => {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

describe("MarketUpdateGallery accessibility", () => {
  let container: HTMLDivElement;
  let root: Root;
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

    const originalCreateElement = document.createElement.bind(document);
    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
        const element = originalCreateElement(tagName, options);

        if (tagName.toLowerCase() === "img") {
          let currentSrc = "";

          Object.defineProperty(element, "src", {
            configurable: true,
            get: () => currentSrc,
            set: (value: string) => {
              currentSrc = value;
              queueMicrotask(() => {
                if (loadedChartPattern.test(value)) {
                  (element as HTMLImageElement).onload?.(new Event("load") as Event);
                } else {
                  (element as HTMLImageElement).onerror?.(new Event("error") as Event);
                }
              });
            },
          });
        }

        return element;
      }) as typeof document.createElement);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    document.body.innerHTML = "";
    createElementSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("names carousel navigation controls in the chart preview", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          ChakraProvider,
          null,
          React.createElement(MarketUpdateGallery, {
            date: "dmu-test",
          }),
        ),
      );
    });
    await flushPromises();

    const chartButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        'button[aria-label^="Open market analysis chart"]',
      ),
    );

    expect(chartButtons).toHaveLength(2);

    await act(async () => {
      chartButtons[0].click();
    });

    const previousButton = document.body.querySelector<HTMLButtonElement>(
      'button[aria-label="Show previous market analysis chart"]',
    );
    const nextButton = document.body.querySelector<HTMLButtonElement>(
      'button[aria-label="Show next market analysis chart"]',
    );

    expect(previousButton).not.toBeNull();
    expect(nextButton).not.toBeNull();

    await act(async () => {
      nextButton?.click();
    });

    expect(
      document.body.querySelector(
        'img[alt="Full-screen market analysis chart 2"]',
      ),
    ).not.toBeNull();
  });
});
