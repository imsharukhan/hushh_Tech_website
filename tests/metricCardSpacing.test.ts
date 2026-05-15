// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const buildMetricsSummaryMock = vi.fn();

vi.mock("../src/pages/metrics/metricsService", () => ({
  buildMetricsSummary: () => buildMetricsSummaryMock(),
}));

vi.mock("../src/components/hushh-tech-header/HushhTechHeader", () => ({
  default: () => React.createElement("header", null, "Header"),
}));

vi.mock("../src/components/Footer", () => ({
  default: () => React.createElement("footer", null, "Footer"),
}));

vi.mock("react-helmet", () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock("recharts", () => {
  const ChartShell = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children);
  const ChartPart = () => null;

  return {
    Bar: ChartPart,
    CartesianGrid: ChartPart,
    ComposedChart: ChartShell,
    Legend: ChartPart,
    Line: ChartPart,
    LineChart: ChartShell,
    ResponsiveContainer: ChartShell,
    Tooltip: ChartPart,
    XAxis: ChartPart,
    YAxis: ChartPart,
  };
});

import MetricsPage from "../src/pages/metrics";

const summaryPayload = {
  generatedAt: "2026-05-11T12:00:00.000Z",
  timezone: "America/Los_Angeles",
  window: {
    days: 7,
    startDate: "2026-05-05",
    endDate: "2026-05-11",
  },
  businessFunnel: {
    source: "supabase",
    overview: {
      signups: 10,
      persistedUsers: 8,
      onboardingStarted: 6,
      onboardingCompleted: 4,
      profilesCreated: 3,
      profilesConfirmed: 2,
    },
    conversionRates: {
      signupToPersistedUsers: 0.8,
      signupToOnboardingStarted: 0.6,
      onboardingCompletionRate: 0.67,
      profileConfirmationRate: 0.67,
    },
    onboardingStepBreakdown: [{ step: "step-1", users: 6 }],
    series: [
      {
        date: "2026-05-11",
        signups: 10,
        persistedUsers: 8,
        onboardingStarted: 6,
        onboardingCompleted: 4,
        profilesCreated: 3,
        profilesConfirmed: 2,
      },
    ],
  },
  audience: {
    source: "site",
    dau: 4,
    wau: 12,
    mau: 20,
    sessions: 14,
    pageViews: 40,
    events: 50,
  },
  search: {
    totalSearches: 7,
    resultClickRate: 0.4,
    noResultRate: 0.1,
    bySurface: [],
  },
  searchPerformance: {
    source: "search-console",
    available: true,
    realtime: false,
    dataState: "fresh",
    searchType: "web",
    overview: {
      clicks: 12,
      impressions: 120,
      ctr: 0.1,
      averagePosition: 4.2,
    },
    queries: [],
    pages: [],
    countries: [],
    devices: [],
    searchAppearance: [],
    state: {
      source: "ga4",
      available: true,
      byRegion: [],
    },
  },
  gcp: {
    source: "monitoring",
    available: true,
    services: [],
    requestCount: 100,
    errorRate: 0.01,
    p50LatencyMs: 100,
    p95LatencyMs: 200,
    instanceCount: 2,
    uptimeAvailability: 0.99,
  },
  traffic: {
    source: "GA4 Data API",
    available: true,
    overview: {
      active1DayUsers: 4,
      active7DayUsers: 12,
      active28DayUsers: 20,
      sessions: 14,
      engagedSessions: 10,
      screenPageViews: 40,
      newUsers: 5,
      engagementRate: 0.7,
      averageSessionDuration: 90,
      realtimeActiveUsers: 2,
    },
    series: [
      {
        date: "2026-05-11",
        activeUsers: 4,
        sessions: 14,
        screenPageViews: 40,
        engagedSessions: 10,
        newUsers: 5,
      },
    ],
  },
  legacy: {
    source: "legacy",
    available: true,
    overview: { usersCreated: 1 },
    series: [{ date: "2026-05-11", usersCreated: 1 }],
  },
  dataQualityWarnings: [],
};

describe("metrics card spacing", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    buildMetricsSummaryMock.mockResolvedValue(summaryPayload);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("uses a consistent stack between metric labels and values", async () => {
    await act(async () => {
      root.render(React.createElement(MetricsPage));
      await Promise.resolve();
      await Promise.resolve();
    });

    const stack = container.querySelector('[data-testid="metric-label-value-stack"]');

    expect(stack).toBeTruthy();
    expect(stack?.className).toContain("space-y-1.5");
    expect(stack?.textContent).toContain("Raw signups");
    expect(stack?.textContent).toContain("10");
  });
});
