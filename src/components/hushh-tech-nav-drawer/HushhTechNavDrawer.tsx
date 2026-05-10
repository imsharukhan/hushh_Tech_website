/**
 * HushhTechNavDrawer — Full-screen navigation drawer (Revamped)
 * Apple iOS colors, proper English capitalization, hushh-blue accents.
 * Slides in from right, covers entire viewport.
 */
import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import hushhLogo from "../images/Hushhogo.png";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useModalKeyboardNavigation } from "../../hooks/useModalKeyboardNavigation";
import { moveFocusWithin } from "../../utils/keyboardNavigation";

interface NavItem {
  icon: string;
  label: string;
  path: string;
  highlight?: boolean;
  subtitle?: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "home", label: "Home", path: "/" },
  { icon: "menu_book", label: "Our Philosophy", path: "/philosophy" },
  { icon: "pie_chart", label: "Fund A", path: "/discover-fund-a" },
  { icon: "groups", label: "Community", path: "/community" },
  { icon: "verified_user", label: "KYC Studio Alpha", path: "/kyc" },
];

const HIGHLIGHT_ITEM: NavItem = {
  icon: "lock",
  label: "Unlock 300K Coins",
  subtitle: "$1 or use coupon code",
  path: "/unlock-coins",
  highlight: true,
};

const BOTTOM_NAV: NavItem[] = [
  { icon: "mail", label: "Contact", path: "/contact" },
  { icon: "help", label: "FAQ", path: "/faq" },
];

interface HushhTechNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const HushhTechNavDrawer: React.FC<HushhTechNavDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, signOut } = useAuthSession();
  const isAuthenticated = status === "authenticated";
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useModalKeyboardNavigation({
    isOpen,
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
    onClose,
  });

  /* Lock body scroll when drawer is open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    navigate("/login");
  };

  const handleDrawerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    moveFocusWithin(drawerRef.current, event);
  };

  const isActive = (path: string) => location.pathname === path;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px] pt-20 md:pt-24 px-3 md:px-6 pb-3 md:pb-6 flex items-start justify-end selection:bg-hushh-blue selection:text-white"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        className="w-full max-w-3xl max-h-[calc(100vh-5.5rem)] md:max-h-[calc(100vh-7.5rem)] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl flex flex-col animate-scaleIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hushh-nav-drawer-title"
        tabIndex={-1}
        onKeyDown={handleDrawerKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
      {/* ── Header ── */}
      <div className="px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            <img src={hushhLogo} alt="Hushh" className="w-5 h-5 object-contain" />
          </div>
          <span
            id="hushh-nav-drawer-title"
            className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-gray-900 pt-0.5"
          >
            hushh technologies
          </span>
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hushh-blue focus-visible:ring-offset-2"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined text-gray-500 !text-[1.2rem]">
            close
          </span>
        </button>
      </div>

      {/* ── Nav Links ── */}
      <div className="flex-1 px-5 md:px-6 pt-2 pb-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-1">
          {/* Main nav items */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                aria-current={isActive(item.path) ? "page" : undefined}
                className="group flex items-center gap-3 py-3 px-3 border border-gray-100 hover:border-hushh-blue/20 bg-white hover:bg-hushh-blue/5 transition-colors rounded-xl w-full text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-hushh-blue/10 border border-transparent group-hover:border-hushh-blue/20 flex items-center justify-center transition-all shrink-0">
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-hushh-blue transition-colors !text-[1rem]">
                    {item.icon}
                  </span>
                </div>
                <span className="text-[0.9rem] font-medium text-gray-900 tracking-wide group-hover:text-hushh-blue transition-colors leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Highlight card — unlock coins */}
          <button
            onClick={() => handleNavigate(HIGHLIGHT_ITEM.path)}
            className="group flex items-center gap-4 py-3.5 my-3 px-3 rounded-xl bg-hushh-blue/5 border border-hushh-blue/20 w-full text-left hover:bg-hushh-blue/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-hushh-blue/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-hushh-blue !text-[1rem]">
                {HIGHLIGHT_ITEM.icon}
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[0.95rem] font-semibold text-gray-900 tracking-wide">
                {HIGHLIGHT_ITEM.label}
              </span>
              <span className="text-[0.7rem] text-gray-500 font-medium mt-0.5">
                {HIGHLIGHT_ITEM.subtitle}
              </span>
            </div>
            <span className="ml-auto material-symbols-outlined text-hushh-blue/40 !text-[1rem]">
              arrow_forward
            </span>
          </button>

          {/* Bottom nav items */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {BOTTOM_NAV.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                aria-current={isActive(item.path) ? "page" : undefined}
                className="group flex items-center gap-3 py-3 px-3 border border-gray-100 hover:border-hushh-blue/20 bg-white hover:bg-hushh-blue/5 transition-colors rounded-xl w-full text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-hushh-blue/10 border border-transparent group-hover:border-hushh-blue/20 flex items-center justify-center transition-all shrink-0">
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-hushh-blue transition-colors !text-[1rem]">
                    {item.icon}
                  </span>
                </div>
                <span className="text-[0.9rem] font-medium text-gray-900 tracking-wide group-hover:text-hushh-blue transition-colors">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer section ── */}
        <div className="mt-12 pt-8 border-t border-gray-100 space-y-6">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => handleNavigate("/hushh-user-profile")}
                className="flex items-center gap-5 group w-full text-left"
              >
                <div className="w-8 h-8 rounded-full bg-hushh-blue text-white flex items-center justify-center">
                  <span className="material-symbols-outlined !text-[1.1rem]">person</span>
                </div>
                <span className="text-[0.95rem] font-medium text-gray-900 tracking-wide group-hover:text-hushh-blue transition-colors">
                  View Profile
                </span>
              </button>

              <div className="flex flex-col gap-4 pl-[3.25rem]">
                <button
                  onClick={() => void handleLogout()}
                  className="text-left text-[0.85rem] font-medium text-gray-500 hover:text-red-500 transition-colors tracking-wide"
                >
                  Log Out
                </button>
                <button
                  onClick={() => handleNavigate("/delete-account")}
                  className="text-left text-[0.85rem] font-medium text-gray-400 hover:text-red-500 transition-colors tracking-wide"
                >
                  Delete Account
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button
                onClick={() => handleNavigate("/login")}
                className="group flex items-center gap-3 py-3 px-3 border border-gray-100 hover:border-hushh-blue/20 bg-white hover:bg-hushh-blue/5 transition-colors rounded-xl w-full text-left"
              >
                <span className="material-symbols-outlined text-gray-400 group-hover:text-hushh-blue transition-colors !text-[1rem]">
                  login
                </span>
                <span className="text-[0.9rem] font-medium text-gray-900 tracking-wide group-hover:text-hushh-blue transition-colors">
                  Log In
                </span>
              </button>
              <button
                onClick={() => handleNavigate("/signup")}
                className="group flex items-center gap-3 py-3 px-3 border border-gray-100 hover:border-hushh-blue/20 bg-white hover:bg-hushh-blue/5 transition-colors rounded-xl w-full text-left"
              >
                <span className="material-symbols-outlined text-gray-400 group-hover:text-hushh-blue transition-colors !text-[1rem]">
                  person_add
                </span>
                <span className="text-[0.9rem] font-medium text-gray-900 tracking-wide group-hover:text-hushh-blue transition-colors">
                  Sign Up
                </span>
              </button>
            </div>
          )}

          {/* Decorative bar */}
          <div className="flex items-center gap-2 pl-[3.25rem] pt-4 opacity-50 grayscale">
            <div className="h-3 w-8 bg-gray-200 rounded" />
            <div className="h-3 w-3 bg-gray-200 rounded-full" />
            <div className="h-3 w-6 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default HushhTechNavDrawer;
