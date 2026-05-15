// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DataVaultCard } from "../src/components/a2aPlayground/DataVaultCard";

describe("DataVaultCard mobile action badge alignment", () => {
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

  it("keeps action badges grouped in a wrapping mobile card header", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          ChakraProvider,
          null,
          React.createElement(DataVaultCard, {
            fields: [
              {
                name: "verified-identity-action",
                label: "Extremely long identity verification action label",
                value: "verified",
                status: "protected",
              },
            ],
          }),
        ),
      );
    });

    const header = container.querySelector(
      '[data-testid="data-vault-field-card-header"]',
    );
    const actionBadge = container.querySelector(
      '[data-testid="data-vault-action-badge"]',
    );

    expect(header?.textContent).toContain(
      "Extremely long identity verification action label",
    );
    expect(actionBadge?.textContent).toContain("KEY EXCHANGE");
    expect(header?.contains(actionBadge)).toBe(true);
  });
});
