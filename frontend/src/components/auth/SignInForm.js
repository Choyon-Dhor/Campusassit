import React from 'react';
import {
  EmailOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import InputField from './InputField';

export default function SignInForm({
  panelId,
  values,
  errors,
  loading,
  passwordVisible,
  onFieldChange,
  onTogglePassword,
  onForgotPassword,
  onSubmit,
}) {
  return (
    <form id={panelId} role="tabpanel" aria-labelledby="auth-tab-sign-in" className="space-y-4" onSubmit={onSubmit} noValidate>
      <InputField
        id="sign-in-email"
        label="Email"
        type="email"
        value={values.email}
        onChange={onFieldChange('email')}
        error={errors.email}
        icon={<EmailOutlined fontSize="small" />}
        placeholder="you@campus.edu"
        autoComplete="email"
      />

      <InputField
        id="sign-in-password"
        label="Password"
        type={passwordVisible ? 'text' : 'password'}
        value={values.password}
        onChange={onFieldChange('password')}
        error={errors.password}
        icon={<LockOutlined fontSize="small" />}
        placeholder="Enter your password"
        autoComplete="current-password"
        trailing={
          <button
            type="button"
            onClick={onTogglePassword}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-campus-300"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="inline-flex cursor-pointer items-center gap-3 text-slate-600">
          <input
            type="checkbox"
            checked={values.remember}
            onChange={onFieldChange('remember')}
            className="h-4 w-4 rounded border-slate-300 text-campus-600 focus:ring-campus-400"
          />
          Remember me
        </label>

        <button
          type="button"
          onClick={onForgotPassword}
          className="font-semibold text-campus-700 transition hover:text-campus-800"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-campus-600 to-campus-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(29,78,216,0.22)] transition hover:-translate-y-0.5 hover:from-campus-700 hover:to-campus-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {loading ? (
          <span className="inline-flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
