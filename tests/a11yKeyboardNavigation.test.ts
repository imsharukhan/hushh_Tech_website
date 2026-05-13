// @vitest-environment jsdom

import React, { useRef, useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { SearchableSelect } from "../src/components/onboarding/SearchableSelect";
import LanguageSwitcher from "../src/components/LanguageSwitcher";
import { useModalKeyboardNavigation } from "../src/hooks/useModalKeyboardNavigation";

const languageMock = vi.hoisted(() => ({
  currentLanguage: "en",
  changeLanguage: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      get language() {
        return languageMock.currentLanguage;
      },
      changeLanguage: languageMock.changeLanguage,
    },
  }),
}));

function ModalHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useModalKeyboardNavigation({
    isOpen,
    containerRef: modalRef,
    initialFocusRef: firstButtonRef,
    onClose: () => setIsOpen(false),
  });

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsOpen(true),
      },
      "Open modal",
    ),
    isOpen
      ? React.createElement(
          "div",
          {
            ref: modalRef,
            role: "dialog",
            tabIndex: -1,
          },
          React.createElement(
            "button",
            {
              ref: firstButtonRef,
              type: "button",
            },
            "First action",
          ),
          React.createElement("button", { type: "button" }, "Last action"),
        )
      : null,
  );
}

function RerenderingModalHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useModalKeyboardNavigation({
    isOpen,
    containerRef: modalRef,
    initialFocusRef: firstButtonRef,
    onClose: () => setIsOpen(false),
  });

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsOpen(true),
      },
      "Open modal",
    ),
    isOpen
      ? React.createElement(
          "div",
          {
            ref: modalRef,
            role: "dialog",
            tabIndex: -1,
          },
          React.createElement(
            "button",
            {
              ref: firstButtonRef,
              type: "button",
            },
            "First action",
          ),
          React.createElement(
            "button",
            {
              type: "button",
              onClick: () => setCount((value) => value + 1),
            },
            `Rerender ${count}`,
          ),
        )
      : null,
  );
}

describe("keyboard accessibility helpers", () => {
  let container: HTMLDivElement;
  let root: Root;
  let offsetParentDescriptor: PropertyDescriptor | undefined;
  let scrollIntoViewDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

    offsetParentDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetParent",
    );
    scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView",
    );

    Object.defineProperty(HTMLElement.prototype, "offsetParent", {
      configurable: true,
      get() {
        return document.body;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    languageMock.currentLanguage = "en";
    languageMock.changeLanguage.mockImplementation((language: string) => {
      languageMock.currentLanguage = language;
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    vi.clearAllMocks();

    if (offsetParentDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "offsetParent",
        offsetParentDescriptor,
      );
    }

    if (scrollIntoViewDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollIntoView",
        scrollIntoViewDescriptor,
      );
    } else {
      delete (HTMLElement.prototype as { scrollIntoView?: unknown })
        .scrollIntoView;
    }
  });

  it("traps modal focus, closes on Escape, and restores the trigger", async () => {
    await act(async () => {
      root.render(React.createElement(ModalHarness));
    });

    const trigger = container.querySelector("button");
    expect(trigger).toBeInstanceOf(HTMLButtonElement);

    trigger?.focus();

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    const buttons = Array.from(container.querySelectorAll("div[role='dialog'] button"));
    expect(buttons).toHaveLength(2);
    expect(document.activeElement).toBe(buttons[0]);

    buttons[1].focus();
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
      );
    });
    expect(document.activeElement).toBe(buttons[0]);

    buttons[0].focus();
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(document.activeElement).toBe(buttons[1]);

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(container.querySelector("div[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("pulls focus back into an open modal when Tab starts outside", async () => {
    await act(async () => {
      root.render(React.createElement(ModalHarness));
    });

    const trigger = container.querySelector("button");
    trigger?.focus();

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
      );
    });

    const buttons = Array.from(container.querySelectorAll("div[role='dialog'] button"));
    expect(document.activeElement).toBe(buttons[0]);
    outsideButton.remove();
  });

  it("keeps focus stable inside an open modal across re-renders", async () => {
    await act(async () => {
      root.render(React.createElement(RerenderingModalHarness));
    });

    const trigger = container.querySelector("button");
    trigger?.focus();

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    const buttons = Array.from(container.querySelectorAll("div[role='dialog'] button"));
    expect(buttons).toHaveLength(2);
    expect(document.activeElement).toBe(buttons[0]);

    buttons[1].focus();

    await act(async () => {
      buttons[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    expect(document.activeElement).toBe(buttons[1]);
  });

  it("opens the language menu with the keyboard and supports arrow navigation", async () => {
    await act(async () => {
      root.render(React.createElement(LanguageSwitcher));
    });

    const trigger = container.querySelector("button[aria-label='Select language']");
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    trigger?.focus();

    await act(async () => {
      trigger?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
    });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    const options = Array.from(container.querySelectorAll("[role='menuitemradio']"));
    expect(options).toHaveLength(4);
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(options[0]);

    await act(async () => {
      options[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
    });
    expect(document.activeElement).toBe(options[1]);

    await act(async () => {
      options[1].dispatchEvent(
        new KeyboardEvent("keydown", { key: "End", bubbles: true }),
      );
    });
    expect(document.activeElement).toBe(options[3]);

    await act(async () => {
      options[3].dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(languageMock.changeLanguage).toHaveBeenCalledWith("fr");
    expect(container.querySelector("[role='menu']")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("selects onboarding dropdown options with ArrowDown and Enter", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(SearchableSelect, {
          id: "country",
          label: "Country",
          value: "",
          options: [
            { value: "in", label: "India" },
            { value: "us", label: "United States" },
            { value: "ae", label: "United Arab Emirates" },
          ],
          onChange,
        }),
      );
    });

    const input = container.querySelector("input");
    expect(input).toBeInstanceOf(HTMLInputElement);

    await act(async () => {
      input?.focus();
      input?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    await act(async () => {
      input?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
    });

    expect(input?.getAttribute("aria-activedescendant")).toBe(
      "country-option-us",
    );

    await act(async () => {
      input?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });

    expect(onChange).toHaveBeenCalledWith("us");
    expect(container.querySelector("[role='listbox']")).toBeNull();
  });

  it("keeps the manual typing fallback when no dropdown option matches", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(SearchableSelect, {
          id: "city",
          label: "City",
          value: "",
          options: [{ value: "delhi", label: "Delhi" }],
          onChange,
        }),
      );
    });

    const input = container.querySelector("input");
    expect(input).toBeInstanceOf(HTMLInputElement);

    await act(async () => {
      input?.focus();
      input?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;

      valueSetter?.call(input, "Atlantis");
      input?.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      input?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });

    expect(onChange).toHaveBeenCalledWith("Atlantis");
  });
});
