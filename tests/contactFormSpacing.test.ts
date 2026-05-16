// @vitest-environment jsdom

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { MemoryRouter } from "react-router-dom";
import Contact from "../src/pages/Contact";

vi.mock("@emailjs/browser", () => ({
  default: {
    init: vi.fn(),
    send: vi.fn(),
  },
}));

describe("Contact form spacing", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    container?.remove();
    container = null;
    root = null;
  });

  it("groups paired contact fields into consistent responsive rows", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        React.createElement(
          ChakraProvider,
          null,
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(Contact),
          ),
        ),
      );
    });

    const fieldRows = container.querySelectorAll('[data-testid="contact-form-field-row"]');

    expect(fieldRows).toHaveLength(2);
    expect(fieldRows[0].textContent).toContain("Full Name");
    expect(fieldRows[0].textContent).toContain("Company");
    expect(fieldRows[1].textContent).toContain("Email Address");
    expect(fieldRows[1].textContent).toContain("Phone Number");
  });
});
