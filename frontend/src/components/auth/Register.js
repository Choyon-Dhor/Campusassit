// src/components/auth/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextField, Button, Alert, Select, MenuItem,
  FormControl, InputLabel, CircularProgress
} from '@mui/material';
import { School } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'student', department: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const departments = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'EEE', 'Civil Engineering', 'Business', 'English', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register(data);
      toast.success('Account created! Welcome to CampusAssist.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <School style={{ color: 'white', fontSize: 32 }} />
        </div>
        <h2 style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: '1.5rem', marginBottom: 4 }}>
          Create your account
        </h2>
        <p style={{ color: '#5f6368', fontSize: 14, marginBottom: 20 }}>
          Join CampusAssist today
        </p>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField label="Full Name" fullWidth required value={form.name}
            onChange={set('name')} sx={{ mb: 2 }} />

          <TextField label="Email Address" type="email" fullWidth required value={form.email}
            onChange={set('email')} sx={{ mb: 2 }} />

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

          <TextField label="Password" type="password" fullWidth required value={form.password}
            onChange={set('password')} sx={{ mb: 2 }} />
          <TextField label="Confirm Password" type="password" fullWidth required value={form.confirmPassword}
            onChange={set('confirmPassword')} sx={{ mb: 3 }} />

          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, mb: 2 }}>
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
