import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authBg from '../assets/auth-bg.png';
import { TraceFlowLogoBadge } from '../components/TraceFlowLogo';
import { SocialAuthModal } from '../components/SocialAuthModal';
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState(null);
  const [socialLoading, setSocialLoading] = useState(false);

  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mobileNo && !/^[0-9]{10}$/.test(mobileNo.trim())) {
      setError('Mobile number must be exactly 10 digits (e.g. 9876543210).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName,
        username,
        email,
        mobileNo: mobileNo.trim() || undefined,
        password,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSocial = (provider) => {
    setError('');
    setSocialProvider(provider);
    setSocialModalOpen(true);
  };

  const handleAuthenticateSocial = async (socialData) => {
    setSocialLoading(true);
    setError('');
    try {
      await socialLogin(socialData);
      setSocialModalOpen(false);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || `${socialData.provider} authentication failed`);
      setSocialModalOpen(false);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div
      className="auth-wrapper"
      style={{ backgroundImage: `url(${authBg})` }}
    >
      <div className="auth-card">
        {/* Brand & Header */}
        <div className="auth-header">
          <div className="auth-brand">
            <TraceFlowLogoBadge size="md" idPrefix="reg-logo" />

            <div className="flex flex-col">
              <span className="auth-brand-text">
                Trace<span className="text-[#3b82f6]">Flow</span>
              </span>
              <span className="auth-brand-sub">
                Java Execution &amp; Bug Engine
              </span>
            </div>
          </div>

          <h1 className="auth-title">
            Create Account
          </h1>
          <p className="auth-subtitle">
            Sign up to get started with <span className="text-[#2563eb] font-semibold">TraceFlow</span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center justify-center gap-2 text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Row 1: Full Name & Username */}
          <div className="auth-field-grid">
            <div className="auth-field">
              <label className="auth-label" htmlFor="fullName">
                Full Name
              </label>
              <div className="auth-input-box">
                <User className="w-4 h-4 text-[#94a3b8] shrink-0 mr-2.5 pointer-events-none" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="username">
                Username
              </label>
              <div className="auth-input-box">
                <User className="w-4 h-4 text-[#94a3b8] shrink-0 mr-2.5 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email Address */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email Address
            </label>
            <div className="auth-input-box">
              <Mail className="w-4 h-4 text-[#94a3b8] shrink-0 mr-2.5 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {/* Row 3: Mobile Number */}
          <div className="auth-field">
            <div className="flex items-center justify-between">
              <label className="auth-label" htmlFor="mobileNo">
                Mobile Number
              </label>
              <span className="text-[11.5px] text-slate-400 font-medium">
                10 digits
              </span>
            </div>
            <div className="auth-input-box">
              <Phone className="w-4 h-4 text-[#94a3b8] shrink-0 mr-2.5 pointer-events-none" />
              <input
                id="mobileNo"
                type="tel"
                maxLength={10}
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your mobile number"
              />
            </div>
          </div>

          {/* Row 4: Password & Confirm Password */}
          <div className="auth-field-grid">
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <div className="auth-input-box">
                <Lock className="w-4 h-4 text-[#94a3b8] shrink-0 mr-2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#94a3b8] hover:text-[#475569] ml-1 p-1 transition cursor-pointer flex items-center justify-center"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="auth-input-box">
                <Lock className="w-4 h-4 text-[#94a3b8] shrink-0 mr-2 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[#94a3b8] hover:text-[#475569] ml-1 p-1 transition cursor-pointer flex items-center justify-center"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Row 5: Agree Terms Checkbox */}
          <div className="auth-options">
            <label
              onClick={() => setAgreeTerms(!agreeTerms)}
              className="auth-checkbox-label"
            >
              <div className={`auth-checkbox-box ${agreeTerms ? 'checked' : ''}`}>
                {agreeTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-xs text-slate-600">
                I agree to the Terms &amp; Privacy Policy
              </span>
            </label>
          </div>

          {/* Row 6: Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or continue with</span>
          <div className="auth-divider-line" />
        </div>

        {/* Social Buttons */}
        <div className="auth-social-grid">
          <button
            type="button"
            onClick={() => handleOpenSocial('github')}
            className="auth-social-btn"
          >
            <svg className="w-4 h-4 fill-[#1e293b]" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSocial('google')}
            className="auth-social-btn"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Login</Link>
        </div>
      </div>

      {/* Social Auth Popup Modal */}
      <SocialAuthModal
        isOpen={socialModalOpen}
        provider={socialProvider}
        loading={socialLoading}
        onClose={() => setSocialModalOpen(false)}
        onAuthenticate={handleAuthenticateSocial}
      />
    </div>
  );
};

export default Register;
