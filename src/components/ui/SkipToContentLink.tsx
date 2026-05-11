import React from "react";

const MAIN_CONTENT_SELECTOR = '#main-content, main, [role="main"]';

export function SkipToContentLink() {
  const handleSkipToContent = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const mainContent = document.querySelector<HTMLElement>(MAIN_CONTENT_SELECTOR);
    if (!mainContent) return;

    event.preventDefault();

    if (!mainContent.hasAttribute("tabindex")) {
      mainContent.setAttribute("tabindex", "-1");
      mainContent.addEventListener("blur", () => mainContent.removeAttribute("tabindex"), { once: true });
    }

    mainContent.focus({ preventScroll: true });
    mainContent.scrollIntoView({ block: "start" });
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkipToContent}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-hushh-blue"
    >
      Skip to content
    </a>
  );
}
