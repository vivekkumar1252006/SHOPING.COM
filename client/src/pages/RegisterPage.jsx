import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { User, Mail, Lock, ArrowRight, AlertCircle, Phone, Eye, EyeOff } from 'lucide-react';
import { setCredentials } from '../redux/slices/authSlice';
import { authApi } from '../services/api';
import logoImg from '../assets/logo.jpg';
import AuthSplitLayout from '../components/auth/AuthSplitLayout';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const registrationInProgress = useRef(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registrationInProgress.current) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    registrationInProgress.current = true;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.register({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password,
        confirmPassword,
      });
      const data = res.data;

      if (data.token && data.user) {
        dispatch(setCredentials({ user: data.user, token: data.token }));
        navigate('/');
      } else if (data.requiresVerification) {
        navigate(`/verify-otp?email=${encodeURIComponent(data.email || normalizedEmail)}&purpose=verification`);
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        navigate(`/verify-otp?email=${encodeURIComponent(err.response.data.email || normalizedEmail)}&purpose=verification`);
        return;
      }
      const backendMessage = err.response?.data?.message;
      const networkMessage = err.message ? `Connection error: ${err.message}` : null;
      setErrorMsg(backendMessage || networkMessage || 'Unable to create your account right now. Please try again.');
    } finally {
      registrationInProgress.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout maxFormWidth="max-w-[440px]">
      {/* Clean White Registration Card with Subtle Golden Border and Soft Shadow */}
      <div className="w-full bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(244,197,66,0.12),0_10px_25px_rgba(0,0,0,0.03)] border border-[#E9DFC9] relative text-[#252525] transition-all">
        
        {/* Card Header with Shoping.com Logo */}
        <div className="text-center space-y-1.5 mb-5">
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
            Create Account
          </h2>
          <p className="text-xs sm:text-sm text-[#777777] font-medium">
            Join Shoping.com for a luxury shopping experience
          </p>
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2.5 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
          {/* Full Name Input */}
          <div>
            <label className="block font-semibold text-[#252525] mb-1.5 text-xs">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D69B24]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rohan Sharma"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Email Address Input */}
          <div>
            <label className="block font-semibold text-[#252525] mb-1.5 text-xs">
              Email Address
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

          {/* WhatsApp / Phone Input */}
          <div>
            <label className="block font-semibold text-[#252525] mb-1.5 text-xs">
              Mobile Number (for Delivery OTP)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D69B24]" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Password & Confirm Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#252525] mb-1.5 text-xs">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D69B24]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 chars"
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#252525] mb-1.5 text-xs">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D69B24]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#252525] focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Button: Rich Golden Yellow (#F5C542) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#F5C542] hover:bg-[#E5B532] text-[#252525] font-black text-sm shadow-md shadow-[#F5C542]/30 hover:shadow-lg hover:shadow-[#F5C542]/40 flex items-center justify-center space-x-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 mt-3"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-[#777777] pt-5 mt-5 border-t border-[#E9DFC9]/60">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#D69B24] font-bold hover:underline hover:text-[#B88218] transition-colors"
          >
            Sign in
          </Link>
        </div>

      </div>
    </AuthSplitLayout>
  );
};

export default RegisterPage;
