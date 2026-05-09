// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const i18nMock = {
  language: "en",
  changeLanguage: vi.fn((langCode: string) => {
    i18nMock.language = langCode;
  }),
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: i18nMock,
  }),
}));

import LanguageSwitcher from "../src/components/LanguageSwitcher";

describe("LanguageSwitcher keyboard accessibility", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

    i18nMock.language = "en";
    i18nMock.changeLanguage.mockClear();
    document.documentElement.removeAttribute("dir");
    document.documentElement.removeAttribute("lang");

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

  async function renderSwitcher() {
    await act(async () => {
      root.render(React.createElement(LanguageSwitcher));
    });

    const trigger = container.querySelector("button[aria-label='Select language']");
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    return trigger as HTMLButtonElement;
  }

  function menuItems() {
    return Array.from(
      container.querySelectorAll<HTMLButtonElement>("[role='menuitemradio']"),
    );
  }

  async function keyDown(element: HTMLElement, key: string) {
    await act(async () => {
      element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    });
  }

  it("opens from the trigger and moves focus through language options", async () => {
    const trigger = await renderSwitcher();

    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.focus();
    await keyDown(trigger, "ArrowDown");

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector("[role='menu']")).not.toBeNull();

    const options = menuItems();
    expect(options).toHaveLength(4);
    expect(options[0].textContent).toContain("English");
    expect(options[0].getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(options[0]);

    await keyDown(options[0], "ArrowDown");
    expect(document.activeElement).toBe(options[1]);

    await keyDown(options[1], "End");
    expect(document.activeElement).toBe(options[3]);

    await keyDown(options[3], "ArrowDown");
    expect(document.activeElement).toBe(options[0]);

    await keyDown(options[0], "ArrowUp");
    expect(document.activeElement).toBe(options[3]);
  });

  it("selects a focused language with Enter and restores focus to the trigger", async () => {
    const trigger = await renderSwitcher();

    trigger.focus();
    await keyDown(trigger, "ArrowDown");

    const options = menuItems();
    await keyDown(options[0], "ArrowDown");
    await keyDown(options[1], "Enter");

    expect(i18nMock.changeLanguage).toHaveBeenCalledWith("zh");
    expect(container.querySelector("[role='menu']")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    expect(document.documentElement.getAttribute("lang")).toBe("zh");
  });

  it("closes with Escape and returns focus without changing language", async () => {
    const trigger = await renderSwitcher();

    trigger.focus();
    await keyDown(trigger, " ");

    const options = menuItems();
    expect(document.activeElement).toBe(options[0]);

    await keyDown(options[0], "Escape");

    expect(i18nMock.changeLanguage).not.toHaveBeenCalled();
    expect(container.querySelector("[role='menu']")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes with document-level Escape when the menu is open", async () => {
    const trigger = await renderSwitcher();

    trigger.focus();
    await keyDown(trigger, "ArrowDown");

    expect(container.querySelector("[role='menu']")).not.toBeNull();

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(i18nMock.changeLanguage).not.toHaveBeenCalled();
    expect(container.querySelector("[role='menu']")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps the menu open when Escape belongs to another focused component", async () => {
    const trigger = await renderSwitcher();
    const modalButton = document.createElement("button");
    document.body.appendChild(modalButton);

    trigger.focus();
    await keyDown(trigger, "ArrowDown");
    modalButton.focus();

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(container.querySelector("[role='menu']")).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(modalButton);

    modalButton.remove();
  });
});
