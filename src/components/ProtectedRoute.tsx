import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import config from '../resources/config/config';
import {
  FINANCIAL_LINK_ROUTE,
  normalizeFinancialLinkStatus,
} from '../services/onboarding/flow';
import { useAuthSession } from '../auth/AuthSessionProvider';
import { buildLoginRedirectPath } from '../auth/routePolicy';
import { fetchResolvedOnboardingProgress } from '../services/onboarding/progress';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const BOOT_TIMEOUT_MS = 8000;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, status } = useAuthSession();
  const userId = session?.user?.id;
  const authCheckKey = [
    status,
    userId ?? '',
    location.pathname,
    location.search,
    location.hash,
  ].join('|');
  const [isLoading, setIsLoading] = useState(true);
  const [authorizedCheckKey, setAuthorizedCheckKey] = useState<string | null>(null);
  const isAuthorized =
    status === 'authenticated' && authorizedCheckKey === authCheckKey;
  const bootTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [onboardingError, setOnboardingError] = useState(false);

  // Boot timeout safety net — if isLoading stays true for >8 seconds
  // (e.g., auth status stuck at 'booting'), redirect to login instead
  // of showing an infinite spinner. With the AuthSessionProvider fix
  // (instant boot from localStorage), this should rarely trigger.
  useEffect(() => {
    if (isLoading) {
      bootTimeoutRef.current = setTimeout(() => {
        console.warn(
          '[ProtectedRoute] Boot timeout reached (8s). Redirecting to login.'
        );
        setIsLoading(false);
        navigate(
          buildLoginRedirectPath(location.pathname, location.search, location.hash),
          { replace: true }
        );
      }, BOOT_TIMEOUT_MS);
    } else if (bootTimeoutRef.current) {
      clearTimeout(bootTimeoutRef.current);
      bootTimeoutRef.current = null;
    }

    return () => {
      if (bootTimeoutRef.current) {
        clearTimeout(bootTimeoutRef.current);
        bootTimeoutRef.current = null;
      }
    };
  }, [isLoading, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    let isCurrentCheck = true;

    const redirectToLogin = () => {
      navigate(
        buildLoginRedirectPath(location.pathname, location.search, location.hash),
        { replace: true }
      );
    };

    const checkAuthAndOnboarding = async () => {
      let shouldSettleLoading = true;
      setIsLoading(true);
      setAuthorizedCheckKey(null);
      setOnboardingError(false);

      try {
        if (status === 'booting') {
          shouldSettleLoading = false;
          return;
        }

        if (!config.supabaseClient) {
          redirectToLogin();
          return;
        }

        if (!userId) {
          redirectToLogin();
          return;
        }

        const onboardingData = await fetchResolvedOnboardingProgress(
          config.supabaseClient,
          userId
        );

        if (!isCurrentCheck) {
          return;
        }

        const isOnOnboardingPage = location.pathname.startsWith('/onboarding/');
        const isOnFinancialLinkPage = location.pathname === FINANCIAL_LINK_ROUTE;
        const isInvestorProfileAlias = location.pathname === '/investor-profile';
        const financialLinkStatus = normalizeFinancialLinkStatus(
          onboardingData?.financial_link_status
        );

        if (!onboardingData || !onboardingData.is_completed) {
          if (
            !isOnOnboardingPage &&
            !(isInvestorProfileAlias && financialLinkStatus !== 'pending')
          ) {
            navigate(FINANCIAL_LINK_ROUTE, { replace: true });
            return;
          }

          if (!isOnFinancialLinkPage && financialLinkStatus === 'pending') {
            navigate(FINANCIAL_LINK_ROUTE, { replace: true });
            return;
          }
        }

        console.log('[ProtectedRoute] Authorization check passed');
        setAuthorizedCheckKey(authCheckKey);
      } catch (error) {
        if (!isCurrentCheck) {
          return;
        }

        console.error("Error checking auth:", error);

        // Only redirect to login if the user is genuinely unauthenticated.
        // If userId is present, the error came from fetchResolvedOnboardingProgress
        // (network blip, Supabase timeout, DB unavailable) — not from auth.
        // Redirecting an authenticated user to login in this case is incorrect
        // and would silently log them out during transient infrastructure issues.
        if (userId) {
          setOnboardingError(true);
        } else {
          redirectToLogin();
        }
      } finally {
        if (isCurrentCheck && shouldSettleLoading) {
          setIsLoading(false);
        }
      }
    };

    checkAuthAndOnboarding();

    return () => {
      isCurrentCheck = false;
    };
  }, [authCheckKey, location.hash, location.pathname, location.search, navigate, status, userId]);

  if (onboardingError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Something went wrong. Please refresh the page.</p>
          <button
            className="mt-4 px-4 py-2 text-sm text-cyan-600 underline"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
