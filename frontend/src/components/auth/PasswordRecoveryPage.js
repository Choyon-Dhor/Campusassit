import React, { useState } from 'react';
import { EmailOutlined, LockOutlined, SchoolRounded, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../../services/api';
import InputField from './InputField';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PasswordRecoveryPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const isResetMode = Boolean(token);

  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [devResetUrl, setDevResetUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (event) => {
    event.preventDefault();
    setStatus(null);
    setDevResetUrl('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrors({ email: 'Email is required.' });
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }

    setLoading(true);
    try {
      const res = await authService.requestPasswordReset({ email: trimmedEmail });
      setStatus({ type: 'success', message: res.data.message });
      setDevResetUrl(res.data.resetUrl || '');
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to start password recovery.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setStatus(null);

    const nextErrors = {};
    if (passwords.newPassword.length < 6) nextErrors.newPassword = 'Use at least 6 characters.';
    if (!passwords.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    if (passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({ token, newPassword: passwords.newPassword });
      setStatus({ type: 'success', message: res.data.message });
      toast.success('Password updated. Please sign in again.');
      window.setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f8fafc_42%,#ffffff_100%)] text-slate-900">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[320px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.16),transparent_24%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <section className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_32px_72px_rgba(15,23,42,0.14)] md:p-8">
          <div className="mb-7 flex items-center gap-3.5">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-campus-700 via-campus-600 to-sky-400 text-white shadow-[0_16px_32px_rgba(29,78,216,0.32)]">
              <SchoolRounded sx={{ fontSize: 26 }} />
            </div>
            <div>
              <p className="mb-0.5 font-display text-base font-bold text-slate-900">CampusAssist</p>
              <p className="m-0 text-xs text-slate-600">{isResetMode ? 'Set a new password' : 'Recover account access'}</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="mb-2 font-display text-2xl font-bold tracking-tight text-slate-900">
              {isResetMode ? 'Reset password' : 'Forgot password'}
            </h1>
            <p className="m-0 text-sm leading-6 text-slate-600">
              {isResetMode
                ? 'Create a new password for your account.'
                : 'Enter your campus email and we will prepare a reset link.'}
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

          {isResetMode ? (
            <form className="space-y-4" onSubmit={handleResetPassword} noValidate>
              <InputField
                id="new-password"
                label="New password"
                type={showPassword ? 'text' : 'password'}
                value={passwords.newPassword}
                onChange={(event) => {
                  setPasswords((prev) => ({ ...prev, newPassword: event.target.value }));
                  setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                error={errors.newPassword}
                icon={<LockOutlined fontSize="small" />}
                placeholder="Enter a new password"
                autoComplete="new-password"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-campus-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </button>
                }
              />
              <InputField
                id="confirm-new-password"
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                value={passwords.confirmPassword}
                onChange={(event) => {
                  setPasswords((prev) => ({ ...prev, confirmPassword: event.target.value }));
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                error={errors.confirmPassword}
                icon={<LockOutlined fontSize="small" />}
                placeholder="Re-enter the new password"
                autoComplete="new-password"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-campus-600 to-campus-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(29,78,216,0.22)] transition hover:-translate-y-0.5 hover:from-campus-700 hover:to-campus-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? 'Updating password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRequestReset} noValidate>
              <InputField
                id="recovery-email"
                label="Email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                icon={<EmailOutlined fontSize="small" />}
                placeholder="you@campus.edu"
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-campus-600 to-campus-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(29,78,216,0.22)] transition hover:-translate-y-0.5 hover:from-campus-700 hover:to-campus-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? 'Preparing reset link...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {devResetUrl ? (
            <a
              href={devResetUrl}
              className="mt-4 block break-all rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-campus-700 transition hover:text-campus-800"
            >
              Open local reset link
            </a>
          ) : null}

          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            <Link to="/login" className="font-semibold text-campus-600 underline-offset-2 transition hover:text-campus-700 hover:underline">
              Back to sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
