// src/components/resources/Resources.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip,
  IconButton, Tabs, Tab, Tooltip, CircularProgress, Skeleton, Alert
} from '@mui/material';
import {
  CloudUpload, GetApp, Delete, Star, StarBorder,
  MenuBook, FilterList, EmojiEvents, Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { resourceService } from '../../services/api';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

const FILE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'notes', label: '📝 Notes', color: '#e8f0fe' },
  { value: 'question_paper', label: '📋 Question Papers', color: '#fce8e6' },
  { value: 'assignment', label: '📄 Assignments', color: '#fef7e0' },
  { value: 'reference', label: '📚 References', color: '#e6f4ea' },
  { value: 'other', label: '📁 Other', color: '#f3e8fd' },
];

const SORT_OPTIONS = [
  { value: 'recommended', label: '⭐ Recommended' },
  { value: 'newest', label: '🆕 Newest' },
  { value: 'downloads', label: '📥 Most Downloaded' },
  { value: 'rating', label: '⭐ Top Rated' },
];

function StarRating({ value, onChange, readonly }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating" style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className={`star ${s <= (hover || value) ? 'filled' : ''}`}
          onClick={() => !readonly && onChange && onChange(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{ cursor: readonly ? 'default' : 'pointer' }}
        >★</span>
      ))}
    </div>
  );
}

function ResourceCard({ resource, onDownload, onRate, onDelete, userId, isAdmin }) {
  const [myRating, setMyRating] = useState(0);

  const handleRate = async (rating) => {
    setMyRating(rating);
    await onRate(resource.id, rating);
  };

  const ft = FILE_TYPES.find(f => f.value === resource.file_type) || FILE_TYPES[FILE_TYPES.length - 1];

  return (
    <div className="ca-card resource-card" style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Chip label={ft.label} size="small"
          sx={{ bgcolor: ft.color, fontSize: 11, fontWeight: 600, height: 22 }} />
        {(resource.uploader_id === userId || isAdmin) && (
          <IconButton size="small" color="error" onClick={() => onDelete(resource.id)}>
            <Delete sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </div>

      <div>
        <h6 style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#202124', lineHeight: 1.4 }}>
          {resource.title}
        </h6>
        {resource.description && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5f6368', lineHeight: 1.4 }}>
            {resource.description.substring(0, 80)}{resource.description.length > 80 ? '...' : ''}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {resource.course_code && <Chip label={resource.course_code} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />}
        {resource.department && <Chip label={resource.department} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />}
        {resource.semester && <Chip label={resource.semester + ' sem'} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />}
      </div>

      <div style={{ fontSize: 12, color: '#5f6368' }}>
        By <strong>{resource.uploader_name}</strong> • {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <div>
          <StarRating value={parseFloat(resource.average_rating)} onChange={handleRate} />
          <span style={{ fontSize: 11, color: '#5f6368', marginLeft: 4 }}>
            {parseFloat(resource.average_rating).toFixed(1)} ({resource.download_count} ↓)
          </span>
        </div>
        <Tooltip title="Download">
          <Button
            variant="contained" size="small" startIcon={<GetApp />}
            onClick={() => onDownload(resource)}
            sx={{ borderRadius: 6, fontSize: 11 }}
          >
            Download
          </Button>
        </Tooltip>
      </div>

      {resource.recommendation_score > 0 && (
        <div style={{ fontSize: 11, color: '#1a73e8', fontWeight: 600 }}>
          <EmojiEvents sx={{ fontSize: 12, mr: 0.5 }} />
          Score: {parseFloat(resource.recommendation_score).toFixed(2)}
        </div>
      )}
    </div>
  );
}

export default function Resources() {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState(0);
  const [resources, setResources] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ file_type: '', search: '', sort: 'recommended' });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', file_type: 'notes', course_code: '', course_name: '', semester: '', department: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const [res, recRes] = await Promise.all([
        resourceService.getAll(filters),
        resourceService.getRecommendations({ limit: 4, department: user?.department }),
      ]);
      setResources(res.data.resources || []);
      setRecommendations(recRes.data.resources || []);
    } catch { toast.error('Failed to load resources'); }
    finally { setLoading(false); }
  }, [filters, user?.department]);

  useEffect(() => { loadResources(); }, [loadResources]);

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file.');
    if (!form.title.trim()) return toast.error('Title is required.');
    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
    try {
      await resourceService.upload(formData);
      toast.success('Resource uploaded!');
      setOpen(false);
      setFile(null);
      setForm({ title: '', description: '', file_type: 'notes', course_code: '', course_name: '', semester: '', department: '' });
      loadResources();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDownload = async (resource) => {
    try {
      const res = await resourceService.download(resource.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = resource.title; a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch { toast.error('Download failed'); }
  };

  const handleRate = async (id, rating) => {
    try {
      await resourceService.rate(id, rating);
      toast.success('Rating saved!');
    } catch { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await resourceService.delete(id);
      toast.success('Deleted.');
      loadResources();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title"><MenuBook sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />Resource Repository</h5>
        <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setOpen(true)} sx={{ borderRadius: 8 }}>
          Upload Resource
        </Button>
      </div>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #dadce0' }}>
        <Tab label="All Resources" />
        <Tab label={<span><EmojiEvents sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: '#fbbc04' }} />Smart Recommendations</span>} />
      </Tabs>

      {tab === 0 && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <SearchIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#5f6368', fontSize: 18 }} />
              <input
                placeholder="Search resources..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #dadce0', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select value={filters.file_type} onChange={e => setFilters({ ...filters, file_type: e.target.value })} label="Type">
                {FILE_TYPES.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })} label="Sort By">
                {SORT_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
          </div>

          {loading ? (
            <Grid container spacing={2}>
              {[...Array(8)].map((_, i) => <Grid item xs={12} sm={6} md={4} lg={3} key={i}><Skeleton variant="rounded" height={200} /></Grid>)}
            </Grid>
          ) : resources.length === 0 ? (
            <div className="empty-state ca-card" style={{ padding: 60 }}>
              <MenuBook sx={{ fontSize: 64, opacity: 0.3 }} />
              <h6>No Resources Found</h6>
              <p>Be the first to upload a resource for your peers.</p>
            </div>
          ) : (
            <Grid container spacing={2}>
              {resources.map(r => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={r.id}>
                  <ResourceCard resource={r} onDownload={handleDownload} onRate={handleRate}
                    onDelete={handleDelete} userId={user?.id} isAdmin={isAdmin} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <Alert severity="info" icon={<EmojiEvents />} sx={{ mb: 2, borderRadius: 2 }}>
            Resources are ranked by: <strong>Downloads (50%) + Rating (30%) + Recency (20%)</strong>
          </Alert>
          {loading ? (
            <Grid container spacing={2}>
              {[...Array(4)].map((_, i) => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={220} /></Grid>)}
            </Grid>
          ) : (
            <Grid container spacing={2}>
              {recommendations.map((r, i) => (
                <Grid item xs={12} sm={6} md={3} key={r.id}>
                  <div style={{ position: 'relative' }}>
                    {i < 3 && (
                      <div style={{
                        position: 'absolute', top: -8, left: -8, zIndex: 1,
                        background: ['#fbbc04','#9aa0a6','#cd7f32'][i],
                        color: 'white', borderRadius: '50%', width: 28, height: 28,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>#{i+1}</div>
                    )}
                    <ResourceCard resource={r} onDownload={handleDownload} onRate={handleRate}
                      onDelete={handleDelete} userId={user?.id} isAdmin={isAdmin} />
                  </div>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Upload Resource</DialogTitle>
        <DialogContent dividers>
          <TextField label="Title" fullWidth required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} sx={{ mb: 2 }} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} sx={{ mb: 2 }} />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={form.file_type} onChange={e => setForm({ ...form, file_type: e.target.value })} label="Type">
                  {FILE_TYPES.slice(1).map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" label="Course Code" fullWidth value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" label="Course Name" fullWidth value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })} />
            </Grid>
            <Grid item xs={3}>
              <TextField size="small" label="Semester" fullWidth value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} />
            </Grid>
            <Grid item xs={3}>
              <TextField size="small" label="Department" fullWidth value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </Grid>
          </Grid>
          <div style={{ border: '2px dashed #dadce0', borderRadius: 8, padding: 20, textAlign: 'center' }}>
            <input type="file" id="resource-file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
            <label htmlFor="resource-file" style={{ cursor: 'pointer' }}>
              <CloudUpload sx={{ fontSize: 36, color: '#1a73e8' }} />
              <div style={{ fontSize: 14, color: '#5f6368', marginTop: 8 }}>
                {file ? <strong style={{ color: '#1a73e8' }}>{file.name}</strong> : 'Click to choose file (PDF, DOC, PPT, etc.)'}
              </div>
            </label>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={saving || !file}>
            {saving ? <CircularProgress size={18} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
