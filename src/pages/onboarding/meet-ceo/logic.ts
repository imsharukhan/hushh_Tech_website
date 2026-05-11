import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import config from '../../../resources/config/config';
import { useFooterVisibility } from '../../../utils/useFooterVisibility';
import { useAuthSession } from '../../../auth/AuthSessionProvider';
import { buildLoginRedirectPath } from '../../../auth/routePolicy';

// Types
export interface TimeSlot { startTime: string; endTime: string; available: boolean; }
export interface DayAvailability { date: string; slots: TimeSlot[]; }
export interface CalendarData { ceo: { name: string; email: string }; timezone: string; meetingDuration: number; availability: DayAvailability[]; }
export type PaymentState = 'loading' | 'not_paid' | 'verifying' | 'paid' | 'booked';
export const VALID_COUPON = 'ILOVEHUSHH';

export function useMeetCeoLogic() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, status, user } = useAuthSession();
  const [paymentState, setPaymentState] = useState<PaymentState>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hushhCoins, setHushhCoins] = useState(0);
  const isFooterVisible = useFooterVisibility();

  // Coupon state
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Calendar state
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  /* ── Send Hushh Coins credit email (fire-and-forget) ── */
  const sendCoinsEmail = useCallback(async (email: string, name: string, coins: number) => {
    try {
      if (!session?.access_token) return;
      await fetch(`${config.SUPABASE_URL}/functions/v1/coins-credit-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ recipientEmail: email, recipientName: name, coinsAwarded: coins }),
      });
    } catch (err) { console.error('Coins email failed (non-blocking):', err); }
  }, [session?.access_token]);

  /* ── Send Hushh Coins deduction email when meeting is booked (fire-and-forget) ── */
  const sendCoinsDeductionEmail = useCallback(async (email: string, name: string, coins: number, meetingDate: string, meetingTime: string) => {
    try {
      if (!session?.access_token) return;
      await fetch(`${config.SUPABASE_URL}/functions/v1/coins-deduction-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ recipientEmail: email, recipientName: name, coinsDeducted: coins, meetingDate, meetingTime }),
      });
    } catch (err) { console.error('Deduction email failed (non-blocking):', err); }
  }, [session?.access_token]);

  /* ── API Handlers ── */

  const checkPaymentStatus = useCallback(async () => {
    if (!config.supabaseClient) { setPaymentState('not_paid'); return; }
    if (status === 'booting') return;
    try {
      if (status !== 'authenticated' || !user) {
        navigate(buildLoginRedirectPath('/onboarding/meet-ceo'), { replace: true });
        return;
      }
      const { data: payment } = await config.supabaseClient
        .from('ceo_meeting_payments').select('*').eq('user_id', user.id).maybeSingle();
      if (payment?.payment_status === 'completed') {
        setHushhCoins(payment.hushh_coins_awarded || 300000);
        setPaymentState(payment.calendly_booked ? 'booked' : 'paid');
      } else { setPaymentState('not_paid'); }
    } catch { setPaymentState('not_paid'); }
  }, [navigate, status, user]);

  const verifyPayment = useCallback(async (sessionId: string) => {
    setPaymentState('verifying'); setError(null);
    try {
      if (!session?.access_token || !user) throw new Error('Not authenticated');
      const res = await fetch(`${config.SUPABASE_URL}/functions/v1/onboarding-verify-payment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ sessionId }),
      });
      const result = await res.json();
      if (result.success) {
        const coins = result.hushhCoinsAwarded || 300000;
        setHushhCoins(coins);
        setPaymentState('paid');
        window.history.replaceState({}, '', '/onboarding/meet-ceo');
        // Send coins credit email after Stripe payment
        sendCoinsEmail(user.email || '', user.user_metadata?.full_name || 'Hushh User', coins);
      } else throw new Error(result.error || 'Verification failed');
    } catch (err: any) { setError(err.message); setPaymentState('not_paid'); }
  }, [sendCoinsEmail, session?.access_token, user]);

  const handlePayment = async () => {
    setLoading(true); setError(null);
    try {
      if (!session?.access_token) throw new Error('Not authenticated');
      const res = await fetch(`${config.SUPABASE_URL}/functions/v1/onboarding-create-checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.alreadyPaid) { setPaymentState('paid'); return; }
      if (result.checkoutUrl) window.location.href = result.checkoutUrl;
      else throw new Error(result.error || 'Checkout failed');
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const handleCouponRedeem = async () => {
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    if (!code) { setCouponError('Please enter a coupon code.'); return; }
    if (code !== VALID_COUPON) { setCouponError('Invalid coupon code. Please try again.'); return; }
    setCouponLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');
      // Upsert payment record with coupon
      const { error: upsertError } = await config.supabaseClient!.from('ceo_meeting_payments').upsert({
        user_id: user.id, payment_status: 'completed', payment_method: 'coupon',
        coupon_code: code, hushh_coins_awarded: 300000, amount_cents: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (upsertError) throw upsertError;
      setHushhCoins(300000);
      setPaymentState('paid');
      // Send coins credit email notification
      sendCoinsEmail(user.email || '', user.user_metadata?.full_name || 'Hushh User', 300000);
    } catch (err: any) { setCouponError(err.message || 'Failed to redeem coupon'); }
    finally { setCouponLoading(false); }
  };

  const fetchCalendarSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      if (!session?.access_token) { setLoadingSlots(false); return; }
      const res = await fetch(`${config.SUPABASE_URL}/functions/v1/ceo-calendar-booking?days=14`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) { setCalendarData(data); if (data.availability?.length) setSelectedDate(data.availability[0].date); }
    } catch (err) { console.error('Calendar fetch error:', err); }
    finally { setLoadingSlots(false); }
  }, [session?.access_token]);

  const handleBookMeeting = async () => {
    if (!selectedSlot) return;
    setBookingInProgress(true); setError(null);
    try {
      if (!session?.access_token || !user) throw new Error('Not authenticated');
      const res = await fetch(`${config.SUPABASE_URL}/functions/v1/ceo-calendar-booking`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ startTime: selectedSlot.startTime, endTime: selectedSlot.endTime, attendeeName: user?.user_metadata?.full_name || 'Hushh User' }),
      });
      const result = await res.json();
      if (result.success) {
        setPaymentState('booked');
        // Send coins deduction email after successful booking
        const meetingDate = new Date(selectedSlot.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        const meetingTime = `${new Date(selectedSlot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} – ${new Date(selectedSlot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        sendCoinsDeductionEmail(user?.email || '', user?.user_metadata?.full_name || 'Hushh User', 300000, meetingDate, meetingTime);
      } else throw new Error(result.error || 'Booking failed');
    } catch (err: any) { setError(err.message); }
    finally { setBookingInProgress(false); }
  };

  useEffect(() => {
    void checkPaymentStatus();
  }, [checkPaymentStatus]);

  // Handle Stripe callback
  useEffect(() => {
    if (status === 'booting') {
      return;
    }

    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    if (payment === 'success' && sessionId && status === 'authenticated') {
      void verifyPayment(sessionId);
    } else if (payment === 'cancel') {
      setError('Payment cancelled. Try again.');
      setPaymentState('not_paid');
    }
  }, [searchParams, status, verifyPayment]);

  // Fetch calendar when paid
  useEffect(() => {
    if (paymentState === 'paid') {
      void fetchCalendarSlots();
    }
  }, [fetchCalendarSlots, paymentState]);

  const handleContinue = () => navigate('/hushh-user-profile');
  const handleBack = () => navigate('/onboarding/verify');

  return {
    paymentState,
    loading,
    error,
    hushhCoins,
    isFooterVisible,
    // Coupon
    showCoupon,
    setShowCoupon,
    couponCode,
    setCouponCode,
    couponError,
    setCouponError,
    couponLoading,
    // Calendar
    calendarData,
    loadingSlots,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    bookingInProgress,
    // Handlers
    handlePayment,
    handleCouponRedeem,
    handleBookMeeting,
    handleContinue,
    handleBack,
  };
}
