// src/components/auth/Profile.js
import React, { useState } from 'react';
import {
  Grid, Card, CardContent, CardHeader, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Divider,
  Avatar, Alert, CircularProgress, Chip, Collapse
} from '@mui/material';
import {
  Person, Badge, Lock, School, CheckCircle, Edit, Save
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { toast } from 'react-toastify';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Mathematics', 'Physics', 'Chemistry',
  'Civil Engineering', 'Business Administration',
  'English', 'Other',
];

const BATCHES   = [57, 58, 59, 60, 61, 62, 63, 64, 65];
const SECTIONS  = ['A','B','C','D','E','F','G','H','I',
                   'A+B','B+I','C+G','D+H','E+F','A+F','D+G','I+J'];

const roleColor  = { admin: '#ea4335', teacher: '#34a853', student: '#1a73e8' };
const roleLabels = { admin: '🛡️ Admin', teacher: '👨‍🏫 Teacher', student: '🎓 Student' };

export default function Profile() {
  const { user, updateUser } = useAuth();

  // Profile form
  const [profile, setProfile]       = useState({
    name:           user?.name           || '',
    department:     user?.department     || '',
    student_number: user?.student_number || '',
    batch_number:   user?.batch_number   || '',
    batch_section:  user?.batch_section  || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);

  // Password form
  const [pwForm, setPwForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw]   = useState(false);
  const [pwError,  setPwError]    = useState('');

  const setP = (f) => (e) => setProfile(prev => ({ ...prev, [f]: e.target.value }));
  const setPw = (f) => (e) => setPwForm(prev => ({ ...prev, [f]: e.target.value }));

  const isStudent = user?.role === 'student';

  // ── Save profile ───────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile.name.trim()) return toast.error('Name is required.');
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      const payload = {
        name:       profile.name,
        department: profile.department,
      };
      if (isStudent) {
        payload.student_number = profile.student_number || null;
        payload.batch_number   = profile.batch_number   ? parseInt(profile.batch_number) : null;
        payload.batch_section  = profile.batch_section  || null;
      }
      const res = await authService.updateProfile(payload);
      updateUser(res.data.user);
      setProfileSaved(true);
      toast.success('Profile updated successfully!');
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      return setPwError('All password fields are required.');
    }
    if (pwForm.newPassword.length < 6) {
      return setPwError('New password must be at least 6 characters.');
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwError('New passwords do not match.');
    }
    setSavingPw(true);
    try {
      await authService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title">
          <Person sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />
          My Account
        </h5>
      </div>

      <Grid container spacing={3}>

        {/* ── Left: Avatar + Summary card ── */}
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{
                width: 80, height: 80, margin: '0 auto 12px',
                bgcolor: roleColor[user?.role] || '#1a73e8',
                fontSize: '2rem', fontWeight: 700,
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>

              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#202124' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 13, color: '#5f6368', marginTop: 2 }}>
                {user?.email}
              </div>

              <Chip
                label={roleLabels[user?.role] || user?.role}
                size="small"
                sx={{
                  mt: 1.5, fontWeight: 700, fontSize: 11,
                  bgcolor: roleColor[user?.role] + '20',
                  color: roleColor[user?.role],
                }}
              />

              {user?.department && (
                <div style={{
                  marginTop: 12, padding: '8px 12px',
                  background: '#f8f9fa', borderRadius: 8,
                  fontSize: 12, color: '#5f6368',
                }}>
                  <School sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  {user.department}
                </div>
              )}

              {/* Student info badges */}
              {isStudent && (
                <div style={{ marginTop: 12 }}>
                  {user?.student_number ? (
                    <div style={{
                      background: '#e8f0fe', borderRadius: 8,
                      padding: '8px 12px', marginBottom: 8,
                    }}>
                      <div style={{ fontSize: 10, color: '#5f6368', textTransform: 'uppercase', letterSpacing: 0.8 }}>Student ID</div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 14, color: '#1a73e8' }}>
                        {user.student_number}
                      </div>
                    </div>
                  ) : (
                    <Alert severity="warning" sx={{ fontSize: 11, borderRadius: 2, textAlign: 'left' }}>
                      No Student ID set. Add it below to view your results.
                    </Alert>
                  )}

                  {user?.batch_number && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                      <Chip label={`CSE-${user.batch_number}`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                      {user.batch_section && (
                        <Chip label={`[${user.batch_section}]`} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: Edit forms ── */}
        <Grid item xs={12} md={9}>

          {/* Profile info card */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardHeader
              title={<span><Edit sx={{ mr: 1, fontSize: 18, verticalAlign: 'middle' }} />Edit Profile</span>}
              titleTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Full Name" fullWidth required
                    value={profile.name}
                    onChange={setP('name')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select value={profile.department} onChange={setP('department')} label="Department">
                      {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Student-only fields */}
              <Collapse in={isStudent}>
                <div style={{
                  marginTop: 20, padding: '16px',
                  background: '#f8f9fa', borderRadius: 10,
                  border: '1px solid #e8eaed',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <Badge sx={{ fontSize: 16, color: '#1a73e8' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#202124' }}>
                      Student Information
                    </span>
                    <Chip label="Required for Result Portal" size="small"
                      sx={{ height: 18, fontSize: 10, bgcolor: '#fef7e0', color: '#e37400', ml: 1 }} />
                  </div>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Student ID"
                        placeholder="e.g. 231-115-094"
                        fullWidth
                        value={profile.student_number}
                        onChange={setP('student_number')}
                        helperText="Your university-issued ID"
                        InputProps={{
                          startAdornment: <span style={{ color: '#5f6368', marginRight: 6, fontSize: 13 }}>ID:</span>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Batch</InputLabel>
                        <Select value={profile.batch_number} onChange={setP('batch_number')} label="Batch">
                          <MenuItem value=""><em>Select batch</em></MenuItem>
                          {BATCHES.map(b => <MenuItem key={b} value={b}>CSE-{b}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Section</InputLabel>
                        <Select value={profile.batch_section} onChange={setP('batch_section')} label="Section">
                          <MenuItem value=""><em>Select section</em></MenuItem>
                          {SECTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2, fontSize: 12 }}>
                    Your Student ID links your account to your academic results.
                    After saving, go to <strong>Result Portal</strong> to view your grades.
                  </Alert>
                </div>
              </Collapse>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <Button
                  variant="contained"
                  startIcon={
                    savingProfile ? <CircularProgress size={16} color="inherit" /> :
                    profileSaved  ? <CheckCircle /> : <Save />
                  }
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  color={profileSaved ? 'success' : 'primary'}
                  sx={{ minWidth: 140 }}
                >
                  {savingProfile ? 'Saving…' : profileSaved ? 'Saved!' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change password card */}
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title={<span><Lock sx={{ mr: 1, fontSize: 18, verticalAlign: 'middle' }} />Change Password</span>}
              titleTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent>
              {pwError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPwError('')}>
                  {pwError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Current Password" type="password" fullWidth
                    value={pwForm.currentPassword}
                    onChange={setPw('currentPassword')}
                    autoComplete="current-password"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="New Password" type="password" fullWidth
                    value={pwForm.newPassword}
                    onChange={setPw('newPassword')}
                    helperText="Minimum 6 characters"
                    autoComplete="new-password"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Confirm New Password" type="password" fullWidth
                    value={pwForm.confirmPassword}
                    onChange={setPw('confirmPassword')}
                    error={!!pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword}
                    helperText={
                      pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                        ? 'Passwords do not match' : ''
                    }
                    autoComplete="new-password"
                  />
                </Grid>
              </Grid>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <Button
                  variant="outlined"
                  startIcon={savingPw ? <CircularProgress size={16} /> : <Lock />}
                  onClick={handleChangePassword}
                  disabled={savingPw}
                  sx={{ minWidth: 160 }}
                >
                  {savingPw ? 'Updating…' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

        </Grid>
      </Grid>
    </div>
  );
}
