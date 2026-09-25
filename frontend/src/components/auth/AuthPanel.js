import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SchoolRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthTabs from './AuthTabs';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

const DEPARTMENTS = [
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

const BATCHES = [57, 58, 59, 60, 61, 62, 63, 64, 65];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'A+B', 'C+G', 'D+H'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordStrength = (pw) => {
  if (!pw) return null;
  if (pw.length < 6) return 'weak';
  if (pw.length < 10 || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return 'fair';
  return 'strong';
};

const DEMO_ACCOUNTS = [
  { role: 'Student', emoji: '🎓', email: '231-115-001@student.edu', password: 'password123', color: '#3b82f6' },
  { role: 'Teacher', emoji: '📚', email: 'ss@campus.edu',           password: 'password123', color: '#8b5cf6' },
  { role: 'Admin',   emoji: '⚙️', email: 'admin@campus.edu',        password: 'password123', color: '#f59e0b' },
];

const SIGN_IN_DEFAULTS = { email: '', password: '', remember: true };
const SIGN_UP_DEFAULTS = {
  name: '', email: '', password: '', confirmPassword: '',
  role: 'student', department: DEPARTMENTS[0],
  student_number: '', batch_number: '', batch_section: '',
};

const PANEL_STYLE = {
  position: 'relative', width: '100%', maxWidth: 460, overflow: 'hidden', borderRadius: 28,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'linear-gradient(145deg, rgba(15,25,50,0.80) 0%, rgba(10,18,40,0.90) 100%)',
  backdropFilter: 'blur(24px)', padding: 28,
  boxShadow: '0 40px 80px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)',
};

export default function AuthPanel({ initialTab = 'sign-in' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTimer = useRef(null);
  const shakeTimer = useRef(null);

  const [tab, setTab] = useState(initialTab);
  const [signIn, setSignIn] = useState(SIGN_IN_DEFAULTS);
  const [signUp, setSignUp] = useState(SIGN_UP_DEFAULTS);
  const [signInErr, setSignInErr] = useState({});
  const [signUpErr, setSignUpErr] = useState({});
  const [showPw, setShowPw] = useState({ signIn: false, signUp: false, confirm: false });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(null);
  const [shake, setShake] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  useEffect(() => { setTab(initialTab); setStatus(null); }, [initialTab]);
  useEffect(() => () => {
    clearTimeout(redirectTimer.current);
    clearTimeout(shakeTimer.current);
  }, []);

  const pwStrength = useMemo(() => passwordStrength(signUp.password), [signUp.password]);
  const pwMatch = signUp.confirmPassword.length > 0 && signUp.password === signUp.confirmPassword;

  const triggerShake = () => {
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 420);
  };

  const goTab = (next) => {
    setTab(next);
    setStatus(null);
    navigate(next === 'sign-up' ? '/register' : location.pathname === '/' ? '/' : '/login');
  };

  const patchSignIn = (field) => (e) => {
    const val = field === 'remember' ? e.target.checked : e.target.value;
    setSignIn((p) => ({ ...p, [field]: val }));
    setSignInErr((p) => ({ ...p, [field]: undefined }));
  };

  const patchSignUp = (field) => (e) => {
    setSignUp((p) => ({ ...p, [field]: e.target.value }));
    setSignUpErr((p) => ({ ...p, [field]: undefined }));
  };

  const validateSignIn = () => {
    const err = {};
    if (!signIn.email.trim()) err.email = 'Email is required.';
    else if (!EMAIL_RE.test(signIn.email)) err.email = 'Enter a valid email address.';
    if (!signIn.password.trim()) err.password = 'Password is required.';
    setSignInErr(err);
    return !Object.keys(err).length;
  };

  const validateSignUp = () => {
    const err = {};
    if (!signUp.name.trim()) err.name = 'Full name is required.';
    if (!signUp.email.trim()) err.email = 'Email is required.';
    else if (!EMAIL_RE.test(signUp.email)) err.email = 'Enter a valid email address.';
    if (!signUp.password) err.password = 'Password is required.';
    else if (signUp.password.length < 6) err.password = 'Use at least 6 characters.';
    if (!signUp.confirmPassword) err.confirmPassword = 'Please confirm your password.';
    else if (signUp.password !== signUp.confirmPassword) err.confirmPassword = 'Passwords do not match.';
    if (!signUp.department) err.department = 'Please choose a department.';
    if (signUp.role === 'student' && !signUp.student_number.trim())
      err.student_number = 'Student ID is required for student accounts.';
    setSignUpErr(err);
    return !Object.keys(err).length;
  };

  const redirectToDashboard = (msg) => {
    setStatus({ type: 'success', message: msg });
    redirectTimer.current = setTimeout(() => navigate('/dashboard'), 700);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!validateSignIn()) { triggerShake(); return; }
    setLoading('sign-in');
    try {
      await login(signIn.email.trim(), signIn.password, { remember: signIn.remember });
      toast.success('Welcome back to CampusAssist.');
      redirectToDashboard('Sign in successful. Redirecting...');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      triggerShake();
    } finally {
      setLoading(null);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!validateSignUp()) { triggerShake(); return; }
    setLoading('sign-up');
    try {
      const { confirmPassword, ...payload } = signUp;
      if (!payload.batch_number) delete payload.batch_number;
      if (!payload.batch_section) delete payload.batch_section;
      if (!payload.student_number.trim()) delete payload.student_number;
      await register(payload, { remember: true });
      toast.success('Your CampusAssist account is ready.');
      redirectToDashboard('Account created. Taking you in...');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      triggerShake();
    } finally {
      setLoading(null);
    }
  };

  const handleDemoLogin = async (account) => {
    setStatus(null);
    setDemoLoading(account.role);
    setSignIn({ email: account.email, password: account.password, remember: true });
    setTab('sign-in');
    try {
      await login(account.email, account.password, { remember: true });
      toast.success(`Signed in as Demo ${account.role}.`);
      redirectToDashboard(`Signed in as ${account.role}. Redirecting...`);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      triggerShake();
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <motion.aside
      id="campusassist-auth"
      initial={{ opacity: 0, x: 24, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
      style={PANEL_STYLE}
      className={shake ? 'animate-shake-soft' : ''}
    >
      <div style={{ pointerEvents: 'none', position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.20) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'inline-flex', width: 46, height: 46, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 16, background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', color: '#fff', boxShadow: '0 12px 28px rgba(29,78,216,0.35)' }}>
              <SchoolRounded sx={{ fontSize: 24 }} />
            </div>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: '#fff' }}>CampusAssist</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Metropolitan University · CSE</p>
            </div>
          </div>
          <span style={{ borderRadius: 999, border: '1px solid rgba(96,165,250,0.25)', background: 'rgba(59,130,246,0.12)', padding: '4px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#93c5fd' }}>Secure</span>
        </div>

        <div style={{ marginBottom: 18, borderRadius: 18, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', padding: '14px 16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            🚀 Try a demo account
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin(acc)}
                style={{
                  flex: 1, padding: '9px 6px', fontSize: 13, fontWeight: 700, borderRadius: 12,
                  background: demoLoading === acc.role ? `${acc.color}40` : `${acc.color}22`,
                  border: `1px solid ${acc.color}50`, color: acc.color,
                  cursor: demoLoading !== null ? 'wait' : 'pointer',
                  transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, lineHeight: 1,
                }}
              >
                {demoLoading === acc.role
                  ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${acc.color}40`, borderTopColor: acc.color, animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  : <span style={{ fontSize: 18 }}>{acc.emoji}</span>
                }
                {acc.role}
              </button>
            ))}
          </div>
        </div>

        <AuthTabs value={tab} onChange={goTab} dark />

        <div style={{ marginBottom: 16, marginTop: 18 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            {tab === 'sign-in' ? 'Welcome back 👋' : 'Create your account'}
          </h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.50)' }}>
            {tab === 'sign-in' ? 'Sign in to access your MU academic workspace.' : 'Set up your CampusAssist account in a few steps.'}
          </p>
        </div>

        {status && (
          <div
            aria-live="polite"
            style={{
              marginBottom: 16, borderRadius: 14, padding: '12px 16px', fontSize: 13, fontWeight: 500,
              border: status.type === 'success' ? '1px solid rgba(34,197,94,0.30)' : '1px solid rgba(239,68,68,0.30)',
              background: status.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: status.type === 'success' ? '#4ade80' : '#f87171',
            }}
          >
            {status.message}
          </div>
        )}

        {tab === 'sign-in' ? (
          <SignInForm
            panelId="auth-panel-sign-in"
            values={signIn}
            errors={signInErr}
            loading={loading === 'sign-in'}
            passwordVisible={showPw.signIn}
            onFieldChange={patchSignIn}
            onTogglePassword={() => setShowPw((p) => ({ ...p, signIn: !p.signIn }))}
            onForgotPassword={() => navigate('/forgot-password')}
            onSubmit={handleSignIn}
          />
        ) : (
          <SignUpForm
            panelId="auth-panel-sign-up"
            values={signUp}
            errors={signUpErr}
            loading={loading === 'sign-up'}
            passwordVisible={showPw.signUp}
            confirmVisible={showPw.confirm}
            passwordStrength={pwStrength}
            passwordsMatch={pwMatch}
            departments={DEPARTMENTS}
            batches={BATCHES}
            sections={SECTIONS}
            onFieldChange={patchSignUp}
            onRoleChange={(role) => {
              setSignUp((p) => ({ ...p, role }));
              setSignUpErr((p) => ({ ...p, student_number: undefined }));
            }}
            onTogglePassword={() => setShowPw((p) => ({ ...p, signUp: !p.signUp }))}
            onToggleConfirm={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}
            onSubmit={handleSignUp}
          />
        )}

        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18, fontSize: 13 }}>
          <span style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
            {tab === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => goTab(tab === 'sign-in' ? 'sign-up' : 'sign-in')}
              style={{ fontWeight: 600, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13 }}
            >
              {tab === 'sign-in' ? 'Sign up free' : 'Sign in'}
            </button>
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.28)' }}>Role-based access · MU CSE · Secure &amp; Private</span>
        </div>
      </div>
    </motion.aside>
  );
}
