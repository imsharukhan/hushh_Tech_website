// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  AnalyticsToolbar,
  AnalyticsToolbarLink,
  DashboardStatusBadge,
  MetricCard,
} from "../src/pages/metrics";

describe("metrics MetricCard accessibility", () => {
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

  async function renderMetricCard() {
    await act(async () => {
      root.render(
        React.createElement(MetricCard, {
          eyebrow: "Audience",
          label: "Total users",
          value: "1,234",
        })
      );
    });
  }

  it("labels metric values with their visible metric name without repeating the label", async () => {
    await renderMetricCard();

    const valueHeading = container.querySelector("h3");
    const visibleLabel = container.querySelector("p.mt-2");

    expect(valueHeading?.getAttribute("aria-label")).toBe("Total users: 1,234");
    expect(visibleLabel?.textContent).toBe("Total users");
    expect(visibleLabel?.getAttribute("aria-hidden")).toBe("true");
  });

  it("exposes dashboard card badges as named status text", async () => {
    await act(async () => {
      root.render(
        React.createElement(DashboardStatusBadge, {
          label: "Funnel stack status",
          value: "Live",
          className: "tracking-[0.2em] bg-emerald-400/15 text-emerald-200",
        })
      );
    });

    const badge = container.querySelector('[role="status"]');

    expect(badge?.getAttribute("aria-label")).toBe("Funnel stack status: Live");
    expect(badge?.textContent).toBe("Live");
    expect(badge?.className).toContain("inline-flex");
    expect(badge?.className).toContain("rounded-full");
  });

  it("keeps analytics toolbar buttons consistently centered and full width on narrow screens", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          AnalyticsToolbar,
          null,
          React.createElement(
            AnalyticsToolbarLink,
            {
              href: "https://lookerstudio.google.com/reporting/example",
              target: "_blank",
              rel: "noreferrer",
            },
            "Open Looker traffic view"
          )
        )
      );
    });

    const toolbar = container.querySelector("div");
    const button = container.querySelector("a");

    expect(toolbar?.className).toContain("sm:items-center");
    expect(toolbar?.className).toContain("sm:justify-end");
    expect(button?.className).toContain("inline-flex");
    expect(button?.className).toContain("min-h-10");
    expect(button?.className).toContain("w-full");
    expect(button?.className).toContain("items-center");
    expect(button?.className).toContain("justify-center");
    expect(button?.className).toContain("sm:w-auto");
  });
});
