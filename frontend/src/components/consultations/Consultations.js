// src/components/consultations/Consultations.js
import React, { useState, useEffect } from 'react';
import {
  Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, Tabs, Tab, Avatar, CircularProgress, Skeleton, Alert
} from '@mui/material';
import { Add, EventNote, CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { consultationService } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const statusColor = {
  pending:   { bg: '#fef7e0', color: '#e37400', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
  approved:  { bg: '#e6f4ea', color: '#137333', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  rejected:  { bg: '#fce8e6', color: '#c5221f', icon: <Cancel sx={{ fontSize: 14 }} /> },
  completed: { bg: '#e8f0fe', color: '#1967d2', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
};

export default function Consultations() {
  const { user, isTeacherOrAdmin, isAdmin } = useAuth();
  const [tab, setTab] = useState(0);
  const [hours, setHours] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const [saving, setSaving] = useState(false);

  const [hoursForm, setHoursForm] = useState({ day: 'Sunday', start_time: '10:00', end_time: '12:00', location: '', notes: '' });
  const [bookForm, setBookForm] = useState({ appointment_date: '', start_time: '', purpose: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hoursRes, apptRes] = await Promise.all([
        consultationService.getHours(),
        consultationService.getAppointments(),
      ]);
      setHours(hoursRes.data.consultationHours || []);
      setAppointments(apptRes.data.appointments || []);
    } catch { toast.error('Failed to load consultation data'); }
    finally { setLoading(false); }
  };

  const handleCreateHours = async () => {
    setSaving(true);
    try {
      await consultationService.createHours(hoursForm);
      toast.success('Consultation hours added!');
      setHoursOpen(false);
      loadData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleBook = async () => {
    if (!bookForm.appointment_date || !bookForm.start_time || !bookForm.purpose) {
      return toast.error('All fields are required.');
    }
    setSaving(true);
    try {
      await consultationService.bookAppointment({
        consultation_id: selectedHour.id,
        ...bookForm,
      });
      toast.success('Appointment booked! Awaiting teacher approval.');
      setBookOpen(false);
      setBookForm({ appointment_date: '', start_time: '', purpose: '' });
      loadData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleUpdateStatus = async (id, status, notes = '') => {
    try {
      await consultationService.updateStatus(id, { status, teacher_notes: notes });
      toast.success(`Appointment ${status}.`);
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title"><EventNote sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />Consultation Hours</h5>
        {isTeacherOrAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setHoursOpen(true)} sx={{ borderRadius: 8 }}>
            Add Consultation Hours
          </Button>
        )}
      </div>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #dadce0' }}>
        <Tab label="Available Hours" />
        <Tab label="My Appointments" />
      </Tabs>

      {/* ── Tab 0: Available Hours ── */}
      {tab === 0 && (
        loading ? (
          <Grid container spacing={2}>
            {[...Array(4)].map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={160} /></Grid>)}
          </Grid>
        ) : hours.length === 0 ? (
          <div className="empty-state ca-card" style={{ padding: 60 }}>
            <EventNote sx={{ fontSize: 64, opacity: 0.3 }} />
            <h6>No Consultation Hours</h6>
            <p>Teachers have not set up consultation hours yet.</p>
          </div>
        ) : (
          <Grid container spacing={2}>
            {hours.map(h => (
              <Grid item xs={12} sm={6} md={4} key={h.id}>
                <div className="ca-card" style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar sx={{ bgcolor: '#1a73e8', width: 44, height: 44, fontSize: 18 }}>
                      {h.teacher_name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{h.teacher_name}</div>
                      <div style={{ fontSize: 12, color: '#5f6368' }}>{h.department}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Chip label={h.day} size="small" sx={{ bgcolor: '#e8f0fe', color: '#1a73e8', fontWeight: 600, height: 22 }} />
                    <Chip label={`${h.start_time.slice(0,5)} – ${h.end_time.slice(0,5)}`} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                  </div>
                  {h.location && (
                    <div style={{ fontSize: 13, color: '#5f6368' }}>📍 {h.location}</div>
                  )}
                  {h.notes && (
                    <div style={{ fontSize: 12, color: '#5f6368', fontStyle: 'italic' }}>ℹ️ {h.notes}</div>
                  )}
                  {!isTeacherOrAdmin && (
                    <Button
                      variant="outlined" size="small" fullWidth
                      onClick={() => { setSelectedHour(h); setBookOpen(true); }}
                      sx={{ mt: 'auto', borderRadius: 8 }}
                    >
                      Book Appointment
                    </Button>
                  )}
                </div>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* ── Tab 1: Appointments ── */}
      {tab === 1 && (
        loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 1.5 }} />)
        ) : appointments.length === 0 ? (
          <div className="empty-state ca-card" style={{ padding: 60 }}>
            <EventNote sx={{ fontSize: 64, opacity: 0.3 }} />
            <h6>No Appointments</h6>
            <p>{isTeacherOrAdmin ? 'No appointment requests yet.' : 'Book an appointment with a teacher.'}</p>
          </div>
        ) : (
          appointments.map(appt => {
            const st = statusColor[appt.status] || statusColor.pending;
            return (
              <div key={appt.id} className="ca-card mb-2" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <Chip
                        icon={st.icon}
                        label={appt.status}
                        size="small"
                        sx={{ height: 24, fontSize: 11, bgcolor: st.bg, color: st.color, fontWeight: 600 }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {isTeacherOrAdmin ? `Student: ${appt.student_name}` : `Teacher: ${appt.teacher_name}`}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#3c4043', marginBottom: 4 }}>
                      <strong>Purpose:</strong> {appt.purpose}
                    </div>
                    <div style={{ fontSize: 12, color: '#5f6368', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>📅 {format(new Date(appt.appointment_date), 'MMM d, yyyy')}</span>
                      <span>⏰ {appt.start_time.slice(0,5)}</span>
                      {appt.teacher_notes && <span>💬 {appt.teacher_notes}</span>}
                    </div>
                  </div>
                  {isTeacherOrAdmin && appt.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="small" variant="contained" color="success"
                        onClick={() => handleUpdateStatus(appt.id, 'approved')}>
                        Approve
                      </Button>
                      <Button size="small" variant="outlined" color="error"
                        onClick={() => handleUpdateStatus(appt.id, 'rejected')}>
                        Reject
                      </Button>
                    </div>
                  )}
                  {isTeacherOrAdmin && appt.status === 'approved' && (
                    <Button size="small" variant="outlined"
                      onClick={() => handleUpdateStatus(appt.id, 'completed')}>
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )
      )}

      {/* Add Hours Dialog */}
      <Dialog open={hoursOpen} onClose={() => setHoursOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Set Consultation Hours</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Day</InputLabel>
            <Select value={hoursForm.day} onChange={e => setHoursForm({ ...hoursForm, day: e.target.value })} label="Day">
              {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField label="Start Time" type="time" fullWidth value={hoursForm.start_time}
                onChange={e => setHoursForm({ ...hoursForm, start_time: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="End Time" type="time" fullWidth value={hoursForm.end_time}
                onChange={e => setHoursForm({ ...hoursForm, end_time: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
          <TextField label="Location" fullWidth value={hoursForm.location}
            onChange={e => setHoursForm({ ...hoursForm, location: e.target.value })} sx={{ mb: 2 }} />
          <TextField label="Notes" fullWidth multiline rows={2} value={hoursForm.notes}
            onChange={e => setHoursForm({ ...hoursForm, notes: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHoursOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateHours} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Book Appointment Dialog */}
      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Book Appointment</DialogTitle>
        <DialogContent dividers>
          {selectedHour && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              With <strong>{selectedHour.teacher_name}</strong> on <strong>{selectedHour.day}</strong>, {selectedHour.start_time.slice(0,5)}–{selectedHour.end_time.slice(0,5)}
            </Alert>
          )}
          <TextField label="Date" type="date" fullWidth required value={bookForm.appointment_date}
            onChange={e => setBookForm({ ...bookForm, appointment_date: e.target.value })}
            InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
          <TextField label="Time" type="time" fullWidth required value={bookForm.start_time}
            onChange={e => setBookForm({ ...bookForm, start_time: e.target.value })}
            InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
          <TextField label="Purpose / Topic" fullWidth required multiline rows={3} value={bookForm.purpose}
            onChange={e => setBookForm({ ...bookForm, purpose: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBookOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBook} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
