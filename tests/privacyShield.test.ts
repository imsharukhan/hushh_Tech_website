// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  maskEmail,
  maskPhone,
  PrivacyShield,
} from "../src/components/profile/PrivacyShield";

describe("PrivacyShield", () => {
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

  it("masks email and phone without exposing the full local value", () => {
    expect(maskEmail("ada@example.com")).toContain("@example.com");
    expect(maskEmail("ada@example.com")).not.toContain("ada@example.com");
    expect(maskEmail("not-an-email")).not.toContain("not-an-email");

    expect(maskPhone("+91 98765 43210")).toHaveLength(10);
    expect(maskPhone("+91 98765 43210")).not.toContain("98765");
    expect(maskPhone("")).toHaveLength(8);
  });

  it("uses accessible switches to hide and restore contact controls", async () => {
    await act(async () => {
      root.render(
        React.createElement(PrivacyShield, {
          email: "ada@example.com",
          phone: "+91 98765 43210",
          emailControl: React.createElement("input", {
            "aria-label": "Email address",
            readOnly: true,
            value: "ada@example.com",
          }),
          phoneControl: React.createElement("input", {
            "aria-label": "Phone number",
            readOnly: true,
            value: "+91 98765 43210",
          }),
        }),
      );
    });

    const emailInput = container.querySelector(
      'input[aria-label="Email address"]',
    ) as HTMLInputElement | null;
    const emailSwitch = container.querySelector(
      'input[role="switch"][aria-label="Hide email"]',
    ) as HTMLInputElement | null;

    expect(emailInput?.value).toBe("ada@example.com");
    expect(emailSwitch?.checked).toBe(true);

    await act(async () => {
      emailSwitch?.click();
    });

    expect(
      container.querySelector('input[aria-label="Email address"]'),
    ).toBeNull();
    expect(container.textContent).toContain("@example.com");
    expect(container.textContent).not.toContain("ada@example.com");

    const showEmailSwitch = container.querySelector(
      'input[role="switch"][aria-label="Show email"]',
    ) as HTMLInputElement | null;
    expect(showEmailSwitch?.checked).toBe(false);

    await act(async () => {
      showEmailSwitch?.click();
    });

    expect(
      (
        container.querySelector(
          'input[aria-label="Email address"]',
        ) as HTMLInputElement | null
      )?.value,
    ).toBe("ada@example.com");
  });
});
