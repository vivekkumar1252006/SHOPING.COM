import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, ArrowRight, RotateCw, AlertCircle, CheckCircle2, Clock, ShieldCheck, Edit3, MessageSquare } from 'lucide-react';
import OTPInput from '../components/auth/OTPInput';
import { setCredentials } from '../redux/slices/authSlice';
import { authApi } from '../services/api';
import logoImg from '../assets/logo.jpg';
import AuthSplitLayout from '../components/auth/AuthSplitLayout';

const VerifyOTPPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const emailParam = searchParams.get('email') || '';
  const purposeParam = searchParams.get('purpose') || 'verification';

  const [email] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 5 Minutes (300s) Total Expiry Countdown & 60s Resend Cooldown
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  useEffect(() => {
    if (expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expirySeconds]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code');
      return;
    }

    if (expirySeconds <= 0) {
      setErrorMsg('This code has expired. Please click "Resend Code" to get a fresh code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await authApi.verifyOTP({
        email,
        otp,
        purpose: purposeParam,
      });

      setSuccessMsg(res.data.message || 'Email verified successfully!');

      if (purposeParam === 'verification' && res.data.token && res.data.user) {
        dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
        setTimeout(() => {
          if (res.data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1200);
      } else if (purposeParam === 'password_reset') {
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
        }, 1000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed. Please check the code in your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || resending) return;

    setResending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await authApi.resendOTP({
        email,
        purpose: purposeParam,
      });

      setSuccessMsg(res.data.message || 'We have sent a fresh 6-digit verification code to your email.');
      setCooldownSeconds(60);
      setExpirySeconds(300);
      setOtp('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthSplitLayout maxFormWidth="max-w-[450px]">
      {/* Clean White Card with Subtle Golden Border and Soft Shadow */}
      <div className="w-full bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(244,197,66,0.12),0_10px_25px_rgba(0,0,0,0.03)] border border-[#E9DFC9] relative text-[#252525] transition-all space-y-5">
        
        {/* Card Header with Shoping.com Logo */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center p-2.5 px-4 bg-white rounded-2xl shadow-sm border border-[#E9DFC9] transition-transform hover:scale-105"
            >
              <img
                src={logoImg}
                alt="shoping.com"
                className="h-10 sm:h-11 w-auto object-contain select-none"
              />
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#252525] tracking-tight">
            Security Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#777777] font-medium max-w-sm mx-auto">
            We have dispatched a 6-digit security code to your email &amp; WhatsApp:
          </p>
          
          {/* Email Indicator Pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF8E8] border border-[#E9DFC9] text-[#252525] font-semibold text-xs shadow-sm">
              <Mail className="w-3.5 h-3.5 text-[#D69B24]" />
              <span className="truncate max-w-[180px] sm:max-w-xs">{email || 'your-email@example.com'}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-1 text-xs text-[#D69B24] hover:text-[#B88218] font-bold px-2 py-1 rounded-lg hover:bg-[#FFF8E8] transition-colors cursor-pointer"
              title="Change email"
            >
              <Edit3 className="w-3 h-3" />
              <span>Change</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* 6 OTP Input Boxes */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-center text-xs font-semibold text-[#252525]">
              Enter 6-Digit One-Time Password
            </label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={(completedCode) => {
                setOtp(completedCode);
              }}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Timers Row */}
          <div className="flex items-center justify-between text-xs text-[#777777] px-1 pt-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#D69B24]" />
              <span>
                Expires in:{' '}
                <strong className={expirySeconds <= 60 ? 'text-red-500 font-bold' : 'text-[#252525]'}>
                  {formatTime(expirySeconds)}
                </strong>
              </span>
            </div>

            <div>
              {cooldownSeconds > 0 ? (
                <span className="text-[11px] font-medium text-[#777777]">
                  Resend in <strong className="text-[#252525]">{cooldownSeconds}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#D69B24] hover:text-[#B88218] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </div>

          {/* Primary Action Button: Rich Golden Yellow (#F5C542) */}
          <button
            type="submit"
            disabled={loading || otp.length !== 6 || expirySeconds <= 0}
            className="w-full py-3.5 rounded-xl bg-[#F5C542] hover:bg-[#E5B532] text-[#252525] font-black text-sm shadow-md shadow-[#F5C542]/30 hover:shadow-lg hover:shadow-[#F5C542]/40 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-[#252525]" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Verify OTP &amp; Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="p-3.5 rounded-2xl bg-[#FFF8E8] border border-[#E9DFC9] text-[11px] text-[#777777] space-y-1">
          <div className="flex items-center gap-1.5 text-[#252525] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D69B24]" />
            <span>Security Notice</span>
          </div>
          <p>
            Never share your 6-digit OTP with anyone. Shoping.com will never ask for your verification code.
          </p>
        </div>

        <div className="text-center text-xs text-[#777777] pt-2">
          Already verified?{' '}
          <Link to="/login" className="text-[#D69B24] font-bold hover:underline hover:text-[#B88218]">
            Sign in
          </Link>
        </div>

      </div>
    </AuthSplitLayout>
  );
};

export default VerifyOTPPage;
