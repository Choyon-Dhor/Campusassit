// src/components/deadlines/Deadlines.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Tabs, Tab, CircularProgress, Skeleton
} from '@mui/material';
import { Add, Delete, Edit, CheckCircle, RadioButtonUnchecked, Assignment } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { deadlineService } from '../../services/api';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow, isPast, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

function LiveCountdown({ dateStr }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const date = new Date(dateStr);
  if (isPast(date)) return <span className="countdown-urgent">⚠️ Overdue!</span>;
  const days = differenceInDays(date, new Date());
  const hours = differenceInHours(date, new Date()) % 24;
  const mins = differenceInMinutes(date, new Date()) % 60;

  if (days > 7) return <span className="countdown-ok">📅 {days} days left</span>;
  if (days > 0) return <span className="countdown-warning">⏰ {days}d {hours}h left</span>;
  if (hours > 0) return <span className="countdown-urgent">🔥 {hours}h {mins}m left</span>;
  return <span className="countdown-urgent">🔥 {mins}m left!</span>;
}

const TYPES = ['assignment', 'exam', 'project', 'quiz', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];
const priorityColor = { high: '#ea4335', medium: '#e37400', low: '#34a853' };

export default function Deadlines() {
  const [tab, setTab] = useState(0);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', course_code: '', course_name: '',
    deadline_date: '', type: 'assignment', priority: 'medium'
  });

  const loadDeadlines = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (tab === 0) filters.completed = false;
      if (tab === 1) filters.completed = true;
      const res = await deadlineService.getAll(filters);
      setDeadlines(res.data.deadlines || []);
    } catch { toast.error('Failed to load deadlines'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { loadDeadlines(); }, [loadDeadlines]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', description: '', course_code: '', course_name: '', deadline_date: '', type: 'assignment', priority: 'medium' });
    setOpen(true);
  };

  const openEdit = (d) => {
    setEditItem(d);
    setForm({
      title: d.title, description: d.description || '', course_code: d.course_code || '',
      course_name: d.course_name || '',
      deadline_date: format(new Date(d.deadline_date), "yyyy-MM-dd'T'HH:mm"),
      type: d.type, priority: d.priority
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.deadline_date) return toast.error('Title and deadline date are required.');
    setSaving(true);
    try {
      if (editItem) {
        await deadlineService.update(editItem.id, form);
        toast.success('Deadline updated.');
      } else {
        await deadlineService.create(form);
        toast.success('Deadline added!');
      }
      setOpen(false);
      loadDeadlines();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deadline?')) return;
    try {
      await deadlineService.delete(id);
      toast.success('Deleted.');
      loadDeadlines();
    } catch (err) { toast.error(err.message); }
  };

  const handleToggle = async (id) => {
    try {
      await deadlineService.toggleComplete(id);
      loadDeadlines();
    } catch (err) { toast.error(err.message); }
  };

  // Group by date proximity
  const urgent = deadlines.filter(d => !d.is_completed && differenceInDays(new Date(d.deadline_date), new Date()) <= 3);
  const upcoming = deadlines.filter(d => !d.is_completed && differenceInDays(new Date(d.deadline_date), new Date()) > 3);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title"><Assignment sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />Assignment Deadline Tracker</h5>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 8 }}>
          Add Deadline
        </Button>
      </div>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #dadce0' }}>
        <Tab label="Active" />
        <Tab label="Completed" />
        <Tab label="All" />
      </Tabs>

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={90} sx={{ mb: 1.5, borderRadius: 2 }} />)
      ) : deadlines.length === 0 ? (
        <div className="empty-state ca-card" style={{ padding: 60 }}>
          <CheckCircle sx={{ fontSize: 64, color: '#34a853', opacity: 0.4 }} />
          <h6>{tab === 1 ? 'No Completed Deadlines' : 'No Active Deadlines'}</h6>
          <p>You're all caught up! Add deadlines to stay organized.</p>
        </div>
      ) : (
        <>
          {tab === 0 && urgent.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h6 style={{ fontWeight: 700, color: '#ea4335', marginBottom: 12 }}>🔥 Due Soon (≤ 3 days)</h6>
              {urgent.map(d => <DeadlineItem key={d.id} d={d} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} />)}
            </div>
          )}
          {tab === 0 && upcoming.length > 0 && (
            <div>
              <h6 style={{ fontWeight: 700, color: '#202124', marginBottom: 12 }}>📅 Upcoming</h6>
              {upcoming.map(d => <DeadlineItem key={d.id} d={d} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} />)}
            </div>
          )}
          {tab !== 0 && deadlines.map(d => <DeadlineItem key={d.id} d={d} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} />)}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>{editItem ? 'Edit Deadline' : 'Add New Deadline'}</DialogTitle>
        <DialogContent dividers>
          <TextField label="Title" fullWidth required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} sx={{ mb: 2 }} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} sx={{ mb: 2 }} />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField size="small" label="Course Code" fullWidth value={form.course_code}
                onChange={e => setForm({ ...form, course_code: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" label="Course Name" fullWidth value={form.course_name}
                onChange={e => setForm({ ...form, course_name: e.target.value })} />
            </Grid>
          </Grid>
          <TextField
            label="Deadline Date & Time" type="datetime-local" fullWidth required
            value={form.deadline_date} onChange={e => setForm({ ...form, deadline_date: e.target.value })}
            InputLabelProps={{ shrink: true }} sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} label="Type">
                  {TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} label="Priority">
                  {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : editItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function DeadlineItem({ d, onToggle, onEdit, onDelete }) {
  const priorityColor = { high: '#ea4335', medium: '#e37400', low: '#34a853' };
  return (
    <div className={`deadline-card ca-card mb-2 ${d.priority} ${d.is_completed ? 'done' : ''}`}
      style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconButton size="small" onClick={() => onToggle(d.id)} color={d.is_completed ? 'success' : 'default'}>
          {d.is_completed ? <CheckCircle color="success" /> : <RadioButtonUnchecked />}
        </IconButton>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14, textDecoration: d.is_completed ? 'line-through' : 'none', color: d.is_completed ? '#9aa0a6' : '#202124' }}>
              {d.title}
            </span>
            <Chip label={d.type} size="small" sx={{ height: 20, fontSize: 10 }} />
            <Chip label={d.priority} size="small"
              sx={{ height: 20, fontSize: 10, bgcolor: priorityColor[d.priority] + '20', color: priorityColor[d.priority], fontWeight: 600 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: '#5f6368', flexWrap: 'wrap' }}>
            {d.course_code && <span>{d.course_code}</span>}
            <span>📅 {format(new Date(d.deadline_date), 'MMM d, yyyy HH:mm')}</span>
          </div>
        </div>
        {!d.is_completed && <LiveCountdown dateStr={d.deadline_date} />}
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton size="small" onClick={() => onEdit(d)}><Edit sx={{ fontSize: 16 }} /></IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(d.id)}><Delete sx={{ fontSize: 16 }} /></IconButton>
        </div>
      </div>
    </div>
  );
}
