import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import config from '../../../resources/config/config';
import { useAuthSession } from '../../../auth/AuthSessionProvider';
import { buildLoginRedirectPath } from '../../../auth/routePolicy';

export interface OnboardingData {
  legal_first_name?: string;
  legal_last_name?: string;
  email?: string;
  phone_number?: string;
  phone_country_code?: string;
  is_identity_verified?: boolean;
  identity_verified_at?: string;
}

export interface VerificationStatus {
  status: 'not_started' | 'pending' | 'processing' | 'verified' | 'requires_input' | 'failed';
  document_verified: boolean;
  selfie_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
}

export function useVerifyIdentityLogic() {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, status, user } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [startingVerification, setStartingVerification] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'not_started',
    document_verified: false,
    selfie_verified: false,
    email_verified: false,
    phone_verified: false,
  });

  // Check authentication and load data
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (status === 'booting') {
      return;
    }

    if (!config.supabaseClient) {
      toast({
        title: 'Error',
        description: 'Configuration error',
        status: 'error',
        duration: 5000,
      });
      setLoading(false);
      return;
    }

    if (status !== 'authenticated' || !user) {
      navigate(buildLoginRedirectPath('/onboarding/verify'), { replace: true });
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        // Load onboarding data
        const { data: onboarding } = await config.supabaseClient
          .from('onboarding_data')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (onboarding) {
          setOnboardingData(onboarding);
          
          // If already verified, redirect to profile
          if (onboarding.identity_verified) {
            navigate('/hushh-user-profile');
            return;
          }
        }

        // Check existing verification status
        const { data: verification } = await config.supabaseClient
          .from('identity_verifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (verification) {
          setVerificationStatus({
            status: verification.stripe_status || 'not_started',
            document_verified: verification.document_verified || false,
            selfie_verified: verification.selfie_verified || false,
            email_verified: verification.email_verified || false,
            phone_verified: verification.phone_verified || false,
          });
          
          // If verified, redirect
          if (verification.stripe_status === 'verified') {
            navigate('/hushh-user-profile');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadUserData();
  }, [navigate, status, toast, user]);

  const startVerification = async () => {
    setStartingVerification(true);

    try {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Build phone number with country code
      const fullPhone = onboardingData?.phone_country_code && onboardingData?.phone_number
        ? `${onboardingData.phone_country_code}${onboardingData.phone_number}`
        : undefined;

      // Call edge function to create verification session
      const response = await fetch(
        `${config.SUPABASE_URL}/functions/v1/create-verification-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: onboardingData?.email,
            phone: fullPhone,
            returnUrl: `${window.location.origin}/onboarding/verify-complete`,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start verification');
      }

      // Redirect to Stripe verification URL
      if (result.session?.url) {
        window.location.href = result.session.url;
      } else {
        throw new Error('No verification URL received');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start verification',
        status: 'error',
        duration: 5000,
      });
      setStartingVerification(false);
    }
  };

  const skipVerification = async () => {
    // Mark as skipped and proceed to profile
    // User can verify later from profile page
    navigate('/hushh-user-profile');
  };

  const goBack = () => navigate('/onboarding/step-9');

  return {
    loading,
    startingVerification,
    onboardingData,
    verificationStatus,
    startVerification,
    skipVerification,
    goBack,
  };
}
