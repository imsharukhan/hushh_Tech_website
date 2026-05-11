/**
 * HushhTechHeader — Fixed header with hamburger menu + stock ticker
 * Always fixed to top of viewport. Includes spacer div to prevent
 * content from hiding behind it.
 *
 * Left: Hushh logo + brand name. Right: hamburger menu button.
 * Below: Scrolling stock ticker with live quotes (Google, Apple, etc.)
 */
import React, { useState } from "react";
import hushhLogo from "../images/Hushhogo.png";
import HushhTechNavDrawer from "../hushh-tech-nav-drawer/HushhTechNavDrawer";
import { useStockQuotes, StockQuote } from "../../hooks/useStockQuotes";
import { SkipToContentLink } from "../ui/SkipToContentLink";

/* ── Chip-based ticker component — matches Navbar design ── */
const TickerChip = ({ quote, isLoading }: { quote: StockQuote; isLoading?: boolean }) => (
  <div className="group flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white border border-gray-200 shadow-sm pl-1.5 pr-3 hover:shadow-md transition-all">
    {/* Logo circle */}
    <div className="flex w-6 h-6 items-center justify-center rounded-full bg-gray-100 shrink-0 overflow-hidden">
      {quote.logo ? (
        <img
          src={quote.logo}
          alt={`${quote.displaySymbol} logo`}
          width="14"
          height="14"
          className="w-3.5 h-3.5 object-contain"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <span className="text-[9px] font-bold text-gray-600">
          {quote.displaySymbol.charAt(0)}
        </span>
      )}
    </div>

    {/* Symbol */}
    <span className="text-[11px] font-bold text-gray-800 leading-none">
      {quote.displaySymbol}
    </span>

    {/* Change arrow + percent */}
    <div className={`ml-0.5 flex items-center gap-0.5 ${quote.isUp ? "text-green-600" : "text-red-500"}`}>
      <span className="text-[9px]">{quote.isUp ? "▲" : "▼"}</span>
      <span className={`text-[10px] font-semibold ${isLoading ? "animate-pulse" : ""}`}>
        {Math.abs(quote.percentChange).toFixed(1)}%
      </span>
    </div>
  </div>
);

interface HushhTechHeaderProps {
  /** Show the stock ticker strip below header (default: true) */
  showTicker?: boolean;
  /** Extra classes on the header element */
  className?: string;
}

const HushhTechHeader: React.FC<HushhTechHeaderProps> = ({
  showTicker = true,
  className = "",
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch real-time stock quotes (refreshes every 2 minutes)
  const { quotes, loading: quotesLoading, lastUpdated } = useStockQuotes(120000);

  return (
    <>
      <SkipToContentLink />

      {/* Fixed header — always pinned to top */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-sm ${className}`}
      >
        {/* ── Top bar: Logo + Hamburger ── */}
        <div className="px-6 py-4 flex justify-between items-center">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={hushhLogo}
                alt="Hushh Logo"
                width="44"
                height="44"
                className="w-11 h-11 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[18px] font-bold tracking-tight text-gray-900">
                hushh
              </span>
              <span className="text-[11px] font-medium tracking-[0.08em] text-gray-400 uppercase">
                Technologies
              </span>
            </div>
          </div>

          {/* Hamburger menu button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Open menu"
            tabIndex={0}
          >
            <span className="material-symbols-outlined text-white !text-[1.2rem]">
              menu
            </span>
          </button>
        </div>

        {/* ── Stock Ticker Strip — below header nav ── */}
        {showTicker && (
          <section className="relative w-full bg-[#F8F9FA] py-2 border-t border-b border-gray-200">
            {/* Fade-masked marquee */}
            <div className="hushh-ticker-mask relative flex w-full overflow-hidden">
              <div className="hushh-ticker-track flex items-center gap-2.5 px-3">
                {/* First set */}
                {quotes.map((quote, idx) => (
                  <TickerChip
                    key={`a-${quote.symbol}-${idx}`}
                    quote={quote}
                    isLoading={quotesLoading && quotes.length === 0}
                  />
                ))}
                {/* Duplicate for seamless loop */}
                {quotes.map((quote, idx) => (
                  <TickerChip
                    key={`b-${quote.symbol}-${idx}`}
                    quote={quote}
                    isLoading={quotesLoading && quotes.length === 0}
                  />
                ))}
              </div>
            </div>

            {/* Live indicator dot */}
            {lastUpdated && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-medium text-gray-400">
                  {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </section>
        )}
      </header>

      {/* Spacer — prevents content from hiding behind the fixed header */}
      {/* Nav bar ~72px + ticker strip ~49px = ~121px when ticker shown */}
      <div className={showTicker ? "h-[121px]" : "h-[72px]"} />

      {/* Navigation Drawer */}
      <HushhTechNavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Ticker animation styles */}
      <style>{`
        .hushh-ticker-mask {
          mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
        }
        .hushh-ticker-track {
          display: flex;
          animation: hushh-ticker-scroll 45s linear infinite;
          width: max-content;
        }
        @keyframes hushh-ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .hushh-ticker-mask:hover .hushh-ticker-track {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
};

export default HushhTechHeader;
