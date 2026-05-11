// @vitest-environment jsdom

import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatPaymentModal } from "../src/components/ChatPaymentModal";

describe("ChatPaymentModal accessibility", () => {
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

  it("exposes a named close button without changing payment actions", async () => {
    const onClose = vi.fn();
    const onPayment = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(
          ChakraProvider,
          null,
          React.createElement(ChatPaymentModal, {
            isOpen: true,
            onClose,
            onPayment,
          }),
        ),
      );
    });

    const closeButton = document.querySelector(
      'button[aria-label="Close payment modal"]',
    ) as HTMLButtonElement | null;
    const paymentButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Pay $1 with Stripe"),
    );

    expect(closeButton).not.toBeNull();
    expect(paymentButton).not.toBeNull();

    await act(async () => {
      closeButton?.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPayment).not.toHaveBeenCalled();
  });
});
