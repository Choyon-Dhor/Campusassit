import React from 'react';

export default function InputField({
  id,
  label,
  icon,
  error,
  success,
  helperText,
  trailing,
  className = '',
  inputClassName = '',
  ...props
}) {
  const describedBy = error ? `${id}-error` : helperText ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div
        className={`group flex items-center gap-2.5 rounded-xl border bg-white px-3.5 py-1 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition focus-within:-translate-y-0.5 focus-within:shadow-[0_14px_28px_rgba(29,78,216,0.14)] ${
          error
            ? 'border-rose-300 focus-within:border-rose-400'
            : success
              ? 'border-emerald-300 focus-within:border-emerald-400'
              : 'border-slate-200 focus-within:border-campus-400'
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </span>
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full border-0 bg-transparent py-2.5 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 ${inputClassName}`}
          {...props}
        />
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-rose-600">
          {error}
        </p>
      ) : success ? (
        <p id={`${id}-hint`} className="mt-2 text-sm font-medium text-emerald-600">
          {helperText || 'Looks good.'}
        </p>
      ) : helperText ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
