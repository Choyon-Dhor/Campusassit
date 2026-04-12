import React from 'react';
import {
  BadgeOutlined,
  EmailOutlined,
  LockOutlined,
  PersonOutline,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import InputField from './InputField';

const strengthMap = {
  weak: {
    label: 'Weak',
    className: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  fair: {
    label: 'Fair',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  strong: {
    label: 'Strong',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export default function SignUpForm({
  panelId,
  values,
  errors,
  loading,
  passwordVisible,
  confirmVisible,
  passwordStrength,
  passwordsMatch,
  departments,
  batches,
  sections,
  onFieldChange,
  onRoleChange,
  onTogglePassword,
  onToggleConfirm,
  onSubmit,
}) {
  const strengthMeta = strengthMap[passwordStrength];
  const strengthValue = passwordStrength === 'weak' ? 34 : passwordStrength === 'fair' ? 68 : passwordStrength === 'strong' ? 100 : 0;

  return (
    <form id={panelId} role="tabpanel" aria-labelledby="auth-tab-sign-up" className="space-y-4" onSubmit={onSubmit} noValidate>
      <InputField
        id="sign-up-name"
        label="Full Name"
        value={values.name}
        onChange={onFieldChange('name')}
        error={errors.name}
        icon={<PersonOutline fontSize="small" />}
        placeholder="Enter your full name"
        autoComplete="name"
      />

      <InputField
        id="sign-up-email"
        label="Email"
        type="email"
        value={values.email}
        onChange={onFieldChange('email')}
        error={errors.email}
        icon={<EmailOutlined fontSize="small" />}
        placeholder="you@campus.edu"
        autoComplete="email"
      />

      <div>
        <span className="mb-2 block text-sm font-semibold text-slate-700">Role</span>
        <div className="grid grid-cols-3 rounded-[20px] bg-slate-100 p-1">
          {['student', 'teacher', 'admin'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onRoleChange(role)}
              aria-pressed={values.role === role}
              aria-label={`Select ${role} role`}
              className={`rounded-2xl px-3 py-3 text-sm font-semibold capitalize transition ${
                values.role === role
                  ? 'bg-white text-campus-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="sign-up-department" className="mb-2 block text-sm font-semibold text-slate-700">
            Department
          </label>
          <select
            id="sign-up-department"
            value={values.department}
            onChange={onFieldChange('department')}
            className={`w-full rounded-[20px] border bg-white px-4 py-4 text-[15px] text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] outline-none transition focus:border-campus-400 focus:shadow-[0_16px_36px_rgba(29,78,216,0.14)] ${
              errors.department ? 'border-rose-300' : 'border-slate-200'
            }`}
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          {errors.department ? <p className="mt-2 text-sm font-medium text-rose-600">{errors.department}</p> : null}
        </div>

        <InputField
          id="sign-up-student-id"
          label="University ID"
          value={values.student_number}
          onChange={onFieldChange('student_number')}
          error={errors.student_number}
          helperText={values.role === 'student' ? 'Required for student accounts' : 'Optional for teacher and admin accounts'}
          icon={<BadgeOutlined fontSize="small" />}
          placeholder="e.g. 231-115-094"
        />
      </div>

      {values.role === 'student' ? (
        <div className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-sky-50 to-slate-50 p-4">
          <div className="mb-4">
            <p className="mb-1 text-sm font-semibold text-slate-900">Student details</p>
            <p className="m-0 text-sm leading-6 text-slate-500">
              Add your batch and section to personalize routine and result views.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="sign-up-batch" className="mb-2 block text-sm font-semibold text-slate-700">
                Batch
              </label>
              <select
                id="sign-up-batch"
                value={values.batch_number}
                onChange={onFieldChange('batch_number')}
                className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-[15px] text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] outline-none transition focus:border-campus-400 focus:shadow-[0_16px_36px_rgba(29,78,216,0.14)]"
              >
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    CSE-{batch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sign-up-section" className="mb-2 block text-sm font-semibold text-slate-700">
                Section
              </label>
              <select
                id="sign-up-section"
                value={values.batch_section}
                onChange={onFieldChange('batch_section')}
                className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-[15px] text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] outline-none transition focus:border-campus-400 focus:shadow-[0_16px_36px_rgba(29,78,216,0.14)]"
              >
                <option value="">Select section</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : null}

      <InputField
        id="sign-up-password"
        label="Password"
        type={passwordVisible ? 'text' : 'password'}
        value={values.password}
        onChange={onFieldChange('password')}
        error={errors.password}
        icon={<LockOutlined fontSize="small" />}
        placeholder="Create a secure password"
        autoComplete="new-password"
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

      <div className="flex flex-wrap items-center gap-3 text-sm" aria-live="polite">
        {strengthMeta ? (
          <span className={`inline-flex rounded-full border px-3 py-1 font-semibold ${strengthMeta.className}`}>
            Password strength: {strengthMeta.label}
          </span>
        ) : (
          <span className="text-slate-500">Use at least 6 characters for your password.</span>
        )}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            passwordStrength === 'strong'
              ? 'bg-emerald-500'
              : passwordStrength === 'fair'
                ? 'bg-amber-500'
                : passwordStrength === 'weak'
                  ? 'bg-rose-500'
                  : 'bg-slate-200'
          }`}
          style={{ width: `${strengthValue}%` }}
        />
      </div>

      <InputField
        id="sign-up-confirm"
        label="Confirm Password"
        type={confirmVisible ? 'text' : 'password'}
        value={values.confirmPassword}
        onChange={onFieldChange('confirmPassword')}
        error={errors.confirmPassword}
        helperText={
          !errors.confirmPassword && values.confirmPassword
            ? passwordsMatch
              ? 'Passwords match.'
              : 'Passwords do not match yet.'
            : undefined
        }
        success={!errors.confirmPassword && values.confirmPassword && passwordsMatch}
        icon={<LockOutlined fontSize="small" />}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        trailing={
          <button
            type="button"
            onClick={onToggleConfirm}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-campus-300"
            aria-label={confirmVisible ? 'Hide confirm password' : 'Show confirm password'}
          >
            {confirmVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </button>
        }
      />

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-campus-600 to-campus-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(29,78,216,0.22)] transition hover:-translate-y-0.5 hover:from-campus-700 hover:to-campus-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {loading ? (
          <span className="inline-flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}
