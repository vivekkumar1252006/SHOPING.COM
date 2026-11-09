import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, ArrowLeft, RotateCw } from 'lucide-react';
import { authApi } from '../services/api';
import logoImg from '../assets/logo.jpg';
import AuthSplitLayout from '../components/auth/AuthSplitLayout';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid registered email address');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not send reset code. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout maxFormWidth="max-w-[430px]">
      {/* Clean White Card with Subtle Golden Border and Soft Shadow */}
      <div className="w-full bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(244,197,66,0.12),0_10px_25px_rgba(0,0,0,0.03)] border border-[#E9DFC9] relative text-[#252525] transition-all space-y-5">
        
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
              <img
                src={logoImg}
                alt="shoping.com"
                className="h-10 sm:h-11 w-auto object-contain select-none"
              />
            </Link>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252525] tracking-tight">
            Forgot Password?
          </h2>
          <p className="text-xs sm:text-sm text-[#777777] font-medium">
            Enter your registered email to receive an instant 6-digit password reset OTP.
          </p>
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#252525] mb-1.5 text-xs">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D69B24]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Primary Action Button: Rich Golden Yellow (#F5C542) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#F5C542] hover:bg-[#E5B532] text-[#252525] font-black text-sm shadow-md shadow-[#F5C542]/30 hover:shadow-lg hover:shadow-[#F5C542]/40 flex items-center justify-center space-x-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Sending Reset OTP...</span>
              </>
            ) : (
              <>
                <span>Send Reset Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </AuthSplitLayout>
  );
};

export default ForgotPasswordPage;
