import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SchoolRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthTabs from './AuthTabs';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

const departments = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Business Administration',
  'English',
  'Mathematics',
  'Physics',
  'Civil Engineering',
  'Architecture',
  'Other',
];

const batches = [57, 58, 59, 60, 61, 62, 63, 64, 65];
const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'A+B', 'C+G', 'D+H'];

const signInDefaults = {
  email: '',
  password: '',
  remember: true,
};

const signUpDefaults = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'student',
  department: 'Computer Science & Engineering',
  student_number: '',
  batch_number: '',
  batch_section: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordStrength = (password) => {
  if (!password) return null;
  if (password.length < 6) return 'weak';
  if (password.length < 10 || !/[A-Z]/.test(password) || !/\d/.test(password)) return 'fair';
  return 'strong';
};

export default function AuthPanel({ initialTab = 'sign-in' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTimeoutRef = useRef(null);
  const shakeTimeoutRef = useRef(null);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [signInValues, setSignInValues] = useState(signInDefaults);
  const [signUpValues, setSignUpValues] = useState(signUpDefaults);
  const [signInErrors, setSignInErrors] = useState({});
  const [signUpErrors, setSignUpErrors] = useState({});
  const [showPassword, setShowPassword] = useState({ signIn: false, signUp: false, confirm: false });
  const [status, setStatus] = useState(null);
  const [loadingMode, setLoadingMode] = useState(null);
  const [shakePanel, setShakePanel] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    setStatus(null);
  }, [initialTab]);

  useEffect(() => () => {
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
  }, []);

  const passwordStrength = useMemo(
    () => getPasswordStrength(signUpValues.password),
    [signUpValues.password]
  );

  const passwordsMatch =
    signUpValues.confirmPassword.length > 0 &&
    signUpValues.password === signUpValues.confirmPassword;

  const triggerShake = () => {
    setShakePanel(true);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = window.setTimeout(() => setShakePanel(false), 420);
  };

  const syncTabRoute = (nextTab) => {
    setActiveTab(nextTab);
    setStatus(null);
    navigate(nextTab === 'sign-up' ? '/register' : location.pathname === '/' ? '/' : '/login');
  };

  const setSignInField = (field) => (event) => {
    const value = field === 'remember' ? event.target.checked : event.target.value;
    setSignInValues((prev) => ({ ...prev, [field]: value }));
    setSignInErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setSignUpField = (field) => (event) => {
    const value = event.target.value;
    setSignUpValues((prev) => ({ ...prev, [field]: value }));
    setSignUpErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateSignIn = () => {
    const nextErrors = {};

    if (!signInValues.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailPattern.test(signInValues.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!signInValues.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setSignInErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateSignUp = () => {
    const nextErrors = {};

    if (!signUpValues.name.trim()) nextErrors.name = 'Full name is required.';
    if (!signUpValues.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailPattern.test(signUpValues.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!signUpValues.password) {
      nextErrors.password = 'Password is required.';
    } else if (signUpValues.password.length < 6) {
      nextErrors.password = 'Use at least 6 characters.';
    }

    if (!signUpValues.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (signUpValues.password !== signUpValues.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!signUpValues.department) {
      nextErrors.department = 'Please choose a department.';
    }

    if (signUpValues.role === 'student' && !signUpValues.student_number.trim()) {
      nextErrors.student_number = 'Student ID is required for student accounts.';
    }

    setSignUpErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const setSuccessRedirect = (message) => {
    setStatus({ type: 'success', message });
    redirectTimeoutRef.current = window.setTimeout(() => navigate('/dashboard'), 700);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!validateSignIn()) {
      triggerShake();
      return;
    }

    setLoadingMode('sign-in');
    try {
      await login(signInValues.email.trim(), signInValues.password, { remember: signInValues.remember });
      toast.success('Welcome back to CampusAssist.');
      setSuccessRedirect('Sign in successful. Redirecting to your workspace...');
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to sign in right now.' });
      triggerShake();
    } finally {
      setLoadingMode(null);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!validateSignUp()) {
      triggerShake();
      return;
    }

    setLoadingMode('sign-up');
    try {
      const { confirmPassword, ...payload } = signUpValues;
      if (!payload.batch_number) delete payload.batch_number;
      if (!payload.batch_section) delete payload.batch_section;
      if (!payload.student_number.trim()) delete payload.student_number;

      await register(payload, { remember: true });
      toast.success('Your CampusAssist account is ready.');
      setSuccessRedirect('Account created successfully. Taking you into CampusAssist...');
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to create your account.' });
      triggerShake();
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <motion.aside
      id="campusassist-auth"
      initial={{ opacity: 0, x: 24, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
      className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-[0_32px_72px_rgba(15,23,42,0.15)] backdrop-blur-xl md:max-w-lg md:p-7 ${
        shakePanel ? 'animate-shake-soft' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(226,232,240,0.40),transparent_32%)]" />

      <div className="relative">
        <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-campus-700 via-campus-600 to-sky-400 text-white shadow-[0_16px_32px_rgba(29,78,216,0.32)]">
              <SchoolRounded sx={{ fontSize: 26 }} />
            </div>
            <div>
              <p className="mb-0.5 font-display text-base font-bold text-slate-900">CampusAssist</p>
              <p className="m-0 text-xs text-slate-600">Connect. Learn. Manage.</p>
            </div>
          </div>
          <span className="rounded-full border border-campus-100 bg-gradient-to-r from-campus-50 to-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-campus-600 shadow-sm">
            Secure access
          </span>
        </div>

        <AuthTabs value={activeTab} onChange={syncTabRoute} />

        <div className="mb-5 mt-5">
          <h2 className="mb-2 font-display text-2xl font-bold tracking-tight text-slate-900">
            {activeTab === 'sign-in' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="m-0 text-sm leading-6 text-slate-600">
            {activeTab === 'sign-in'
              ? 'Sign in to access your academic workspace.'
              : 'Set up your account in just a few steps.'}
          </p>
        </div>

        {status ? (
          <div
            aria-live="polite"
            className={`mb-5 rounded-[20px] border px-4 py-3 text-sm font-medium ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {status.message}
          </div>
        ) : null}

        {activeTab === 'sign-in' ? (
          <SignInForm
            panelId="auth-panel-sign-in"
            values={signInValues}
            errors={signInErrors}
            loading={loadingMode === 'sign-in'}
            passwordVisible={showPassword.signIn}
            onFieldChange={setSignInField}
            onTogglePassword={() => setShowPassword((prev) => ({ ...prev, signIn: !prev.signIn }))}
            onForgotPassword={() => navigate('/forgot-password')}
            onSubmit={handleSignIn}
          />
        ) : (
          <SignUpForm
            panelId="auth-panel-sign-up"
            values={signUpValues}
            errors={signUpErrors}
            loading={loadingMode === 'sign-up'}
            passwordVisible={showPassword.signUp}
            confirmVisible={showPassword.confirm}
            passwordStrength={passwordStrength}
            passwordsMatch={passwordsMatch}
            departments={departments}
            batches={batches}
            sections={sections}
            onFieldChange={setSignUpField}
            onRoleChange={(role) => {
              setSignUpValues((prev) => ({ ...prev, role }));
              setSignUpErrors((prev) => ({ ...prev, student_number: undefined }));
            }}
            onTogglePassword={() => setShowPassword((prev) => ({ ...prev, signUp: !prev.signUp }))}
            onToggleConfirm={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
            onSubmit={handleSignUp}
          />
        )}

        <div className="mt-6 flex flex-col items-center justify-center gap-3 border-t border-slate-200 pt-5 text-xs text-slate-600 sm:text-sm">
          <span className="text-center text-slate-500">
            {activeTab === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => syncTabRoute(activeTab === 'sign-in' ? 'sign-up' : 'sign-in')}
              className="font-semibold text-campus-600 underline-offset-2 transition hover:text-campus-700 hover:underline"
            >
              {activeTab === 'sign-in' ? 'Sign up' : 'Sign in'}
            </button>
          </span>
          <span className="text-xs font-medium text-slate-500">Role-based access for all users</span>
        </div>
      </div>
    </motion.aside>
  );
}

