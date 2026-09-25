import React, { useState } from 'react';
import { EmailOutlined, LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import InputField from './InputField';

const DOMAIN_HINT = '@metrouni.edu.bd';

const PW_TOGGLE_STYLE = {
  display: 'inline-flex', width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)',
  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
};

const SUBMIT_STYLE = (loading) => ({
  display: 'inline-flex', width: '100%', alignItems: 'center', justifyContent: 'center',
  borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 700, border: 'none',
  cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
  background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
  color: '#fff', boxShadow: '0 14px 30px rgba(29,78,216,0.35)',
});

const Spinner = () => (
  <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
);

export default function SignInForm({ panelId, values, errors, loading, passwordVisible, onFieldChange, onTogglePassword, onForgotPassword, onSubmit }) {
  const [hint, setHint] = useState(null);

  const handleEmail = (field) => (e) => {
    onFieldChange(field)(e);
    const v = e.target.value;
    setHint(!v.includes('@') && v.length > 2 ? v + DOMAIN_HINT : null);
  };

  const applyHint = () => {
    onFieldChange('email')({ target: { value: hint } });
    setHint(null);
  };

  return (
    <form id={panelId} role="tabpanel" aria-labelledby="auth-tab-sign-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={onSubmit} noValidate>
      <div style={{ position: 'relative' }}>
        <InputField
          id="sign-in-email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleEmail('email')}
          error={errors.email}
          icon={<EmailOutlined fontSize="small" />}
          placeholder="yourname@metrouni.edu.bd"
          autoComplete="email"
        />
        {hint && (
          <button type="button" onClick={applyHint} style={{
            position: 'absolute', left: 50, top: '50%', transform: 'translateY(-50%)',
            marginTop: 12, fontSize: 12, color: '#60a5fa', background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(96,165,250,0.25)', borderRadius: 8, padding: '3px 10px',
            cursor: 'pointer', zIndex: 10,
          }}>
            Use: {hint}
          </button>
        )}
      </div>

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
          <button type="button" onClick={onTogglePassword} style={PW_TOGGLE_STYLE} aria-label={passwordVisible ? 'Hide password' : 'Show password'}>
            {passwordVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </button>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
        <label style={{ display: 'inline-flex', cursor: 'pointer', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.55)' }}>
          <input type="checkbox" checked={values.remember} onChange={onFieldChange('remember')} style={{ width: 15, height: 15, accentColor: '#3b82f6' }} />
          Remember me
        </label>
        <button type="button" onClick={onForgotPassword} style={{ fontWeight: 600, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}>
          Forgot password?
        </button>
      </div>

      <button type="submit" disabled={loading} style={SUBMIT_STYLE(loading)}>
        {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Spinner /> Signing in...</span> : 'Sign In →'}
      </button>
    </form>
  );
}
