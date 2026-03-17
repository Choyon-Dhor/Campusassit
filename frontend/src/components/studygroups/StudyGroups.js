// src/components/studygroups/StudyGroups.js
import React, { useState, useEffect } from 'react';
import {
  Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Avatar, AvatarGroup, IconButton,
  Switch, FormControlLabel, CircularProgress, Skeleton, Tooltip
} from '@mui/material';
import { Add, Group, Login, Logout as LeaveIcon, People, Delete } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { studyGroupService } from '../../services/api';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

export default function StudyGroups() {
  const { user, isAdmin } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', course_code: '', course_name: '', max_members: 10, is_private: false, meeting_schedule: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await studyGroupService.getAll();
      setGroups(res.data.groups || []);
    } catch { toast.error('Failed to load study groups'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Group name required.');
    setSaving(true);
    try {
      await studyGroupService.create(form);
      toast.success('Study group created!');
      setOpen(false);
      setForm({ name: '', description: '', course_code: '', course_name: '', max_members: 10, is_private: false, meeting_schedule: '' });
      loadGroups();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleJoin = async (id) => {
    try {
      await studyGroupService.join(id);
      toast.success('Joined the group!');
      loadGroups();
    } catch (err) { toast.error(err.message); }
  };

  const handleLeave = async (id) => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await studyGroupService.leave(id);
      toast.success('Left the group.');
      loadGroups();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this group?')) return;
    try {
      await studyGroupService.delete(id);
      toast.success('Group deleted.');
      loadGroups();
    } catch (err) { toast.error(err.message); }
  };

  const viewMembers = async (group) => {
    setSelectedGroup(group);
    try {
      const res = await studyGroupService.getMembers(group.id);
      setMembers(res.data.members || []);
      setMembersOpen(true);
    } catch { toast.error('Failed to load members'); }
  };

  const roleColors = { admin: '#ea4335', teacher: '#34a853', student: '#1a73e8' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title"><Group sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />Study Groups</h5>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ borderRadius: 8 }}>
          Create Group
        </Button>
      </div>

      {loading ? (
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={200} /></Grid>)}
        </Grid>
      ) : groups.length === 0 ? (
        <div className="empty-state ca-card" style={{ padding: 60 }}>
          <Group sx={{ fontSize: 64, opacity: 0.3 }} />
          <h6>No Study Groups Yet</h6>
          <p>Create a study group and invite your peers to collaborate!</p>
        </div>
      ) : (
        <Grid container spacing={2}>
          {groups.map(g => {
            const isMember = g.is_member === 1;
            const isCreator = g.creator_id === user?.id;
            const isFull = g.member_count >= g.max_members;
            return (
              <Grid item xs={12} sm={6} md={4} key={g.id}>
                <div className="ca-card" style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h6 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#202124' }}>
                        {g.is_private && '🔒 '}{g.name}
                      </h6>
                      {g.course_code && (
                        <Chip label={g.course_code} size="small" variant="outlined"
                          sx={{ mt: 0.5, height: 20, fontSize: 10 }} />
                      )}
                    </div>
                    {(isCreator || isAdmin) && (
                      <IconButton size="small" color="error" onClick={() => handleDelete(g.id)}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </div>

                  {g.description && (
                    <p style={{ margin: 0, fontSize: 13, color: '#5f6368', lineHeight: 1.5 }}>
                      {g.description.substring(0, 100)}{g.description.length > 100 ? '...' : ''}
                    </p>
                  )}

                  {g.meeting_schedule && (
                    <div style={{ fontSize: 12, color: '#1a73e8', fontWeight: 500 }}>
                      📅 {g.meeting_schedule}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div style={{ fontSize: 12, color: '#5f6368' }}>
                      <People sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                      {g.member_count} / {g.max_members} members
                      {isFull && <span style={{ color: '#ea4335', marginLeft: 4 }}>Full</span>}
                    </div>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => viewMembers(g)}
                      sx={{ fontSize: 11, borderRadius: 6 }}
                    >
                      Members
                    </Button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#9aa0a6' }}>
                      By {g.creator_name} • {formatDistanceToNow(new Date(g.created_at), { addSuffix: true })}
                    </div>
                    {!isCreator && (
                      isMember ? (
                        <Button size="small" color="error" startIcon={<LeaveIcon />}
                          onClick={() => handleLeave(g.id)} sx={{ fontSize: 11 }}>
                          Leave
                        </Button>
                      ) : (
                        <Button size="small" variant="contained" startIcon={<Login />}
                          onClick={() => handleJoin(g.id)} disabled={isFull}
                          sx={{ fontSize: 11, borderRadius: 6 }}>
                          Join
                        </Button>
                      )
                    )}
                  </div>
                  {isMember && !isCreator && (
                    <Chip label="✓ Member" size="small" color="success" sx={{ height: 20, fontSize: 10 }} />
                  )}
                  {isCreator && (
                    <Chip label="👑 Creator" size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#fef7e0', color: '#e37400' }} />
                  )}
                </div>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Create Study Group</DialogTitle>
        <DialogContent dividers>
          <TextField label="Group Name" fullWidth required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} sx={{ mb: 2 }} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} sx={{ mb: 2 }} />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField size="small" label="Course Code" fullWidth value={form.course_code}
                onChange={e => setForm({ ...form, course_code: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" label="Max Members" type="number" fullWidth
                value={form.max_members} inputProps={{ min: 2, max: 50 }}
                onChange={e => setForm({ ...form, max_members: parseInt(e.target.value) })} />
            </Grid>
          </Grid>
          <TextField label="Meeting Schedule" fullWidth value={form.meeting_schedule}
            onChange={e => setForm({ ...form, meeting_schedule: e.target.value })}
            placeholder="e.g. Every Saturday 3PM" sx={{ mb: 2 }} />
          <FormControlLabel
            control={<Switch checked={form.is_private} onChange={e => setForm({ ...form, is_private: e.target.checked })} />}
            label="Private Group"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={membersOpen} onClose={() => setMembersOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {selectedGroup?.name} — Members
        </DialogTitle>
        <DialogContent dividers>
          {members.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#5f6368' }}>No members yet.</p>
          ) : (
            members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f3f4' }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: roleColors[m.role] || '#1a73e8', fontSize: 14 }}>
                  {m.name?.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: '#5f6368' }}>{m.department}</div>
                </div>
                {m.role === 'creator' && (
                  <Chip label="Creator" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#fef7e0', color: '#e37400' }} />
                )}
              </div>
            ))
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setMembersOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </div>
  );
}
