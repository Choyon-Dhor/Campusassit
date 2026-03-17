// src/components/announcements/Announcements.js
import React, { useState, useEffect } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Switch, FormControlLabel, CircularProgress, Skeleton
} from '@mui/material';
import { Add, Delete, Edit, PushPin, Campaign } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { announcementService } from '../../services/api';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

const categoryColors = {
  general: { bg: '#e8f0fe', color: '#1a73e8' },
  academic: { bg: '#e6f4ea', color: '#137333' },
  event:   { bg: '#fef7e0', color: '#e37400' },
  urgent:  { bg: '#fce8e6', color: '#c5221f' },
};

export default function Announcements() {
  const { user, isTeacherOrAdmin, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', target_role: 'all', is_pinned: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAnnouncements(); }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAll({ page: 1, limit: 50 });
      setAnnouncements(res.data.announcements || []);
    } catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', content: '', category: 'general', target_role: 'all', is_pinned: false });
    setOpen(true);
  };

  const openEdit = (ann) => {
    setEditItem(ann);
    setForm({ title: ann.title, content: ann.content, category: ann.category, target_role: ann.target_role, is_pinned: !!ann.is_pinned });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      return toast.error('Title and content are required.');
    }
    setSaving(true);
    try {
      if (editItem) {
        await announcementService.update(editItem.id, form);
        toast.success('Announcement updated.');
      } else {
        await announcementService.create(form);
        toast.success('Announcement posted!');
      }
      setOpen(false);
      loadAnnouncements();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementService.delete(id);
      toast.success('Deleted.');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) { toast.error(err.message); }
  };

  const canManage = (ann) => isAdmin || ann.author_id === user?.id;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title"><Campaign sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />Announcements</h5>
        {isTeacherOrAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 8 }}>
            New Announcement
          </Button>
        )}
      </div>

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={120} sx={{ mb: 2, borderRadius: 2 }} />)
      ) : announcements.length === 0 ? (
        <div className="empty-state ca-card" style={{ padding: 60 }}>
          <Campaign sx={{ fontSize: 64, opacity: 0.3 }} />
          <h6>No Announcements</h6>
          <p>Announcements from teachers and admin will appear here.</p>
        </div>
      ) : (
        announcements.map(ann => {
          const catStyle = categoryColors[ann.category] || categoryColors.general;
          return (
            <div key={ann.id} className={`announcement-card ca-card mb-3 ${ann.is_pinned ? 'pinned' : ''} ${ann.category}`}
              style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    {ann.is_pinned && <PushPin sx={{ fontSize: 16, color: '#e37400' }} />}
                    <h6 style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{ann.title}</h6>
                    <Chip label={ann.category} size="small"
                      sx={{ height: 20, fontSize: 10, bgcolor: catStyle.bg, color: catStyle.color, fontWeight: 600 }} />
                    {ann.target_role !== 'all' && (
                      <Chip label={ann.target_role} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                    )}
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 14, color: '#3c4043', lineHeight: 1.6 }}>
                    {ann.content}
                  </p>
                  <div style={{ fontSize: 12, color: '#5f6368', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>By <strong>{ann.author_name}</strong></span>
                    <span>•</span>
                    <span>{ann.author_dept}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                {canManage(ann) && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => openEdit(ann)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(ann.id)}><Delete fontSize="small" /></IconButton>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editItem ? 'Edit Announcement' : 'Post New Announcement'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Title" fullWidth required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} sx={{ mb: 2 }} />
          <TextField
            label="Content" fullWidth required multiline rows={4} value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })} sx={{ mb: 2 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} label="Category">
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="academic">Academic</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Target</InputLabel>
              <Select value={form.target_role} onChange={e => setForm({ ...form, target_role: e.target.value })} label="Target">
                <MenuItem value="all">Everyone</MenuItem>
                <MenuItem value="student">Students Only</MenuItem>
                <MenuItem value="teacher">Teachers Only</MenuItem>
              </Select>
            </FormControl>
          </div>
          {isAdmin && (
            <FormControlLabel
              control={<Switch checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} />}
              label="Pin this announcement"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : editItem ? 'Update' : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
