/**
 * HushhTechNavDrawer — Full-screen navigation drawer (Revamped)
 * Apple iOS colors, proper English capitalization, hushh-blue accents.
 * Slides in from right, covers entire viewport.
 */
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import hushhLogo from "../images/Hushhogo.png";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useModalKeyboardNavigation } from "../../hooks/useModalKeyboardNavigation";

interface NavItem {
  icon: string;
  label: string;
  path: string;
  highlight?: boolean;
  subtitle?: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "home", label: "Home", path: "/" },
  { icon: "menu_book", label: "Our Philosophy", path: "/about/leadership" },
  { icon: "pie_chart", label: "Fund A", path: "/discover-fund-a" },
  { icon: "groups", label: "Community", path: "/community" },
  { icon: "verified_user", label: "KYC Studio Alpha", path: "/a2a-playground" },
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

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      className="fixed inset-0 z-[100] bg-white flex flex-col selection:bg-hushh-blue selection:text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      tabIndex={-1}
    >
      {/* ── Header ── */}
      <div className="px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            <img src={hushhLogo} alt="Hushh" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-gray-900 pt-0.5">
            hushh technologies
          </span>
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined text-gray-500 !text-[1.2rem]">
            close
          </span>
        </button>
      </div>

      {/* ── Nav Links ── */}
      <div className="flex-1 px-8 pt-6 pb-8 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-1">
          {/* Main nav items */}
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="group flex items-center gap-5 py-4 border-b border-gray-50 hover:bg-hushh-blue/5 transition-colors -mx-4 px-4 rounded-xl w-full text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-hushh-blue/10 border border-transparent group-hover:border-hushh-blue/20 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-gray-400 group-hover:text-hushh-blue transition-colors !text-[1.1rem]">
                  {item.icon}
                </span>
              </div>
              <span className="text-[0.95rem] font-medium text-gray-900 tracking-wide group-hover:text-hushh-blue transition-colors">
                {item.label}
              </span>
            </button>
          ))}

          {/* Highlight card — unlock coins */}
          <button
            onClick={() => handleNavigate(HIGHLIGHT_ITEM.path)}
            className="group flex items-center gap-5 py-5 my-2 -mx-4 px-4 rounded-xl bg-hushh-blue/5 border border-hushh-blue/20 w-full text-left hover:bg-hushh-blue/10 transition-colors"
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
          {BOTTOM_NAV.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="group flex items-center gap-5 py-4 border-b border-gray-50 hover:bg-hushh-blue/5 transition-colors -mx-4 px-4 rounded-xl w-full text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-hushh-blue/10 border border-transparent group-hover:border-hushh-blue/20 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-gray-400 group-hover:text-hushh-blue transition-colors !text-[1.1rem]">
                  {item.icon}
                </span>
              </div>
              <span className="text-[0.95rem] font-medium text-gray-900 tracking-wide group-hover:text-hushh-blue transition-colors">
                {item.label}
              </span>
            </button>
          ))}
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
            <div className="flex flex-col gap-4 pl-[3.25rem]">
              <button
                onClick={() => handleNavigate("/login")}
                className="text-left text-[0.85rem] font-medium text-gray-500 hover:text-hushh-blue transition-colors tracking-wide"
              >
                Log In
              </button>
              <button
                onClick={() => handleNavigate("/signup")}
                className="text-left text-[0.85rem] font-medium text-gray-400 hover:text-hushh-blue transition-colors tracking-wide"
              >
                Sign Up
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
  );
};

export default HushhTechNavDrawer;
