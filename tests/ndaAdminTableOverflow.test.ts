// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/resources/config/config", () => ({
  default: {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
  },
}));

import NDAAdminPage from "../src/pages/nda-admin";

describe("NDAAdminPage table overflow", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

    sessionStorage.setItem("nda_admin_auth", "true");
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        records: [
          {
            user_id: "user-with-a-long-id",
            full_name: "Test User",
            email: "test@example.com",
            nda_signed_at: "2026-05-08T12:00:00.000Z",
            nda_version: "v1.0",
            nda_signer_ip: "127.0.0.1",
            nda_signer_name: "Test User",
            nda_pdf_url: null,
          },
        ],
      }),
    });
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
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("keeps wide data tables inside a horizontal scroll region", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(NDAAdminPage),
        ),
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    const table = container.querySelector("table");
    expect(table).toBeInstanceOf(HTMLTableElement);

    const wrapper = table?.parentElement;
    expect(wrapper?.style.overflowX).toBe("auto");
    expect(wrapper?.style.width).toBe("100%");
    expect(table?.style.minWidth).toBe("860px");
  });
});
