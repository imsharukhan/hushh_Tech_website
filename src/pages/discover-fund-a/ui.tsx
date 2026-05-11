/**
 * Fund A — Discover Page (Revamped 3.0)
 * Pixel-perfect alignment with hushh-user-profile + step 1-8 design.
 * Uses same wrapper, header, CTA, FieldRow, SectionLabel patterns.
 * All content from logic.ts — zero data here.
 *
 * Changes from original: Apple iOS colors, capitalization, hero subheading.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { useDiscoverFundALogic } from "./logic";
import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../components/hushh-tech-cta/HushhTechCta";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";

/* ── settings-style row (same as profile page) ── */
const FieldRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="group flex items-center justify-between border-b border-gray-200 py-4 hover:bg-gray-50/50 transition-colors -mx-6 px-6">
    <span className="text-sm text-gray-500 font-light">{label}</span>
    <div className="flex items-center gap-2 text-right">{children}</div>
  </div>
);

/* ── section label (same as profile page) ── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mt-10 mb-2">
    {children}
  </p>
);

/* ── card with icon (same as step-2 cards) ── */
const FeatureCard = ({
  icon,
  title,
  description,
  iconColor = "text-gray-700",
}: {
  icon: string;
  title: string;
  description: string;
  iconColor?: string;
}) => (
  <div className="flex items-start gap-4 border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:bg-gray-50/50 transition-all">
    <div className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center shrink-0 bg-white">
      <span className={`material-symbols-outlined ${iconColor} !text-[1.15rem]`}>
        {icon}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-[13px] font-semibold text-black leading-snug mb-1">
        {title}
      </h3>
      <p className="text-[11px] text-gray-400 font-light leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

/* ── desktop highlight tile (same spirit as home advantage) ── */
const FeatureHighlightTile = ({
  icon,
  title,
  description,
  iconColor = "text-gray-700",
}: {
  icon: string;
  title: string;
  description: string;
  iconColor?: string;
}) => (
  <div className="flex flex-col items-center text-center gap-3 border border-gray-200/70 rounded-2xl p-5 bg-white hover:border-gray-300 hover:bg-gray-50/40 transition-all">
    <div className="w-12 h-12 rounded-full border border-gray-200/70 flex items-center justify-center bg-gray-50">
      <span className={`material-symbols-outlined ${iconColor} !text-[1.15rem]`}>
        {icon}
      </span>
    </div>
    <div>
      <h3 className="text-[13px] font-semibold text-black leading-snug mb-1">
        {title}
      </h3>
      <p className="text-[11px] text-gray-500 font-light leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

/* ── icon + color maps for cards ── */
const PHILOSOPHY_ICONS: Record<string, string> = {
  "Options Intelligence": "psychology",
  "AI-Enhanced Research": "neurology",
  "Risk-First Architecture": "shield",
  "Concentrated Conviction": "target",
};
const PHILOSOPHY_COLORS: Record<string, string> = {
  "Options Intelligence": "text-hushh-blue",
  "AI-Enhanced Research": "text-hushh-blue",
  "Risk-First Architecture": "text-ios-green",
  "Concentrated Conviction": "text-ios-dark",
};

const EDGE_ICONS: Record<string, string> = {
  "Volatility Harvesting": "trending_up",
  "Asymmetric Returns": "rocket_launch",
  "Income Generation": "payments",
  "Downside Protection": "security",
};
const EDGE_COLORS: Record<string, string> = {
  "Volatility Harvesting": "text-hushh-blue",
  "Asymmetric Returns": "text-hushh-blue",
  "Income Generation": "text-ios-green",
  "Downside Protection": "text-ios-green",
};

const ASSET_ICONS: Record<string, string> = {
  "U.S. Large-Cap Equities": "account_balance",
  "Strategic Options Overlay": "tune",
  "Cash & Equivalents": "savings",
};
const ASSET_COLORS: Record<string, string> = {
  "U.S. Large-Cap Equities": "text-hushh-blue",
  "Strategic Options Overlay": "text-ios-yellow",
  "Cash & Equivalents": "text-ios-green",
};

const RISK_ICONS: Record<string, string> = {
  "Position Limits": "pie_chart",
  "Hedging Framework": "shield",
  "Drawdown Protocols": "trending_down",
  "Liquidity Management": "water_drop",
};
const RISK_COLORS: Record<string, string> = {
  "Position Limits": "text-ios-yellow",
  "Hedging Framework": "text-ios-green",
  "Drawdown Protocols": "text-ios-red",
  "Liquidity Management": "text-hushh-blue",
};

const FundA = () => {
  const navigate = useNavigate();
  const [isAlphaBreakdownOpen, setIsAlphaBreakdownOpen] = React.useState(false);
  const {
    heroTitle,
    heroSubtitle,
    heroDescription,
    targetIRRLabel,
    targetIRRValue,
    targetIRRPeriod,
    targetIRRDisclaimer,
    philosophySectionTitle,
    philosophyCards,
    edgeSectionTitle,
    sellTheWallHref,
    edgeCards,
    assetFocusSectionTitle,
    assetFocusDescription,
    assetPillars,
    alphaStackSectionTitle,
    alphaStackSubtitle,
    alphaStackRows,
    riskSectionTitle,
    riskCards,
    keyTermsSectionTitle,
    keyTermsSubtitle,
    keyTerms,
    shareClasses,
    joinSectionTitle,
    joinSectionDescription,
    joinButtonLabel,
    handleCompleteProfile,
  } = useDiscoverFundALogic();
  const alphaBreakdownRows = alphaStackRows.filter((row) => !row.isTotalRow);
  const targetNetIrrRow = alphaStackRows.find((row) => row.isTotalRow);

  const getProgressWidth = (value: string): number => {
    const rangeMatch = value.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      const min = Number(rangeMatch[1]);
      const max = Number(rangeMatch[2]);
      const midpoint = (min + max) / 2;
      return Math.min((midpoint / 23) * 100, 100);
    }

    const singleMatch = value.match(/(\d+(\.\d+)?)/);
    if (!singleMatch) {
      return 0;
    }

    const numericValue = Number(singleMatch[1]);
    return Math.min((numericValue / 23) * 100, 100);
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
      {/* ═══ Header ═══ */}
      <HushhTechBackHeader
        onBackClick={() => navigate("/")}
        rightType="hamburger"
      />

      {/* ═══ Main ═══ */}
      <main className="px-6 flex-grow max-w-md mx-auto w-full pb-32 lg:max-w-7xl lg:px-10 xl:px-16">
        <section className="pt-6 pb-8 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* ── Hero ── */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-hushh-blue/20 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-hushh-blue rounded-full" />
              <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-hushh-blue">
                Flagship Fund
              </span>
            </div>

            <h1
              className="text-[2.75rem] leading-[1.1] font-normal text-black tracking-tight lg:text-[3.25rem]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {heroTitle} <br />
              <span className="text-gray-400 italic font-light">{heroSubtitle}</span>
            </h1>

            <p className="text-[13px] text-gray-400 font-light mt-4 leading-relaxed max-w-xs lg:max-w-md">
              {heroDescription}
            </p>
          </div>

          {/* ── Target IRR (premium black card) ── */}
          <div className="mt-8 lg:mt-0">
            <div className="group bg-ios-dark rounded-2xl p-6 text-center relative overflow-hidden transition-all duration-700 hover:-rotate-[5deg]">
              <div className="absolute inset-0 bg-ios-gray-bg/90 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100" />
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-hushh-blue/15 rounded-full blur-2xl" />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 group-hover:text-gray-600 mb-3 font-medium transition-colors duration-700">
                  {targetIRRLabel}
                </p>
                <p
                  className="text-[48px] leading-none font-medium text-ios-green mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {targetIRRValue}
                </p>
                <p className="text-[13px] text-gray-400 group-hover:text-gray-600 mb-4 transition-colors duration-700">
                  {targetIRRPeriod}
                </p>
                <p className="text-[9px] text-gray-600 italic max-w-[220px] mx-auto leading-relaxed">
                  {targetIRRDisclaimer}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Investment Philosophy ── */}
        <SectionLabel>{philosophySectionTitle}</SectionLabel>
        <div className="space-y-3 mb-2 lg:hidden">
          {philosophyCards.map((card) => (
            <FeatureCard
              key={card.title}
              icon={PHILOSOPHY_ICONS[card.title] || "lightbulb"}
              iconColor={PHILOSOPHY_COLORS[card.title] || "text-hushh-blue"}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>
        <div className="hidden lg:grid lg:grid-cols-3 gap-4 mb-2">
          {philosophyCards.map((card) => (
            <FeatureHighlightTile
              key={card.title}
              icon={PHILOSOPHY_ICONS[card.title] || "lightbulb"}
              iconColor={PHILOSOPHY_COLORS[card.title] || "text-hushh-blue"}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>

        {/* ── Sell the Wall Framework ── */}
        <SectionLabel>
          Our Edge —{" "}
          <a
            href={sellTheWallHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-hushh-blue underline decoration-hushh-blue/30 hover:decoration-hushh-blue transition-colors"
          >
            Sell the Wall
          </a>{" "}
          Framework
        </SectionLabel>
        <div className="space-y-3 mb-2 lg:hidden">
          {edgeCards.map((card) => (
            <FeatureCard
              key={card.title}
              icon={EDGE_ICONS[card.title] || "auto_awesome"}
              iconColor={EDGE_COLORS[card.title] || "text-hushh-blue"}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>
        <div className="hidden lg:grid lg:grid-cols-4 gap-4 mb-2">
          {edgeCards.map((card) => (
            <FeatureHighlightTile
              key={card.title}
              icon={EDGE_ICONS[card.title] || "auto_awesome"}
              iconColor={EDGE_COLORS[card.title] || "text-hushh-blue"}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>

        {/* ── Asset Focus ── */}
        <SectionLabel>{assetFocusSectionTitle}</SectionLabel>
        <p className="text-[11px] text-gray-400 font-light leading-relaxed mb-4">
          {assetFocusDescription}
        </p>
        <div className="space-y-3 mb-2 lg:hidden">
          {assetPillars.map((pillar) => (
            <FeatureCard
              key={pillar.title}
              icon={ASSET_ICONS[pillar.title] || "category"}
              iconColor={ASSET_COLORS[pillar.title] || "text-hushh-blue"}
              title={pillar.title}
              description={pillar.description}
            />
          ))}
        </div>
        <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-2">
          {assetPillars.map((pillar) => (
            <FeatureHighlightTile
              key={pillar.title}
              icon={ASSET_ICONS[pillar.title] || "category"}
              iconColor={ASSET_COLORS[pillar.title] || "text-hushh-blue"}
              title={pillar.title}
              description={pillar.description}
            />
          ))}
        </div>

        {/* ── Targeted Alpha Stack (FieldRow style) ── */}
        <SectionLabel>{alphaStackSectionTitle}</SectionLabel>
        <p className="text-[10px] text-gray-400 italic mb-1">
          {alphaStackSubtitle}
        </p>
        <div className="mb-2 lg:hidden">
          {alphaStackRows.map((row) =>
            row.isTotalRow ? (
              <div
                key={row.label}
                className="group relative overflow-hidden flex items-center justify-between bg-ios-dark text-white rounded-2xl px-6 py-4 mt-3 transition-colors duration-700"
              >
                <div className="absolute inset-0 bg-ios-gray-bg/90 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100" />
                <span className="relative z-10 text-sm font-semibold text-white group-hover:text-gray-700 transition-colors duration-700">
                  {row.label}
                </span>
                <span
                  className="relative z-10 text-xl font-medium text-ios-green"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {row.value}
                </span>
              </div>
            ) : (
              <FieldRow key={row.label} label={row.label}>
                <span className="text-sm font-semibold text-black">
                  {row.value}
                </span>
              </FieldRow>
            )
          )}
        </div>
        <div className="hidden lg:block mb-2">
          {targetNetIrrRow && (
            <button
              type="button"
              onClick={() => setIsAlphaBreakdownOpen((prev) => !prev)}
              className="group relative overflow-hidden w-full text-left flex items-center justify-between bg-ios-dark text-white rounded-2xl px-6 py-4 transition-colors duration-700"
            >
              <div className="absolute inset-0 bg-ios-gray-bg/90 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100" />
              <span className="relative z-10 text-sm font-semibold text-white group-hover:text-gray-700 transition-colors duration-700">
                {targetNetIrrRow.label}
              </span>
              <div className="relative z-10 flex items-center gap-3">
                <span
                  className="text-xl font-medium text-ios-green"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {targetNetIrrRow.value}
                </span>
                <span className="material-symbols-outlined !text-[1.15rem] text-hushh-blue">
                  {isAlphaBreakdownOpen ? "expand_less" : "expand_more"}
                </span>
              </div>
            </button>
          )}

          {isAlphaBreakdownOpen && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              {alphaBreakdownRows.map((row) => (
                <div
                  key={row.label}
                  className="group border border-gray-200 rounded-2xl p-4 bg-gradient-to-b from-white to-gray-50/60 hover:border-hushh-blue/25 transition-all"
                >
                  <p className="text-[11px] font-medium text-black leading-snug mb-3 min-h-[34px]">
                    {row.label}
                  </p>
                  <div className="w-full h-2.5 rounded-full bg-gray-200/80 overflow-hidden mb-2 shadow-inner">
                    <div
                      className="relative h-full rounded-full bg-gradient-to-r from-hushh-blue to-hushh-blue/70 transition-all duration-700"
                      style={{ width: `${getProgressWidth(row.value)}%` }}
                    >
                      <span className="absolute inset-0 opacity-60 bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.55)_45%,rgba(255,255,255,0)_70%)] animate-[pulse_2.4s_ease-in-out_infinite]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400">
                      Annual Range
                    </p>
                    <p className="text-[12px] font-semibold text-hushh-blue group-hover:text-ios-dark transition-colors">
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Risk Management ── */}
        <SectionLabel>{riskSectionTitle}</SectionLabel>
        <div className="space-y-3 mb-2 lg:hidden">
          {riskCards.map((card) => (
            <FeatureCard
              key={card.title}
              icon={RISK_ICONS[card.title] || "security"}
              iconColor={RISK_COLORS[card.title] || "text-ios-green"}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>
        <div className="hidden lg:grid lg:grid-cols-2 gap-4 mb-2">
          {riskCards.map((card) => (
            <FeatureHighlightTile
              key={card.title}
              icon={RISK_ICONS[card.title] || "security"}
              iconColor={RISK_COLORS[card.title] || "text-ios-green"}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>

        {/* ── Key Terms (FieldRow style) ── */}
        <SectionLabel>{keyTermsSectionTitle}</SectionLabel>
        <p className="text-[10px] text-gray-400 italic mb-1">
          {keyTermsSubtitle}
        </p>

        {/* First terms as FieldRows */}
        <div className="mb-4">
          {keyTerms.slice(0, 2).map((term) => (
            <FieldRow key={term.title} label={term.title}>
              <span className="text-[12px] font-medium text-black max-w-[180px] text-right leading-snug">
                {term.content}
              </span>
            </FieldRow>
          ))}
        </div>

        {/* Share Classes (compact cards) */}
        <SectionLabel>Share Classes</SectionLabel>
        <div className="space-y-3 mb-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
          {shareClasses.map((sc) => (
            <div
              key={sc.shareClass}
              className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:bg-gray-50/40 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ios-dark flex items-center justify-center">
                    <span className="material-symbols-outlined text-white !text-[0.9rem]">
                      account_balance_wallet
                    </span>
                  </div>
                  <span className="text-[13px] font-semibold text-black">
                    {sc.shareClass}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-hushh-blue bg-hushh-blue/10 px-2.5 py-1 rounded-full">
                  Min {sc.minInvestment}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center rounded-xl border border-gray-200 bg-white px-2 py-2 transition-all hover:border-hushh-blue/40 hover:bg-hushh-blue/5">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">
                    Mgmt
                  </p>
                  <p className="text-[12px] font-semibold text-black transition-colors hover:text-hushh-blue">
                    {sc.managementFee}
                  </p>
                </div>
                <div className="text-center rounded-xl border border-gray-200 bg-white px-2 py-2 transition-all hover:border-ios-green/40 hover:bg-ios-green/5">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">
                    Perf
                  </p>
                  <p className="text-[12px] font-semibold text-black transition-colors hover:text-ios-green">
                    {sc.performanceFee}
                  </p>
                </div>
                <div className="text-center rounded-xl border border-gray-200 bg-white px-2 py-2 transition-all hover:border-ios-yellow/50 hover:bg-ios-yellow/10">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">
                    Hurdle
                  </p>
                  <p className="text-[12px] font-semibold text-black transition-colors hover:text-ios-yellow">
                    {sc.hurdleRate}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Remaining terms */}
        <div className="mb-6">
          {keyTerms.slice(2).map((term) => (
            <FieldRow key={term.title} label={term.title}>
              <span className="text-[12px] font-medium text-black max-w-[180px] text-right leading-snug">
                {term.content}
              </span>
            </FieldRow>
          ))}
        </div>

        {/* ── Join / CTA ── */}
        <section className="border-t border-gray-200 pt-8 mb-8">
          <h2
            className="text-[22px] font-medium text-black tracking-tight mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {joinSectionTitle}
          </h2>
          <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-8 max-w-xs">
            {joinSectionDescription}
          </p>

          <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-3">
            <div className="lg:w-1/2">
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={handleCompleteProfile}
              >
                {joinButtonLabel}
                <span className="material-symbols-outlined !text-[1.1rem]">
                  arrow_forward
                </span>
              </HushhTechCta>
            </div>
            <div className="lg:w-1/2">
              <HushhTechCta
                variant={HushhTechCtaVariant.WHITE}
                onClick={() => navigate("/")}
              >
                Back to Home
              </HushhTechCta>
            </div>
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <p
          className="text-[9px] text-gray-400 text-center leading-relaxed italic max-w-xs mx-auto mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Investing involves risk, including possible loss of principal. Past
          performance does not guarantee future results. Hushh Technologies is an
          SEC registered investment advisor.
        </p>
      </main>

      {/* ═══ Footer Nav ═══ */}
      <div className="lg:hidden">
        <HushhTechFooter activeTab={HushhFooterTab.FUND_A} />
      </div>
    </div>
  );
};

export default FundA;
