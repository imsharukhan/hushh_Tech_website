// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../src/components/hushh-tech-header/HushhTechHeader", () => ({
  default: () => null,
}));

import DocumentViewerPage from "../src/pages/document-viewer";

describe("document viewer page accessibility", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  async function renderPage(initialEntry: string) {
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: [initialEntry] },
          React.createElement(DocumentViewerPage),
        ),
      );
    });
  }

  it("announces loading state while a document request is in progress", async () => {
    await renderPage(
      "/document-viewer?title=Quarterly%20Summary&src=https://example.com/file.docx",
    );

    const status = container.querySelector('[role="status"]');

    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.getAttribute("aria-busy")).toBe("true");
    expect(status?.textContent).toContain("Loading document...");
    expect(status?.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/file.docx");
  });

  it("exposes missing document URL failures as alerts", async () => {
    await renderPage("/document-viewer?title=Quarterly%20Summary");

    const alert = container.querySelector('[role="alert"]');

    expect(alert?.textContent).toContain("Missing document URL.");
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hides the decorative download icon from assistive technologies", async () => {
    await renderPage(
      "/document-viewer?title=Quarterly%20Summary&src=https://example.com/file.docx",
    );

    const downloadIcon = container.querySelector(
      'a[download] .material-symbols-outlined',
    );

    expect(downloadIcon?.getAttribute("aria-hidden")).toBe("true");
  });
});
