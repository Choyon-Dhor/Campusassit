import React from 'react';

const borderColor = (error, success, dark) => {
  if (error) return 'rgba(248,113,113,0.60)';
  if (success) return 'rgba(74,222,128,0.50)';
  return dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0';
};

export default function InputField({
  id, label, icon, error, success, helperText, trailing,
  dark = true, className = '', inputClassName = '', ...props
}) {
  const ariaDesc = error ? `${id}-error` : helperText ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: dark ? 'rgba(255,255,255,0.70)' : '#374151' }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, borderRadius: 14,
        border: `1px solid ${borderColor(error, success, dark)}`,
        background: dark ? 'rgba(255,255,255,0.07)' : '#fff',
        padding: '4px 14px 4px 10px',
        boxShadow: dark ? '0 4px 14px rgba(0,0,0,0.20)' : '0 6px 18px rgba(15,23,42,0.05)',
        transition: 'all 0.2s',
      }}>
        <span style={{
          display: 'flex', width: 36, height: 36, flexShrink: 0,
          alignItems: 'center', justifyContent: 'center', borderRadius: 10,
          background: dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
          color: dark ? 'rgba(255,255,255,0.50)' : '#64748b',
        }}>
          {icon}
        </span>
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDesc}
          style={{ flex: 1, border: 0, background: 'transparent', padding: '10px 0', fontSize: 14, outline: 'none', color: dark ? '#fff' : '#111827' }}
          className={inputClassName}
          {...props}
        />
        {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
      </div>
      {error ? (
        <p id={`${id}-error`} style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 500, color: '#f87171' }}>{error}</p>
      ) : success ? (
        <p id={`${id}-hint`} style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 500, color: '#4ade80' }}>{helperText || 'Looks good.'}</p>
      ) : helperText ? (
        <p id={`${id}-hint`} style={{ margin: '6px 0 0', fontSize: 12, color: dark ? 'rgba(255,255,255,0.35)' : '#9ca3af' }}>{helperText}</p>
      ) : null}
    </div>
  );
}
