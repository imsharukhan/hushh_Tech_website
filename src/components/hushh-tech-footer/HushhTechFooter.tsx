/**
 * HushhTechFooter — Reusable bottom navigation bar
 * Floating dark rounded bar with 4 nav tabs.
 *
 * Usage:
 *   <HushhTechFooter
 *     activeTab={HushhFooterTab.HOME}
 *     onTabChange={(tab) => navigate(tab)}
 *   />
 */
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import {
  buildLoginRedirectPath,
  isGuestAuthRoute,
} from "../../auth/routePolicy";

/** Enum for footer navigation tabs */
export enum HushhFooterTab {
  HOME = "home",
  FUND_A = "fund_a",
  COMMUNITY = "community",
  PROFILE = "profile",
}

interface HushhTechFooterProps {
  /** Currently active tab */
  activeTab?: HushhFooterTab;
  /** Callback when a tab is tapped */
  onTabChange?: (tab: HushhFooterTab) => void;
  /** Extra classes on root container */
  className?: string;
}

/** Static tab configuration */
const STATIC_TABS = [
  { id: HushhFooterTab.HOME, icon: "home", label: "Home" },
  { id: HushhFooterTab.FUND_A, icon: null, label: "Fund A" },
  { id: HushhFooterTab.COMMUNITY, icon: "groups", label: "Comm" },
];

type FooterTabConfig = {
  id: HushhFooterTab;
  icon: string | null;
  label: string;
  path: string;
};

/** Fund A has a custom icon (circle with line) */
const FundAIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
        isActive
          ? "border-white"
          : "border-gray-400 group-hover:border-white"
      }`}
    >
      <div
        className={`w-[1px] h-2 transition-colors ${
          isActive
            ? "bg-white"
            : "bg-gray-400 group-hover:bg-white"
        }`}
      />
    </div>
  );
};

const HushhTechFooter: React.FC<HushhTechFooterProps> = ({
  activeTab,
  onTabChange,
  className = "",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuthSession();
  const isAuthenticated = status === "authenticated";

  const tabs: FooterTabConfig[] = [
    { ...STATIC_TABS[0], path: "/" },
    { ...STATIC_TABS[1], path: "/discover-fund-a" },
    { ...STATIC_TABS[2], path: "/community" },
    {
      id: HushhFooterTab.PROFILE,
      icon: isAuthenticated ? "person" : "login",
      label: isAuthenticated ? "Profile" : "Log In",
      path: isAuthenticated
        ? "/profile"
        : buildLoginRedirectPath("/profile"),
    },
  ];

  const resolvedActiveTab =
    activeTab ??
    (!isAuthenticated && isGuestAuthRoute(location.pathname)
      ? HushhFooterTab.PROFILE
      : undefined);

  /** Handle tab click — use parent callback if provided, else navigate */
  const handleTabClick = (tab: FooterTabConfig) => {
    if (onTabChange) {
      onTabChange(tab.id);
      return;
    } else {
      navigate(tab.path);
    }
  };

  const renderTab = (tab: FooterTabConfig) => {
    const isActive = resolvedActiveTab === tab.id;

    // Text color: active = white, inactive = gray with hover
    const textColor = isActive
      ? "text-white"
      : "text-gray-500 group-hover:text-gray-300";

    const iconColor = isActive
      ? "text-white"
      : "text-gray-400 group-hover:text-white";

    return (
      <button
        key={tab.id}
        onClick={() => handleTabClick(tab)}
        className="flex flex-col items-center gap-1 group cursor-pointer bg-transparent border-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-lg"
        aria-label={tab.label}
        aria-current={isActive ? "page" : undefined}
        tabIndex={0}
      >
        {tab.id === HushhFooterTab.FUND_A ? (
          <FundAIcon isActive={isActive} />
        ) : (
          <span
            className={`material-symbols-outlined text-xl transition-colors ${iconColor}`}
          >
            {tab.icon}
          </span>
        )}
        <span
          className={`text-[0.55rem] font-bold tracking-widest uppercase transition-colors ${textColor}`}
        >
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4 pointer-events-none ${className}`}
    >
      <div className="relative max-w-md mx-auto pointer-events-auto">
        <div className="h-[72px] bg-[#050505] rounded-[2rem] flex items-center px-5 relative shadow-2xl">
          <div className="flex items-center w-full justify-between gap-2">
            {tabs.map(renderTab)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HushhTechFooter;
