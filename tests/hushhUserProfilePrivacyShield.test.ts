// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useHushhUserProfileLogicMock = vi.hoisted(() => vi.fn());

vi.mock("../src/pages/hushh-user-profile/logic", () => ({
  FIELD_LABELS: {},
  VALUE_LABELS: {},
  useHushhUserProfileLogic: () => useHushhUserProfileLogicMock(),
}));

vi.mock("../src/components/hushh-tech-back-header/HushhTechBackHeader", () => ({
  default: () => null,
}));

vi.mock("../src/components/hushh-tech-cta/HushhTechCta", () => ({
  default: () => null,
  HushhTechCtaVariant: {
    BLACK: "black",
    WHITE: "white",
  },
}));

vi.mock("../src/components/hushh-tech-footer/HushhTechFooter", () => ({
  default: () => null,
  HushhFooterTab: {
    PROFILE: "profile",
  },
}));

vi.mock("../src/components/profile/NWSScoreBadge", () => ({
  default: () => null,
}));

vi.mock("../src/components/wallet/WalletCardPreviewModal", () => ({
  default: () => null,
}));

import HushhUserProfilePage from "../src/pages/hushh-user-profile/ui";

describe("HushhUserProfile PrivacyShield integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    useHushhUserProfileLogicMock.mockReturnValue({
      form: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        age: 36,
        phoneCountryCode: "+91",
        phoneNumber: "9876543210",
        organisation: "",
        accountType: "",
        selectedFund: "",
        referralSource: "",
        citizenshipCountry: "India",
        residenceCountry: "",
        accountStructure: "",
        legalFirstName: "",
        legalLastName: "",
        addressLine1: "",
        city: "",
        state: "",
        zipCode: "",
        dateOfBirth: "",
        initialInvestmentAmount: "",
      },
      investorProfile: null,
      loading: false,
      loadingSeconds: 0,
      isProcessing: false,
      investorStatus: "idle",
      hasOnboardingData: true,
      isApplePassLoading: false,
      isGooglePassLoading: false,
      nwsResult: null,
      nwsLoading: false,
      isWalletPreviewOpen: false,
      appleWalletSupported: false,
      appleWalletSupportMessage: "Apple Wallet unavailable",
      googleWalletSupported: false,
      googleWalletSupportMessage: "Google Wallet unavailable",
      walletPreview: null,
      hasCopied: false,
      onCopy: vi.fn(),
      profileUrl: "",
      navigate: vi.fn(),
      handleChange: vi.fn(),
      handleBack: vi.fn(),
      handleSave: vi.fn(),
      isDirty: false,
      isSaving: false,
      handleSaveChanges: vi.fn(),
      handleAppleWalletPass: vi.fn(),
      handleGoogleWalletPass: vi.fn(),
      COUNTRIES: ["India"],
      openWalletPreview: vi.fn(),
      closeWalletPreview: vi.fn(),
      editingField: null,
      setEditingField: vi.fn(),
      FIELD_OPTIONS: {},
      MULTI_SELECT_FIELDS: [],
      handleUpdateAIField: vi.fn(),
      handleMultiSelectToggle: vi.fn(),
      getConfidenceLabel: vi.fn(),
      getConfidenceBadgeClass: vi.fn(),
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders the profile email and phone fields inside PrivacyShield controls", async () => {
    await act(async () => {
      root.render(React.createElement(HushhUserProfilePage));
    });

    expect(container.textContent).toContain("Visibility Controls");
    expect(
      (container.querySelector(
        'input[aria-label="Email address"]',
      ) as HTMLInputElement | null)?.value,
    ).toBe("ada@example.com");
    expect(
      (container.querySelector(
        'input[aria-label="Phone number"]',
      ) as HTMLInputElement | null)?.value,
    ).toBe("9876543210");
    expect(
      container.querySelectorAll('input[role="switch"]'),
    ).toHaveLength(2);
  });
});
