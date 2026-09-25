import React, { useState } from 'react';
import { BadgeOutlined, EmailOutlined, LockOutlined, PersonOutline, Visibility, VisibilityOff } from '@mui/icons-material';
import InputField from './InputField';

const STUDENT_ID_RE = /^\d{3}-\d{3}-\d{3}$/;
const DOMAIN_HINT = '@metrouni.edu.bd';

const STRENGTH = {
  weak:   { label: 'Weak',      color: '#f87171', pct: 34  },
  fair:   { label: 'Fair',      color: '#fbbf24', pct: 68  },
  strong: { label: 'Strong ✓',  color: '#4ade80', pct: 100 },
};

const ROLE_EMOJI = { student: '🎓', teacher: '📚', admin: '⚙️' };

const roleBtn = (active) => ({
  flex: 1, borderRadius: 10, padding: '10px 8px', fontSize: 13, fontWeight: 600,
  border: active ? '1px solid rgba(255,255,255,0.20)' : '1px solid transparent',
  background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.40)',
  cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
});

const SELECT = {
  width: '100%', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.07)', padding: '12px 14px',
  fontSize: 14, color: '#fff', outline: 'none', cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0,0,0,0.20)', appearance: 'none', WebkitAppearance: 'none',
};

const PW_BTN = {
  display: 'inline-flex', width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)',
  border: 'none', cursor: 'pointer',
};

const SUBMIT = (loading) => ({
  display: 'inline-flex', width: '100%', alignItems: 'center', justifyContent: 'center',
  borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 700, border: 'none',
  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
  background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
  color: '#fff', boxShadow: '0 14px 30px rgba(29,78,216,0.35)',
});

const SPINNER = { width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite', display: 'inline-block' };

const LabelText = ({ style, children }) => (
  <span style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.70)', ...style }}>{children}</span>
);

export default function SignUpForm({
  panelId, values, errors, loading,
  passwordVisible, confirmVisible, passwordStrength, passwordsMatch,
  departments, batches, sections,
  onFieldChange, onRoleChange, onTogglePassword, onToggleConfirm, onSubmit,
}) {
  const [emailHint, setEmailHint] = useState(null);
  const strength = STRENGTH[passwordStrength];
  const idValid = values.student_number ? STUDENT_ID_RE.test(values.student_number.trim()) : null;

  const handleEmail = (field) => (e) => {
    onFieldChange(field)(e);
    const v = e.target.value;
    setEmailHint(!v.includes('@') && v.length > 3 ? v + DOMAIN_HINT : null);
  };

  const applyHint = () => {
    onFieldChange('email')({ target: { value: emailHint } });
    setEmailHint(null);
  };

  return (
    <form id={panelId} role="tabpanel" aria-labelledby="auth-tab-sign-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={onSubmit} noValidate>
      <InputField id="sign-up-name" label="Full Name" value={values.name} onChange={onFieldChange('name')} error={errors.name} icon={<PersonOutline fontSize="small" />} placeholder="Enter your full name" autoComplete="name" />

      <div style={{ position: 'relative' }}>
        <InputField id="sign-up-email" label="Email" type="email" value={values.email} onChange={handleEmail('email')} error={errors.email} icon={<EmailOutlined fontSize="small" />} placeholder="yourname@metrouni.edu.bd" autoComplete="email" />
        {emailHint && (
          <button type="button" onClick={applyHint} style={{ position: 'absolute', right: 14, top: 36, fontSize: 11, color: '#60a5fa', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 8, padding: '3px 10px', cursor: 'pointer' }}>
            → {emailHint}
          </button>
        )}
      </div>

      <div>
        <LabelText>Role</LabelText>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
          {['student', 'teacher', 'admin'].map((r) => (
            <button key={r} type="button" onClick={() => onRoleChange(r)} aria-pressed={values.role === r} style={roleBtn(values.role === r)}>
              {ROLE_EMOJI[r]} {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label htmlFor="sign-up-department" style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.70)' }}>Department</label>
          <select id="sign-up-department" value={values.department} onChange={onFieldChange('department')} style={SELECT}>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.department && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#f87171' }}>{errors.department}</p>}
        </div>
        <InputField
          id="sign-up-student-id" label="University ID"
          value={values.student_number} onChange={onFieldChange('student_number')}
          error={errors.student_number} success={idValid === true}
          helperText={idValid === false ? 'Format: 231-115-094' : values.role === 'student' ? 'Required for students' : 'Optional'}
          icon={<BadgeOutlined fontSize="small" />} placeholder="231-115-094"
        />
      </div>

      {values.role === 'student' && (
        <div style={{ borderRadius: 18, border: '1px solid rgba(14,165,233,0.20)', background: 'rgba(14,165,233,0.06)', padding: 14 }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#fff' }}>Student Details</p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>Personalizes your routine and results view.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label htmlFor="sign-up-batch" style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.70)' }}>Batch</label>
              <select id="sign-up-batch" value={values.batch_number} onChange={onFieldChange('batch_number')} style={SELECT}>
                <option value="">Select batch</option>
                {batches.map((b) => <option key={b} value={b}>CSE-{b}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sign-up-section" style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.70)' }}>Section</label>
              <select id="sign-up-section" value={values.batch_section} onChange={onFieldChange('batch_section')} style={SELECT}>
                <option value="">Select section</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <InputField
        id="sign-up-password" label="Password"
        type={passwordVisible ? 'text' : 'password'} value={values.password}
        onChange={onFieldChange('password')} error={errors.password}
        icon={<LockOutlined fontSize="small" />} placeholder="Create a secure password" autoComplete="new-password"
        trailing={
          <button type="button" onClick={onTogglePassword} style={PW_BTN} aria-label={passwordVisible ? 'Hide password' : 'Show password'}>
            {passwordVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </button>
        }
      />

      {strength && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.40)' }}>Password strength</span>
            <span style={{ fontWeight: 700, color: strength.color }}>{strength.label}</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, background: strength.color, width: `${strength.pct}%`, transition: 'width 0.4s' }} />
          </div>
        </div>
      )}

      <InputField
        id="sign-up-confirm" label="Confirm Password"
        type={confirmVisible ? 'text' : 'password'} value={values.confirmPassword}
        onChange={onFieldChange('confirmPassword')} error={errors.confirmPassword}
        helperText={!errors.confirmPassword && values.confirmPassword ? (passwordsMatch ? 'Passwords match ✓' : 'Passwords do not match yet.') : undefined}
        success={!errors.confirmPassword && !!values.confirmPassword && passwordsMatch}
        icon={<LockOutlined fontSize="small" />} placeholder="Re-enter your password" autoComplete="new-password"
        trailing={
          <button type="button" onClick={onToggleConfirm} style={PW_BTN} aria-label={confirmVisible ? 'Hide' : 'Show'}>
            {confirmVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </button>
        }
      />

      <button type="submit" disabled={loading} style={SUBMIT(loading)}>
        {loading
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><span style={SPINNER} /> Creating account...</span>
          : 'Create Account →'
        }
      </button>
    </form>
  );
}
