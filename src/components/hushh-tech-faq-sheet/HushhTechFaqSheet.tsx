/**
 * HushhTechFaqSheet — Bottom sheet with accordion FAQs.
 * Follows the unified design language: Playfair Display headings,
 * tracking-[0.2em] section headers, hushh-blue accents, ios-green badges.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useModalKeyboardNavigation } from "../../hooks/useModalKeyboardNavigation";

/* ── FAQ Data ── */
interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    title: "Onboarding",
    items: [
      {
        q: "What is KYC verification?",
        a: "KYC (Know Your Customer) is a regulatory requirement that verifies your identity before you can invest. We collect basic personal and financial information to ensure compliance with SEC regulations.",
      },
      {
        q: "How long does onboarding take?",
        a: "Most users complete the full onboarding process in under 5 minutes. If you need to gather documents, you can save your progress and return anytime.",
      },
      {
        q: "Can I skip steps and come back later?",
        a: "Yes — some steps can be skipped. However, all required verifications must be completed before you can make your first investment.",
      },
      {
        q: "What are Hushh Coins?",
        a: "Hushh Coins are reward tokens you earn during onboarding and by engaging with the platform. They can be redeemed for premium features and reduced fees.",
      },
    ],
  },
  {
    title: "Investment",
    items: [
      {
        q: "What is Hushh Fund A?",
        a: "Hushh Fund A (27FCF) is our flagship AI-driven quantitative fund. It uses proprietary algorithms to identify market opportunities while managing risk through diversification.",
      },
      {
        q: "What is the minimum investment?",
        a: "The minimum investment varies by investor type. Accredited investors can start with as little as $25,000. Please refer to the fund documents for full details.",
      },
      {
        q: "How do I track my investment performance?",
        a: "Once invested, you'll have access to a real-time dashboard showing your portfolio performance, returns, and detailed analytics — all from your profile.",
      },
    ],
  },
  {
    title: "Security & Privacy",
    items: [
      {
        q: "How is my data protected?",
        a: "All data is encrypted with 256-bit AES encryption in transit and at rest. We use bank-grade security infrastructure and are fully GDPR and SOC 2 compliant.",
      },
      {
        q: "Who can see my financial information?",
        a: "Your financial data is strictly confidential. Only authorized compliance personnel can access it for regulatory purposes. It is never shared with third parties for marketing.",
      },
      {
        q: "What is the NDA I signed?",
        a: "The Non-Disclosure Agreement protects confidential investment strategies and fund performance data shared with you. It's standard practice for private investment funds.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        q: "How do I update my profile?",
        a: "Navigate to your Profile from the bottom navigation bar. You can edit your personal details, investment preferences, and notification settings at any time.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Profile → Settings → Delete Account. Please note that active investments must be redeemed before account deletion can be processed.",
      },
    ],
  },
];

const getFaqItemKey = (categoryTitle: string, itemIndex: number) =>
  `${categoryTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${itemIndex}`;

/* ── Props ── */
interface HushhTechFaqSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── Component ── */
const HushhTechFaqSheet: React.FC<HushhTechFaqSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const [expandedIdx, setExpandedIdx] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* Animate in/out */
  useEffect(() => {
    if (isOpen) {
      // Small delay so CSS transition fires after mount
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleToggle = useCallback((key: string) => {
    setExpandedIdx((prev) => (prev === key ? null : key));
  }, []);

  const handleBackdropClick = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useModalKeyboardNavigation({
    isOpen,
    containerRef: sheetRef,
    initialFocusRef: closeButtonRef,
    onClose: handleBackdropClick,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hushh-tech-faq-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        aria-labelledby="hushh-tech-faq-title"
        tabIndex={-1}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-6 pt-2 pb-4 flex items-center justify-between border-b border-gray-100">
          <h2
            id="hushh-tech-faq-title"
            className="text-2xl font-normal text-black font-serif"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Frequently Asked{" "}
            <span className="text-gray-400 italic font-light">Questions</span>
          </h2>
          <button
            ref={closeButtonRef}
            onClick={handleBackdropClick}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Close FAQs"
          >
            <span
              className="material-symbols-outlined text-gray-600 text-lg"
              style={{ fontVariationSettings: "'wght' 400" }}
            >
              close
            </span>
          </button>
        </div>

        {/* Scrollable FAQ content */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-thin">
          {FAQ_DATA.map((category) => (
            <section key={category.title} className="mt-6">
              {/* Category header */}
              <h3 className="text-[10px] tracking-[0.2em] text-gray-400 uppercase mb-3 font-medium">
                {category.title}
              </h3>

              <div className="border border-gray-200 divide-y divide-gray-100">
                {category.items.map((item, idx) => {
                  const key = getFaqItemKey(category.title, idx);
                  const isExpanded = expandedIdx === key;

                  return (
                    <div key={key}>
                      {/* Question row */}
                      <button
                        id={`faq-btn-${key}`}
                        onClick={() => handleToggle(key)}
                        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hushh-blue"
                        aria-expanded={isExpanded}
                        aria-controls={`faq-panel-${key}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                          <span
                            className="material-symbols-outlined text-gray-600 text-sm"
                            style={{ fontVariationSettings: "'wght' 300" }}
                          >
                            help
                          </span>
                        </div>
                        <span className="flex-1 text-sm font-medium text-gray-900">
                          {item.q}
                        </span>
                        <span
                          className={`material-symbols-outlined text-gray-400 text-lg transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          style={{ fontVariationSettings: "'wght' 300" }}
                        >
                          expand_more
                        </span>
                      </button>

                      {/* Answer — animated */}
                      <div
                        id={`faq-panel-${key}`}
                        role="region"
                        aria-labelledby={`faq-btn-${key}`}
                        aria-hidden={!isExpanded}
                        className={`overflow-hidden transition-all duration-200 ease-out ${
                          isExpanded ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="px-4 pb-4 pl-[60px] text-sm text-gray-500 font-light leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Help footer */}
          <div className="mt-8 mb-4 flex flex-col items-center text-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="material-symbols-outlined text-hushh-blue text-sm"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                support_agent
              </span>
              <span className="text-[11px] text-gray-500">
                Need more help?
              </span>
            </div>
            <a
              href="mailto:support@hushh.ai"
              className="text-xs font-semibold text-hushh-blue hover:underline"
            >
              support@hushh.ai
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HushhTechFaqSheet;
