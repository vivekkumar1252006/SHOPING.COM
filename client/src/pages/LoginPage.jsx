import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { setCredentials } from '../redux/slices/authSlice';
import { authApi } from '../services/api';
import logoImg from '../assets/logo.jpg';
import AuthSplitLayout from '../components/auth/AuthSplitLayout';

const getLoginErrorMessage = (error) => {
  const { status, data } = error.response || {};
  if (data?.message) return data.message;

  if (!error.response) {
    return 'Cannot reach the sign-in service. Check that the backend is running and try again.';
  }

  switch (status) {
    case 400:
      return 'Please enter a valid email address and password.';
    case 401:
      return 'The email or password is incorrect. Please try again.';
    case 404:
      return 'The sign-in service could not be found. Please contact support.';
    case 500:
      return 'The sign-in service encountered an error. Please try again shortly.';
    case 503:
      return 'The sign-in service is temporarily unavailable. Please try again shortly.';
    default:
      return 'We could not sign you in. Please try again shortly.';
  }
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.login({ email: email.trim().toLowerCase(), password });
      const data = res.data;

      if (data.requiresVerification) {
        navigate(`/verify-otp?email=${encodeURIComponent(data.email || email)}&purpose=verification`);
        return;
      }

      const user = data.user || data.data?.user;
      const token = data.token || data.data?.token;

      if (user && token) {
        dispatch(setCredentials({ user, token }));
        if (redirectParam) {
          navigate(redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`);
        } else if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        const unverifiedEmail = err.response.data.email || email;
        navigate(`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}&purpose=verification`);
        return;
      }
      setErrorMsg(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout maxFormWidth="max-w-[430px]">
      {/* Clean White Login Card with Subtle Golden Border and Soft Shadow */}
      <div className="w-full bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(244,197,66,0.12),0_10px_25px_rgba(0,0,0,0.03)] border border-[#E9DFC9] relative text-[#252525] transition-all">
        
        {/* Card Header with Shoping.com Logo */}
        <div className="text-center space-y-1.5 mb-6">
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
            Sign In
          </h2>
          <p className="text-xs sm:text-sm text-[#777777] font-medium">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2.5 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          {/* Email Input */}
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
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#252525] text-xs">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[#D69B24] hover:text-[#B88218] hover:underline font-bold text-xs transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D69B24]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white text-[#252525] placeholder-[#A3A3A3] text-xs font-medium border border-[#E9DFC9] focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#252525] focus:outline-none cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#E9DFC9] text-[#F5C542] focus:ring-[#F4C542] cursor-pointer accent-[#F5C542]"
            />
            <label htmlFor="remember" className="text-xs text-[#777777] cursor-pointer select-none font-medium">
              Keep me signed in
            </label>
          </div>

          {/* Primary Action Button: Rich Golden Yellow (#F5C542) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#F5C542] hover:bg-[#E5B532] text-[#252525] font-black text-sm shadow-md shadow-[#F5C542]/30 hover:shadow-lg hover:shadow-[#F5C542]/40 flex items-center justify-center space-x-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-[#777777] pt-5 mt-5 border-t border-[#E9DFC9]/60">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-[#D69B24] font-bold hover:underline hover:text-[#B88218] transition-colors"
          >
            Create an account
          </Link>
        </div>

      </div>
    </AuthSplitLayout>
  );
};

export default LoginPage;
