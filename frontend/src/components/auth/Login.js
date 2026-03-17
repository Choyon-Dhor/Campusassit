// ============================================================
// src/components/auth/Login.js
// ============================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, Button, Alert, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff, School } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { label: 'Admin', email: 'admin@campus.edu', password: 'password123' },
    { label: 'Teacher', email: 'sarah@campus.edu', password: 'password123' },
    { label: 'Student', email: 'alice@student.edu', password: 'password123' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <School style={{ color: 'white', fontSize: 32 }} />
        </div>
        <h2 style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: '1.6rem', marginBottom: 4 }}>
          Sign in to CampusAssist
        </h2>
        <p style={{ color: '#5f6368', fontSize: 14, marginBottom: 24 }}>
          Smart Academic Management Platform
        </p>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email address"
            type="email"
            fullWidth
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            sx={{ mb: 2 }}
            size="medium"
          />
          <TextField
            label="Password"
            type={showPass ? 'text' : 'password'}
            fullWidth
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass(!showPass)} edge="end">
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
          </Button>
        </form>

        {/* Demo quick-login */}
        <div style={{ margin: '16px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#9aa0a6', marginBottom: 8 }}>Demo Accounts</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {demoAccounts.map(acc => (
              <button
                key={acc.label}
                onClick={() => setForm({ email: acc.email, password: acc.password })}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: '1px solid #dadce0',
                  background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  color: '#1a73e8', transition: 'all 0.15s'
                }}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#5f6368' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1a73e8', fontWeight: 500, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
