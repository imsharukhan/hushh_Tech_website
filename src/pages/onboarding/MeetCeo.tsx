import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import config from '../../resources/config/config';
import { useFooterVisibility } from '../../utils/useFooterVisibility';
import HushhTechBackHeader from '../../components/hushh-tech-back-header/HushhTechBackHeader';
import HushhTechCta, { HushhTechCtaVariant } from '../../components/hushh-tech-cta/HushhTechCta';

// Types
interface TimeSlot { startTime: string; endTime: string; available: boolean; }
interface DayAvailability { date: string; slots: TimeSlot[]; }
interface CalendarData { ceo: { name: string; email: string }; timezone: string; meetingDuration: number; availability: DayAvailability[]; }
type PaymentState = 'loading' | 'not_paid' | 'verifying' | 'paid' | 'booked';
const VALID_COUPON = 'ILOVEHUSHH';

function MeetCeoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  useEffect(() => { checkPaymentStatus(); }, []);

  // Handle Stripe callback
  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    if (payment === 'success' && sessionId) verifyPayment(sessionId);
    else if (payment === 'cancel') { setError('Payment cancelled. Try again.'); setPaymentState('not_paid'); }
  }, [searchParams]);

  // Fetch calendar when paid
  useEffect(() => { if (paymentState === 'paid') fetchCalendarSlots(); }, [paymentState]);

  /* ── Send Hushh Coins credit email (fire-and-forget) ── */
  const sendCoinsEmail = async (email: string, name: string, coins: number) => {
    try {
      const { data: { session } } = await config.supabaseClient!.auth.getSession();
      if (!session) return;
      await fetch(`${config.SUPABASE_URL}/functions/v1/coins-credit-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ recipientEmail: email, recipientName: name, coinsAwarded: coins }),
      });
    } catch (err) { console.error('Coins email failed (non-blocking):', err); }
  };

  /* ── Send Hushh Coins deduction email when meeting is booked (fire-and-forget) ── */
  const sendCoinsDeductionEmail = async (email: string, name: string, coins: number, meetingDate: string, meetingTime: string) => {
    try {
      const { data: { session } } = await config.supabaseClient!.auth.getSession();
      if (!session) return;
      await fetch(`${config.SUPABASE_URL}/functions/v1/coins-deduction-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ recipientEmail: email, recipientName: name, coinsDeducted: coins, meetingDate, meetingTime }),
      });
    } catch (err) { console.error('Deduction email failed (non-blocking):', err); }
  };

  /* ── API Handlers ── */

  const checkPaymentStatus = async () => {
    if (!config.supabaseClient) { setPaymentState('not_paid'); return; }
    try {
      const { data: { user } } = await config.supabaseClient.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data: payment } = await config.supabaseClient
        .from('ceo_meeting_payments').select('*').eq('user_id', user.id).maybeSingle();
      if (payment?.payment_status === 'completed') {
        setHushhCoins(payment.hushh_coins_awarded || 300000);
        setPaymentState(payment.calendly_booked ? 'booked' : 'paid');
      } else { setPaymentState('not_paid'); }
    } catch { setPaymentState('not_paid'); }
  };

  const verifyPayment = async (sessionId: string) => {
    setPaymentState('verifying'); setError(null);
    try {
      const { data: { session } } = await config.supabaseClient!.auth.getSession();
      if (!session) throw new Error('Not authenticated');
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
        const { data: { user } } = await config.supabaseClient!.auth.getUser();
        if (user) sendCoinsEmail(user.email || '', user.user_metadata?.full_name || 'Hushh User', coins);
      } else throw new Error(result.error || 'Verification failed');
    } catch (err: any) { setError(err.message); setPaymentState('not_paid'); }
  };

  const handlePayment = async () => {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await config.supabaseClient!.auth.getSession();
      if (!session) throw new Error('Not authenticated');
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
      const { data: { user } } = await config.supabaseClient!.auth.getUser();
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

  const fetchCalendarSlots = async () => {
    setLoadingSlots(true);
    try {
      const { data: { session } } = await config.supabaseClient!.auth.getSession();
      if (!session) { setLoadingSlots(false); return; }
      const res = await fetch(`${config.SUPABASE_URL}/functions/v1/ceo-calendar-booking?days=14`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) { setCalendarData(data); if (data.availability?.length) setSelectedDate(data.availability[0].date); }
    } catch (err) { console.error('Calendar fetch error:', err); }
    finally { setLoadingSlots(false); }
  };

  const handleBookMeeting = async () => {
    if (!selectedSlot) return;
    setBookingInProgress(true); setError(null);
    try {
      const { data: { session } } = await config.supabaseClient!.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const { data: { user } } = await config.supabaseClient!.auth.getUser();
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

  const handleContinue = () => navigate('/hushh-user-profile');
  const handleBack = () => navigate('/onboarding/verify');

  /* ── Shimmer Loader ── */
  if (paymentState === 'loading' || paymentState === 'verifying') {
    return (
      <div className="bg-white min-h-screen flex flex-col antialiased selection:bg-black selection:text-white">
        <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-6 rounded-full border-4 border-gray-200 border-t-black animate-spin" />
            <p className="text-sm text-gray-500 font-medium lowercase">{paymentState === 'verifying' ? 'verifying payment...' : 'loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── RENDER ── */
  return (
    <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-black selection:text-white">
      <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />

      <main className="px-6 flex-grow max-w-md mx-auto w-full pb-48">
        {/* ── Title Section ── */}
        <section className="py-8">
          <h3 className="text-[11px] tracking-wide text-gray-500 lowercase mb-4 font-semibold">verification</h3>
          <h1 className="text-[2.75rem] leading-[1.1] font-normal text-black tracking-tight lowercase" style={{ fontFamily: "'Playfair Display', serif" }}>
            meet your
            <br />
            <span className="text-gray-400 italic font-normal">fund manager</span>
          </h1>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 py-4 px-1 border-b border-red-100">
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-red-500 text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>error</span>
            </div>
            <p className="text-sm font-medium text-red-700 lowercase">{error}</p>
          </div>
        )}

        {/* ═══ NOT PAID STATE ═══ */}
        {paymentState === 'not_paid' && (
          <>
            {/* Manager intro */}
            <div className="py-5 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 block">Manish Sainani</span>
                  <span className="text-xs text-gray-500 font-medium lowercase">hedge fund manager · 1-hour private session</span>
                </div>
              </div>
            </div>

            {/* Story card */}
            <div className="my-6 bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed mb-3 lowercase">
                a personal consultation with manish typically costs <span className="font-bold text-gray-900">$3,000</span> per session.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3 lowercase">
                because you've completed the full hushh kyc onboarding, you've unlocked this as an <span className="font-semibold text-gray-900">exclusive benefit</span> — available for just <span className="font-bold text-black">$1</span>.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed lowercase">
                your opportunity to sit 1-on-1 with a fund manager for investment strategies, portfolio allocation, and personalized guidance.
              </p>
            </div>

            {/* What you unlock — list style */}
            <section className="space-y-0 mb-6">
              <div className="py-4">
                <h3 className="text-[11px] tracking-wide text-gray-500 lowercase font-semibold">what you unlock</h3>
              </div>

              <div className="py-5 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 lowercase block">1-hour private consultation</span>
                    <span className="text-xs text-gray-500 font-medium lowercase">with manish sainani</span>
                  </div>
                  <span className="text-xs font-medium text-gray-400 line-through">$3,000</span>
                </div>
              </div>

              <div className="py-5 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-gray-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 lowercase block">300,000 hushh coins</span>
                    <span className="text-xs text-gray-500 font-medium lowercase">credited instantly</span>
                  </div>
                </div>
              </div>

              <div className="py-5 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-gray-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 lowercase block">kyc verified badge</span>
                    <span className="text-xs text-gray-500 font-medium lowercase">identity verification complete</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Price card */}
            <section className="mb-6">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="text-[11px] tracking-wide text-gray-500 lowercase font-semibold">your price today</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>$1</span>
                    <span className="text-sm text-gray-400 line-through">$3,000</span>
                  </div>
                  <span className="text-[10px] text-gray-500 lowercase font-medium mt-1">exclusive kyc onboarding benefit</span>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="pb-6 space-y-3">
              <HushhTechCta variant={HushhTechCtaVariant.BLACK} onClick={handlePayment} disabled={loading}>
                {loading ? 'Redirecting...' : 'Verify & Unlock — $1'}
              </HushhTechCta>
            </section>

            {/* Coupon Section */}
            <div className="mb-6">
              <button onClick={() => setShowCoupon(!showCoupon)} className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-700 font-semibold lowercase active:opacity-60">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 400" }}>confirmation_number</span>
                {showCoupon ? 'hide coupon code' : 'have a coupon code?'}
              </button>

              {showCoupon && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                      placeholder="enter coupon code"
                      className="flex-1 h-12 px-4 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-black focus:ring-1 focus:ring-black font-mono tracking-widest uppercase"
                      autoCapitalize="characters" autoComplete="off"
                    />
                    <button onClick={handleCouponRedeem} disabled={couponLoading || !couponCode.trim()}
                      className="h-12 px-5 rounded-xl bg-black text-white text-sm font-semibold disabled:bg-gray-300 active:scale-[0.97] transition-all">
                      {couponLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'APPLY'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 text-center font-medium lowercase">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Security badge */}
            <section className="flex flex-col items-center text-center gap-1 pb-8">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-gray-600">lock</span>
                <span className="text-[10px] text-gray-600 tracking-wide uppercase font-medium">secure payment</span>
              </div>
              <p className="text-[10px] text-gray-400 lowercase font-medium">powered by stripe</p>
            </section>
          </>
        )}

        {/* ═══ PAID STATE — Calendar Booking ═══ */}
        {paymentState === 'paid' && (
          <>
            <div className="py-5 border-b border-gray-200 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-green-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>check_circle</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 block lowercase">you're verified!</span>
                  <span className="text-xs text-gray-500 font-medium lowercase"><span className="font-bold text-gray-900">{hushhCoins.toLocaleString()} hushh coins</span> credited</span>
                </div>
              </div>
            </div>

            <div className="mb-6 bg-gray-50 rounded-2xl p-5 border border-gray-200 text-center">
              <span className="text-sm font-semibold text-gray-900 lowercase block mb-1">schedule your consultation</span>
              <span className="text-xs text-gray-500 font-medium lowercase">book a 1-hour session with {calendarData?.ceo.name || 'manish sainani'}</span>
              {calendarData?.timezone && <p className="text-[10px] text-gray-400 mt-1 lowercase">{calendarData.timezone}</p>}
            </div>

            {loadingSlots && (
              <div className="flex flex-col items-center py-12">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-3" />
                <p className="text-xs text-gray-500 lowercase">loading times...</p>
              </div>
            )}

            {!loadingSlots && calendarData && (
              <div className="space-y-4 mb-8">
                {/* Date pills */}
                <div className="overflow-x-auto pb-2 -mx-2 px-2">
                  <div className="flex gap-2">
                    {calendarData.availability.map((day) => {
                      const d = new Date(day.date);
                      const sel = selectedDate === day.date;
                      const has = day.slots.some(s => s.available);
                      return (
                        <button key={day.date} onClick={() => { setSelectedDate(day.date); setSelectedSlot(null); }} disabled={!has}
                          className={`shrink-0 flex flex-col items-center p-2.5 rounded-xl min-w-[62px] border-2 transition-all ${sel ? 'border-black bg-gray-50' : has ? 'border-gray-200 active:bg-gray-50' : 'border-transparent opacity-40'}`}>
                          <span className="text-[10px] font-medium text-gray-500 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className={`text-[18px] font-bold ${sel ? 'text-black' : 'text-gray-900'}`}>{d.getDate()}</span>
                          <span className="text-[10px] text-gray-500">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div className="rounded-xl border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-900 mb-2 lowercase">available times</p>
                    <div className="grid grid-cols-3 gap-2">
                      {calendarData.availability.find(d => d.date === selectedDate)?.slots.filter(s => s.available).map(slot => {
                        const t = new Date(slot.startTime);
                        const sel = selectedSlot?.startTime === slot.startTime;
                        return (
                          <button key={slot.startTime} onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all lowercase ${sel ? 'bg-black text-white' : 'bg-gray-50 text-gray-900 active:bg-gray-200'}`}>
                            {t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </button>
                        );
                      })}
                    </div>
                    {calendarData.availability.find(d => d.date === selectedDate)?.slots.filter(s => s.available).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4 lowercase">no slots available</p>
                    )}
                  </div>
                )}

                {/* Selected summary */}
                {selectedSlot && (
                  <div className="py-4 px-1 border-b border-gray-200 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 lowercase">{new Date(selectedSlot.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                      <p className="text-xs text-gray-500 lowercase">{new Date(selectedSlot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} – {new Date(selectedSlot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                    </div>
                  </div>
                )}

                <section className="space-y-3 pt-4">
                  <HushhTechCta variant={HushhTechCtaVariant.BLACK} onClick={handleBookMeeting} disabled={!selectedSlot || bookingInProgress}>
                    {bookingInProgress ? 'Booking...' : selectedSlot ? 'Confirm Booking' : 'Select a Time'}
                  </HushhTechCta>
                  <HushhTechCta variant={HushhTechCtaVariant.WHITE} onClick={handleContinue}>
                    I'll Book Later
                  </HushhTechCta>
                </section>
              </div>
            )}
          </>
        )}

        {/* ═══ BOOKED STATE ═══ */}
        {paymentState === 'booked' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-[44px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>task_alt</span>
            </div>
            <h1 className="text-3xl font-normal text-black tracking-tight mb-2 lowercase" style={{ fontFamily: "'Playfair Display', serif" }}>all set!</h1>
            <p className="text-sm text-gray-500 mb-1 lowercase">your consultation is scheduled with</p>
            <p className="text-base font-semibold text-black">Manish Sainani</p>
            <p className="text-xs text-gray-500 mt-1 lowercase">{hushhCoins.toLocaleString()} hushh coins earned 🪙</p>

            <section className="w-full space-y-3 mt-8">
              <HushhTechCta variant={HushhTechCtaVariant.BLACK} onClick={handleContinue}>
                Continue to Profile
              </HushhTechCta>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default MeetCeoPage;
