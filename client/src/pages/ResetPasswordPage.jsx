import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, RotateCw, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import OTPInput from '../components/auth/OTPInput';
import { authApi } from '../services/api';
import logoImg from '../assets/logo.jpg';
import AuthSplitLayout from '../components/auth/AuthSplitLayout';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = searchParams.get('email') || '';
  const otpParam = searchParams.get('otp') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(otpParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 5 Minutes (300s) Expiry & 60s Resend Cooldown
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

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email) {
      setErrorMsg('Please provide your registered email address');
      return;
    }

    if (otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });

      setSuccessMsg(res.data.message || 'Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Password reset failed. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldownSeconds > 0 || resending) return;

    setResending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await authApi.resendOTP({
        email: email.trim().toLowerCase(),
        purpose: 'password_reset',
      });

      setSuccessMsg(res.data.message || 'New reset code sent to your email.');
      setCooldownSeconds(60);
      setExpirySeconds(300);
      setOtp('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthSplitLayout maxFormWidth="max-w-[430px]">
      {/* Clean White Card with Subtle Golden Border and Soft Shadow */}
      <div className="w-full bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(244,197,66,0.12),0_10px_25px_rgba(0,0,0,0.03)] border border-[#E9DFC9] relative text-[#252525] transition-all space-y-4">
        
        <Link
          to="/login"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#D69B24] hover:text-[#B88218] hover:underline transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>

        {/* Card Header with Shoping.com Logo */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center p-2.5 px-4 bg-white rounded-2xl shadow-sm border border-[#E9DFC9] transition-transform hover:scale-105"
            >
              <img src={logoImg} alt="shoping.com" className="h-10 sm:h-11 w-auto object-contain select-none" />
            </Link>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252525] tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm text-[#777777] font-medium">
            Enter your OTP code and set your new account password
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#252525] mb-1.5 text-xs">
              Registered Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D69B24]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#252525] text-xs">
                6-Digit Security Code
              </label>
              {cooldownSeconds > 0 ? (
                <span className="text-[11px] text-[#777777] font-medium">Resend in {cooldownSeconds}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resending}
                  className="text-[#D69B24] hover:underline text-[11px] font-bold cursor-pointer"
                >
                  Resend OTP
                </button>
              )}
            </div>
            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={(code) => setOtp(code)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-semibold text-[#252525] mb-1.5 text-xs">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D69B24]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#252525] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#252525] mb-1.5 text-xs">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D69B24]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Primary Action Button: Rich Golden Yellow (#F5C542) */}
          <button
            type="submit"
            disabled={loading || otp.length !== 6 || newPassword.length < 6}
            className="w-full py-3.5 rounded-xl bg-[#F5C542] hover:bg-[#E5B532] text-[#252525] font-black text-sm shadow-md shadow-[#F5C542]/30 hover:shadow-lg hover:shadow-[#F5C542]/40 flex items-center justify-center space-x-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </AuthSplitLayout>
  );
};

export default ResetPasswordPage;
