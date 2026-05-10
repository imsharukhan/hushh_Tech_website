/**
 * Step 1 — All Business Logic
 * Share class selection, recurring investment config, Supabase upsert
 */
import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../resources/config/config';
import { upsertOnboardingData } from '../../../services/onboarding/upsertOnboardingData';
import {
  FINANCIAL_LINK_ROUTE,
  TOTAL_VISIBLE_ONBOARDING_STEPS,
  resolveFinancialLinkStatus,
} from '../../../services/onboarding/flow';
import { fetchOnboardingProgress } from '../../../services/onboarding/progress';
import { useFooterVisibility } from '../../../utils/useFooterVisibility';

/* ─── Types & Constants ─── */
export type RecurringFrequency = 'once_a_month' | 'twice_a_month' | 'weekly' | 'every_other_week';

export interface ShareClass {
  id: string; name: string; tier: 'ultra' | 'premium' | 'standard';
  unitPrice: number; displayPrice: string; description: string;
  tierLabel?: string; tierBg?: string; tierText?: string;
}

export const SHARE_CLASSES: ShareClass[] = [
  { id: 'class_a', name: 'Class A', tier: 'ultra', unitPrice: 25000000, displayPrice: '$25M',
    description: 'Maximum allocation priority with exclusive institutional benefits.',
    tierLabel: 'Ultra', tierBg: 'bg-indigo-100 dark:bg-indigo-900', tierText: 'text-indigo-600 dark:text-indigo-300' },
  { id: 'class_b', name: 'Class B', tier: 'premium', unitPrice: 5000000, displayPrice: '$5M',
    description: 'Enhanced portfolio access and relationship management.',
    tierLabel: 'Premium', tierBg: 'bg-yellow-100 dark:bg-yellow-900/40', tierText: 'text-yellow-700 dark:text-yellow-400' },
  { id: 'class_c', name: 'Class C', tier: 'standard', unitPrice: 1000000, displayPrice: '$1M',
    description: 'Standard tier with full access to AI-powered multi-strategy alpha.' },
];

export const TOTAL_STEPS = TOTAL_VISIBLE_ONBOARDING_STEPS;
export const MIN_RECURRING_AMOUNT = 100;
export const MAX_RECURRING_AMOUNT = 100000000;

export const FREQ_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: 'once_a_month', label: 'Once a month' },
  { value: 'twice_a_month', label: 'Twice a month' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'every_other_week', label: 'Bi-weekly' },
];

export const AMOUNT_PRESETS = [500000, 750000, 1000000, 1500000];

export const formatCurrency = (amount: number): string => {
  if (amount === 0) return '$0';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
  return `$${amount.toLocaleString()}`;
};

export const formatNumberWithCommas = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '');
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const parseFormattedNumber = (value: string): number =>
  parseInt(value.replace(/[^\d]/g, ''), 10) || 0;

/* ─── Hook Return Type ─── */
export interface Step1Logic {
  units: Record<string, number>;
  frequency: RecurringFrequency;
  investmentDay: string;
  selectedAmount: number | null;
  customAmount: string;
  customAmountError: string | null;
  error: string | null;
  isLoading: boolean;
  isFooterVisible: boolean;
  totalInvestment: number;
  hasSelection: boolean;
  recurringEnabled: boolean;
  handleUnitChange: (classId: string, delta: number) => void;
  handleAmountClick: (amount: number) => void;
  handleCustomAmountChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setFrequency: (f: RecurringFrequency) => void;
  setInvestmentDay: (d: string) => void;
  toggleRecurring: () => void;
  handleSkip: () => void;
  handleNext: () => Promise<void>;
  handleBack: () => void;
}

/* ─── Main Hook ─── */
export const useStep1Logic = (): Step1Logic => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFooterVisible = useFooterVisibility();
  const [units, setUnits] = useState<Record<string, number>>({ class_a: 0, class_b: 0, class_c: 0 });
  const [frequency, setFrequency] = useState<RecurringFrequency>('once_a_month');
  const [investmentDay, setInvestmentDay] = useState('1st of the month');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customAmountError, setCustomAmountError] = useState<string | null>(null);
  /* Recurring investment — default OFF, user can toggle ON */
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const toggleRecurring = () => setRecurringEnabled((prev) => !prev);

  const totalInvestment = SHARE_CLASSES.reduce((t, sc) => t + units[sc.id] * sc.unitPrice, 0);
  const hasSelection = Object.values(units).some((c) => c > 0);

  /* Scroll & body class */
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.classList.add('onboarding-page-scroll');
    document.body.classList.add('onboarding-page-scroll');
    return () => {
      document.documentElement.classList.remove('onboarding-page-scroll');
      document.body.classList.remove('onboarding-page-scroll');
    };
  }, []);

  /* Load user + existing data */
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!config.supabaseClient) return;
      const { data: { user } } = await config.supabaseClient.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);

      const onboardingProgress = await fetchOnboardingProgress(
        config.supabaseClient,
        user.id
      );
      const { data: financialData, error: finError } = await config.supabaseClient
        .from('user_financial_data').select('status').eq('user_id', user.id).maybeSingle();
      if (finError) console.warn('[Step1] Financial data query error:', finError.message);

      const financialLinkStatus = resolveFinancialLinkStatus(
        onboardingProgress?.financial_link_status,
        financialData?.status
      );
      if (financialLinkStatus === 'pending') {
        navigate(FINANCIAL_LINK_ROUTE, { replace: true }); return;
      }

      const { data: onboardingData } = await config.supabaseClient
        .from('onboarding_data')
        .select('class_a_units, class_b_units, class_c_units, recurring_frequency, recurring_day_of_month, recurring_amount')
        .eq('user_id', user.id).maybeSingle();

      if (onboardingData) {
        setUnits({ class_a: onboardingData.class_a_units || 0, class_b: onboardingData.class_b_units || 0, class_c: onboardingData.class_c_units || 0 });
        if (onboardingData.recurring_frequency) {
          setRecurringEnabled(true);
          const freqMap: Record<string, RecurringFrequency> = {
            once_a_month: 'once_a_month', twice_a_month: 'twice_a_month',
            weekly: 'weekly', every_other_week: 'every_other_week',
            monthly: 'once_a_month', bimonthly: 'twice_a_month', biweekly: 'every_other_week',
          };
          setFrequency(freqMap[String(onboardingData.recurring_frequency)] || 'once_a_month');
        }
        if (onboardingData.recurring_day_of_month) {
          const d = onboardingData.recurring_day_of_month;
          setInvestmentDay(d === 31 ? 'Last day of the month' : d === 15 ? '15th of the month' : '1st of the month');
        }
        if (onboardingData.recurring_amount) {
          const amt = onboardingData.recurring_amount;
          if ([500000, 750000, 1000000, 1500000].includes(amt)) { setSelectedAmount(amt); setCustomAmount(''); }
          else { setSelectedAmount(null); setCustomAmount(amt.toLocaleString()); }
        }
      }
    };
    getCurrentUser();
  }, [navigate]);

  /* Handlers */
  const handleUnitChange = (classId: string, delta: number) => {
    setUnits((prev) => ({ ...prev, [classId]: Math.max(0, prev[classId] + delta) }));
  };

  const handleAmountClick = (amount: number) => {
    setSelectedAmount(amount); setCustomAmount(''); setCustomAmountError(null); setError(null);
  };

  const validateRecurringAmount = (v: number, rawInput: string): string | null => {
    /* If field is empty, no error (user hasn't typed anything) */
    if (!rawInput || rawInput.trim() === '') return null;
    /* If user typed something that parses to 0 or below minimum, reject */
    if (v < MIN_RECURRING_AMOUNT) return `Minimum is $${MIN_RECURRING_AMOUNT.toLocaleString()}`;
    if (v > MAX_RECURRING_AMOUNT) return `Maximum is $${(MAX_RECURRING_AMOUNT / 1000000).toFixed(0)}M`;
    return null;
  };

  const handleCustomAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedAmount(null); setError(null);
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (raw.length > 12) return;
    const formatted = formatNumberWithCommas(raw);
    setCustomAmount(formatted);
    setCustomAmountError(validateRecurringAmount(parseFormattedNumber(formatted), raw));
  };

  const handleNext = async () => {
    if (!userId || !config.supabaseClient || !hasSelection) return;
    /* Only block on custom amount error when recurring is active */
    if (recurringEnabled && customAmountError) { setError(customAmountError); return; }

    /* When recurring is ON, validate that user picked a valid amount */
    if (recurringEnabled) {
      const recurringAmt = selectedAmount || parseFormattedNumber(customAmount);
      if (recurringAmt < MIN_RECURRING_AMOUNT) {
        setError(`Please select a recurring amount (minimum $${MIN_RECURRING_AMOUNT.toLocaleString()})`);
        return;
      }
    }

    setIsLoading(true); setError(null);
    try {
      /* Only use recurring amount if toggle is ON */
      const recurringAmount = recurringEnabled
        ? (selectedAmount || parseFormattedNumber(customAmount))
        : 0;
      let dayInt = 1;
      if (investmentDay.includes('15th')) dayInt = 15;
      else if (investmentDay.includes('Last')) dayInt = 31;

      const updateData: Record<string, unknown> = {
        selected_fund: 'hushh_fund_a', class_a_units: units.class_a,
        class_b_units: units.class_b, class_c_units: units.class_c,
        initial_investment_amount: totalInvestment, current_step: 1,
        updated_at: new Date().toISOString(),
      };
      if (recurringEnabled && recurringAmount > 0) {
        updateData.recurring_frequency = frequency;
        updateData.recurring_day_of_month = dayInt;
        updateData.recurring_amount = recurringAmount;
      } else {
        updateData.recurring_frequency = null;
        updateData.recurring_day_of_month = null;
        updateData.recurring_amount = null;
      }
      const { error: saveError } = await upsertOnboardingData(userId, updateData);
      if (saveError) { setError(saveError.message || 'Failed to save'); return; }
      navigate('/onboarding/step-2');
    } catch (err) { console.error('Error:', err); }
    finally { setIsLoading(false); }
  };

  const handleSkip = () => navigate('/onboarding/step-2');
  const handleBack = () => navigate('/onboarding/financial-link');

  return {
    units, frequency, investmentDay, selectedAmount, customAmount, customAmountError,
    error, isLoading, isFooterVisible, totalInvestment, hasSelection,
    recurringEnabled, toggleRecurring,
    handleUnitChange, handleAmountClick, handleCustomAmountChange,
    setFrequency, setInvestmentDay, handleNext, handleSkip, handleBack,
  };
};
