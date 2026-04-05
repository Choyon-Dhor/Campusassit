// src/components/studygroups/StudyGroups.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Avatar, AvatarGroup, IconButton,
  Switch, FormControlLabel, CircularProgress, Skeleton, Tooltip,
  Tabs, Tab
} from '@mui/material';
import { Add, Group, Login, Logout as LeaveIcon, People, Delete } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { studyGroupService } from '../../services/api';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

export default function StudyGroups() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedTab, setSelectedTab] = useState('members');
  const [chatMessages, setChatMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [resources, setResources] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceDescription, setNewResourceDescription] = useState('');
  const [newResourceLink, setNewResourceLink] = useState('');
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

  const handleSendMessage = async () => {
    if (!selectedGroup || !newMessage.trim()) return;
    try {
      await studyGroupService.postMessage(selectedGroup.id, { message: newMessage.trim() });
      setNewMessage('');
      await fetchMessages(selectedGroup.id);
      await fetchActivity(selectedGroup.id);
    } catch (err) {
      toast.error(err.message || 'Could not send message.');
    }
  };

  const handlePostAnnouncement = async () => {
    if (!selectedGroup || !newAnnTitle.trim() || !newAnnContent.trim()) {
      toast.error('Enter title and content for announcement.');
      return;
    }
    try {
      await studyGroupService.postAnnouncement(selectedGroup.id, { title: newAnnTitle.trim(), content: newAnnContent.trim() });
      setNewAnnTitle('');
      setNewAnnContent('');
      await fetchAnnouncements(selectedGroup.id);
      await fetchActivity(selectedGroup.id);
      toast.success('Announcement posted');
    } catch (err) {
      toast.error(err.message || 'Could not post announcement.');
    }
  };

  const handleLeave = async (id) => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await studyGroupService.leave(id);
      toast.success('Left the group.');
      if (selectedGroup && selectedGroup.id === id) {
        setMembersOpen(false);
      }
      loadGroups();
      if (selectedGroup && selectedGroup.id === id) setActivity([]);
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

  const fetchMessages = async (groupId) => {
    try {
      const res = await studyGroupService.getMessages(groupId);
      setChatMessages(res.data.messages || []);
    } catch { toast.error('Failed to load chat messages'); }
  };

  const fetchAnnouncements = async (groupId) => {
    try {
      const res = await studyGroupService.getAnnouncements(groupId);
      setAnnouncements(res.data.announcements || []);
    } catch { toast.error('Failed to load announcements'); }
  };

  const fetchResources = async (groupId) => {
    try {
      const res = await studyGroupService.getResources(groupId);
      setResources(res.data.resources || []);
    } catch { toast.error('Failed to load resources'); }
  };

  const handleAddResource = async () => {
    if (!selectedGroup) return;
    if (!newResourceTitle.trim() || !newResourceLink.trim()) {
      toast.error('Resource title and link are required.');
      return;
    }
    try {
      await studyGroupService.postResource(selectedGroup.id, {
        title: newResourceTitle.trim(),
        description: newResourceDescription.trim(),
        resource_type: 'link',
        resource_url: newResourceLink.trim(),
      });
      setNewResourceTitle('');
      setNewResourceDescription('');
      setNewResourceLink('');
      await fetchResources(selectedGroup.id);
      await fetchActivity(selectedGroup.id);
      toast.success('Resource shared successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to share resource.');
    }
  };

  const viewMembers = async (group) => {
    navigate(`/study-groups/${group.id}`);
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
                      Open
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
      <Dialog open={membersOpen} onClose={() => setMembersOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {selectedGroup?.name} — {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
        </DialogTitle>
        <DialogContent dividers>
          <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} variant="fullWidth" textColor="primary" indicatorColor="primary">
            <Tab value="members" label="Members" />
            <Tab value="chat" label="Chat" />
            <Tab value="announcements" label="Announcements" />
            <Tab value="resources" label="Resources" />
            <Tab value="activity" label="Activity" />
          </Tabs>
          <div style={{ marginTop: 16 }}>
            {selectedTab === 'members' && (
              <div>
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
              </div>
            )}

            {selectedTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ maxHeight: 300, overflowY: 'auto', padding: 8, border: '1px solid #e0e0e0', borderRadius: 8 }}>
                  {chatMessages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#5f6368' }}>No messages yet. Start the conversation!</p>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5f6368' }}>
                          <span>{msg.user_name || 'Unknown'}</span>
                          <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                        </div>
                        <div style={{ marginTop: 2, fontSize: 14 }}>{msg.message}</div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <TextField
                    multiline
                    minRows={2}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    fullWidth
                    size="small"
                  />
                  <Button variant="contained" onClick={handleSendMessage} sx={{ minWidth: 90 }}>Send</Button>
                </div>
              </div>
            )}

            {selectedTab === 'announcements' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 10 }}>
                  <TextField
                    label="Title"
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Content"
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Button variant="contained" onClick={handlePostAnnouncement}>
                    Post Announcement
                  </Button>
                </div>
                {announcements.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#5f6368' }}>No announcements yet.</p>
                ) : (
                  announcements.map(a => (
                    <div key={a.id} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <strong>{a.title}</strong>
                        <span style={{ fontSize: 10, color: '#5f6368' }}>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                      </div>
                      <div style={{ fontSize: 13 }}>{a.content}</div>
                      <div style={{ marginTop: 6, fontSize: 10, color: '#5f6368' }}>By {a.user_name}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedTab === 'resources' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 10 }}>
                  <TextField
                    label="Resource Title"
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Description"
                    value={newResourceDescription}
                    onChange={(e) => setNewResourceDescription(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    label="URL"
                    value={newResourceLink}
                    onChange={(e) => setNewResourceLink(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                    placeholder="https://example.com/resource"
                  />
                  <Button variant="contained" onClick={handleAddResource}>Share Resource</Button>
                </div>
                {resources.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#5f6368' }}>No resources shared yet.</p>
                ) : (
                  resources.map(r => (
                    <div key={r.id} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <strong>{r.title}</strong>
                          <div style={{ fontSize: 12, color: '#5f6368' }}>{r.user_name}</div>
                        </div>
                        <Button href={r.resource_url} target="_blank" size="small" variant="outlined">Open Link</Button>
                      </div>
                      {r.description && <div style={{ fontSize: 13, marginBottom: 6 }}>{r.description}</div>}
                      <div style={{ fontSize: 10, color: '#9aa0a6' }}>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedTab === 'activity' && (
              <div>
                {activity.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#5f6368' }}>No activity yet.</p>
                ) : (
                  activity.map(item => (
                    <div key={item.id} style={{ padding: 8, borderBottom: '1px solid #f1f3f4', fontSize: 13 }}>
                      <div style={{ color: '#5f6368' }}>
                        {item.user_name || 'System'} {item.action.replace('_', ' ')}
                      </div>
                      {item.payload && item.payload.title && (
                        <div style={{ fontSize: 12, color: '#5f6368' }}>"{item.payload.title}"</div>
                      )}
                      <div style={{ fontSize: 10, color: '#9aa0a6' }}>
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
