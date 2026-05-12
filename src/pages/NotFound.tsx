/**
 * NotFound (404) Page
 *
 * Displayed when users navigate to non-existent routes.
 * Provides clear messaging and navigation options to guide users back to content.
 *
 * Features:
 * - Large 404 display for immediate recognition
 * - Clear error messaging
 * - Primary actions: Go Home, Contact Support
 * - Quick links to popular pages
 * - Uses the existing app shell without introducing duplicate navigation chrome
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Page Not Found | Hushh Technologies';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main content - centered 404 error page */}
      <main
        id="main-content"
        aria-label="Error page"
        className="flex-grow flex items-center justify-center px-6 py-12"
      >
        <div className="text-center max-w-md">
          {/* Large 404 number */}
          <h1
            aria-hidden="true"
            className="text-[10rem] leading-none font-black text-gray-100 select-none"
          >
            404
          </h1>

          {/* Error message */}
          <h2 className="text-3xl font-bold text-gray-900 mt-6 mb-3 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-base text-gray-600 leading-relaxed mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-black/80 transition-colors"
            >
              <span className="material-symbols-outlined text-[1.2rem]">
                home
              </span>
              <span>Go Home</span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[1.2rem]">
                support_agent
              </span>
              <span>Contact Support</span>
            </Link>
          </div>

          {/* Helpful links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4 font-medium">
              Popular pages:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/discover-fund-a"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                Fund A
              </Link>
              <Link
                to="/community"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                Community
              </Link>
              <Link
                to="/faq"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                FAQ
              </Link>
              <Link
                to="/about/leadership"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
