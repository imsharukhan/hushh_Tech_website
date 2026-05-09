// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Button } from "../src/components/ui/button";

describe("Button cursor behavior", () => {
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

  it("uses pointer cursors for enabled buttons and not-allowed cursors for disabled buttons", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(Button, null, "Continue"),
          React.createElement(Button, { disabled: true }, "Saving"),
        ),
      );
    });

    const [enabledButton, disabledButton] = Array.from(container.querySelectorAll("button"));

    expect(enabledButton.className).toContain("cursor-pointer");
    expect(disabledButton.className).toContain("disabled:cursor-not-allowed");
    expect(disabledButton.disabled).toBe(true);
  });
});
