// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const documentXml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:numPr><w:ilvl w:val="0" /></w:numPr></w:pPr>
      <w:r><w:t>Review the subscription agreement</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

vi.mock("fflate", () => ({
  strFromU8: () => documentXml,
  unzipSync: () => ({ "word/document.xml": new Uint8Array([1]) }),
}));

vi.mock("../src/components/hushh-tech-header/HushhTechHeader", () => ({
  default: () => React.createElement("header", null, "Header"),
}));

import DocumentViewerPage from "../src/pages/document-viewer";

describe("DocumentViewerPage decorative separators", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
      })
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("hides visual list separators from assistive technology", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/document-viewer?src=https://example.com/doc.docx"] },
          React.createElement(DocumentViewerPage)
        )
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const bullet = String.fromCharCode(8226);
    const separator = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent === bullet
    );

    expect(separator?.getAttribute("aria-hidden")).toBe("true");
    expect(container.textContent).toContain("Review the subscription agreement");
  });
});
