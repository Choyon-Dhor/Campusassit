// src/components/auth/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextField, Button, Alert, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Collapse
} from '@mui/material';
import { School, Badge, Groups } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const departments = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Mathematics', 'Physics', 'Chemistry',
  'Civil Engineering', 'Business Administration',
  'English', 'Other',
];

// CSE batches currently active at MU Sylhet
const batches = [57,58,59,60,61,62,63,64,65];
const sections = ['A','B','C','D','E','F','G','H','I','A+B','B+I','C+G','D+H','E+F','A+F','D+G','I+J','E+F+G'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'student', department: 'Computer Science & Engineering',
    student_number: '', batch_number: '', batch_section: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword)
      return setError('Passwords do not match.');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters.');
    if (form.role === 'student' && !form.student_number.trim())
      return setError('Student ID is required for student accounts.');

    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      // Clean up empty optional fields
      if (!data.batch_number)  delete data.batch_number;
      if (!data.batch_section) delete data.batch_section;
      if (!data.student_number.trim()) delete data.student_number;

      await register(data);
      toast.success('Account created! Welcome to CampusAssist.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isStudent = form.role === 'student';

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <School style={{ color: 'white', fontSize: 32 }} />
        </div>
        <h2 style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: '1.5rem', marginBottom: 4 }}>
          Create your account
        </h2>
        <p style={{ color: '#5f6368', fontSize: 14, marginBottom: 20 }}>
          Metropolitan University · CampusAssist
        </p>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {/* ── Personal Info ── */}
          <TextField
            label="Full Name" fullWidth required
            value={form.name} onChange={set('name')} sx={{ mb: 2 }}
          />
          <TextField
            label="Email Address" type="email" fullWidth required
            value={form.email} onChange={set('email')} sx={{ mb: 2 }}
          />

          {/* ── Role & Department ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={form.role} onChange={set('role')} label="Role">
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={form.department} onChange={set('department')} label="Department">
                {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </div>

          {/* ── Student-only fields ── */}
          <Collapse in={isStudent}>
            <div style={{
              background: '#f8f9fa', borderRadius: 10, padding: '16px',
              marginBottom: 16, border: '1px solid #e8eaed'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Badge sx={{ fontSize: 16, color: '#1a73e8' }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: '#202124' }}>Student Information</span>
              </div>

              {/* Student ID */}
              <TextField
                label="Student ID"
                placeholder="e.g. 231-115-094"
                fullWidth
                required={isStudent}
                value={form.student_number}
                onChange={set('student_number')}
                helperText="Your university-issued student ID (e.g. 231-115-094)"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <span style={{ color: '#5f6368', marginRight: 6, fontSize: 14 }}>ID:</span>
                  )
                }}
              />

              {/* Batch & Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Batch</InputLabel>
                  <Select value={form.batch_number} onChange={set('batch_number')} label="Batch">
                    <MenuItem value=""><em>Select batch</em></MenuItem>
                    {batches.map(b => (
                      <MenuItem key={b} value={b}>CSE-{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Section</InputLabel>
                  <Select value={form.batch_section} onChange={set('batch_section')} label="Section">
                    <MenuItem value=""><em>Select section</em></MenuItem>
                    {sections.map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
          </Collapse>

          {/* ── Password ── */}
          <TextField
            label="Password" type="password" fullWidth required
            value={form.password} onChange={set('password')} sx={{ mb: 2 }}
          />
          <TextField
            label="Confirm Password" type="password" fullWidth required
            value={form.confirmPassword} onChange={set('confirmPassword')} sx={{ mb: 3 }}
          />

          <Button
            type="submit" variant="contained" fullWidth size="large"
            disabled={loading} sx={{ py: 1.5, mb: 2 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#5f6368' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1a73e8', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
