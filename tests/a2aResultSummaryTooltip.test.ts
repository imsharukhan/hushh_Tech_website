// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import A2AResultSummaryScreen from "../src/components/a2aPlayground/A2AResultSummaryScreen";
import { DEFAULT_SCENARIO_CONFIG, type A2AScenarioResult } from "../src/types/a2aPlayground";

const result: A2AScenarioResult = {
  success: true,
  kycDecision: {
    status: "PASS",
    verifiedVia: {
      providerName: "Hushh KYC",
      providerType: "INTERNAL",
      lastVerifiedAt: "2026-05-08T00:00:00.000Z",
      riskBand: "LOW",
      trustScore: 0.98,
    },
    verifiedAttributes: ["Full name", "Email"],
  },
  keyMatchResult: true,
  exportResult: {
    exportedTo: "DemoBank X",
    targetUserUid: "demo-user-123",
    profileSchema: "a2a_protocol_v1",
    includedFields: ["fullName", "email"],
    excludedFields: [],
    profile: {
      fullName: "Demo User",
      email: "demo@hushh.ai",
      kycMeta: {
        providerName: "Hushh KYC",
        riskBand: "LOW",
        lastVerifiedAt: "2026-05-08T00:00:00.000Z",
        trustScore: 0.98,
      },
    },
  },
  audit: {
    hushhCheckId: "check_1234567890abcdef",
    loggedAt: "2026-05-08T00:00:00.000Z",
    operations: ["KYC_LOOKUP", "PROFILE_EXPORT"],
    bankId: "demo_bank_x",
    userId: "demo-user-123",
  },
  totalDurationMs: 1200,
  trustScore: 0.98,
  riskBand: "LOW",
  taskId: "task_123",
};

describe("A2AResultSummaryScreen tooltip semantics", () => {
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

  it("gives the tooltip-triggered copy control an accessible name", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          ChakraProvider,
          null,
          React.createElement(A2AResultSummaryScreen, {
            config: DEFAULT_SCENARIO_CONFIG,
            result,
            messages: [],
            onRunAnother: () => undefined,
            onViewConversation: () => undefined,
          }),
        ),
      );
    });

    const copyButton = container.querySelector('button[aria-label="Copy full ID"]');

    expect(copyButton).not.toBeNull();
    expect(copyButton?.getAttribute("type")).toBe("button");
  });
});
