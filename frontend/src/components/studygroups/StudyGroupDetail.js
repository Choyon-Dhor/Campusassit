import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Delete,
  Group,
  Login,
  Logout,
  People,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { studyGroupService } from '../../services/api';

const tabSx = {
  textTransform: 'none',
  minHeight: 44,
  fontWeight: 600,
};

function SectionCard({ title, subtitle, action, children }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e8eaed' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" sx={{ color: '#5f6368', mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

export default function StudyGroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [resources, setResources] = useState([]);
  const [activity, setActivity] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [busy, setBusy] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceLink, setResourceLink] = useState('');

  const isMember = Number(group?.is_member) === 1;
  const isCreator = Number(group?.creator_id) === Number(user?.id);
  const canManageGroup = isCreator || isAdmin;
  const isFull = group ? Number(group.member_count) >= Number(group.max_members) : false;

  const memberNames = useMemo(
    () => typingUsers.map((item) => item.user_name).filter(Boolean),
    [typingUsers]
  );

  useEffect(() => {
    if (!id) return;
    loadGroupPage();
  }, [id]);

  useEffect(() => {
    if (!id || !isMember) return undefined;

    const intervalId = window.setInterval(() => {
      loadMessages(id, { silent: true });
    }, 12000);

    return () => window.clearInterval(intervalId);
  }, [id, isMember]);

  const loadGroupPage = async () => {
    setLoading(true);
    try {
      const groupRes = await studyGroupService.getById(id);
      const nextGroup = groupRes.data.group;
      setGroup(nextGroup);

      if (Number(nextGroup?.is_member) === 1) {
        await Promise.all([
          loadMembers(id, { silent: true }),
          loadMessages(id, { silent: true }),
          loadAnnouncements(id, { silent: true }),
          loadResources(id, { silent: true }),
          loadActivity(id, { silent: true }),
        ]);
      } else {
        setMembers([]);
        setMessages([]);
        setAnnouncements([]);
        setResources([]);
        setActivity([]);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load the study group.');
      navigate('/study-groups');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (groupId = id, options = {}) => {
    try {
      const res = await studyGroupService.getMembers(groupId);
      setMembers(res.data.members || []);
    } catch (err) {
      if (!options.silent) toast.error(err.message || 'Failed to load members.');
    }
  };

  const loadMessages = async (groupId = id, options = {}) => {
    try {
      const res = await studyGroupService.getMessages(groupId);
      setMessages(res.data.messages || []);
      setTypingUsers(res.data.typing || []);
    } catch (err) {
      if (!options.silent) toast.error(err.message || 'Failed to load messages.');
    }
  };

  const loadAnnouncements = async (groupId = id, options = {}) => {
    try {
      const res = await studyGroupService.getAnnouncements(groupId);
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      if (!options.silent) toast.error(err.message || 'Failed to load announcements.');
    }
  };

  const loadResources = async (groupId = id, options = {}) => {
    try {
      const res = await studyGroupService.getResources(groupId);
      setResources(res.data.resources || []);
    } catch (err) {
      if (!options.silent) toast.error(err.message || 'Failed to load resources.');
    }
  };

  const loadActivity = async (groupId = id, options = {}) => {
    try {
      const res = await studyGroupService.getActivity(groupId);
      setActivity(res.data.activities || []);
    } catch (err) {
      if (!options.silent) toast.error(err.message || 'Failed to load activity.');
    }
  };

  const refreshMemberData = async (groupId = id) => {
    const groupRes = await studyGroupService.getById(groupId);
    setGroup(groupRes.data.group);
    if (Number(groupRes.data.group?.is_member) === 1) {
      await Promise.all([
        loadMembers(groupId, { silent: true }),
        loadMessages(groupId, { silent: true }),
        loadAnnouncements(groupId, { silent: true }),
        loadResources(groupId, { silent: true }),
        loadActivity(groupId, { silent: true }),
      ]);
    } else {
      setMembers([]);
      setMessages([]);
      setAnnouncements([]);
      setResources([]);
      setActivity([]);
    }
  };

  const handleJoin = async () => {
    setBusy(true);
    try {
      await studyGroupService.join(id);
      toast.success('Joined the group.');
      await refreshMemberData(id);
    } catch (err) {
      toast.error(err.message || 'Could not join the group.');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    setBusy(true);
    try {
      await studyGroupService.leave(id);
      toast.success('Left the group.');
      navigate('/study-groups');
    } catch (err) {
      toast.error(err.message || 'Could not leave the group.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this group?')) return;
    setBusy(true);
    try {
      await studyGroupService.delete(id);
      toast.success('Study group deleted.');
      navigate('/study-groups');
    } catch (err) {
      toast.error(err.message || 'Could not delete the group.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await studyGroupService.postMessage(id, { message: trimmed });
      setMessageText('');
      await Promise.all([
        loadMessages(id, { silent: true }),
        loadActivity(id, { silent: true }),
      ]);
    } catch (err) {
      toast.error(err.message || 'Could not send message.');
    } finally {
      setBusy(false);
    }
  };

  const handlePostAnnouncement = async () => {
    const title = announcementTitle.trim();
    const content = announcementContent.trim();
    if (!title || !content) {
      toast.error('Announcement title and content are required.');
      return;
    }
    setBusy(true);
    try {
      await studyGroupService.postAnnouncement(id, { title, content });
      setAnnouncementTitle('');
      setAnnouncementContent('');
      await Promise.all([
        loadAnnouncements(id, { silent: true }),
        loadActivity(id, { silent: true }),
      ]);
      toast.success('Announcement posted.');
    } catch (err) {
      toast.error(err.message || 'Could not post announcement.');
    } finally {
      setBusy(false);
    }
  };

  const handleShareResource = async () => {
    const title = resourceTitle.trim();
    const link = resourceLink.trim();
    if (!title || !link) {
      toast.error('Resource title and link are required.');
      return;
    }
    setBusy(true);
    try {
      await studyGroupService.postResource(id, {
        title,
        description: resourceDescription.trim(),
        resource_type: 'link',
        resource_url: link,
      });
      setResourceTitle('');
      setResourceDescription('');
      setResourceLink('');
      await Promise.all([
        loadResources(id, { silent: true }),
        loadActivity(id, { silent: true }),
      ]);
      toast.success('Resource shared.');
    } catch (err) {
      toast.error(err.message || 'Could not share resource.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box className="fade-in">
        <Skeleton variant="rounded" height={120} sx={{ mb: 2, borderRadius: 3 }} />
        <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <Box className="fade-in">
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e8eaed' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 420px' }}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/study-groups')} sx={{ mb: 2, px: 0 }}>
              Back to groups
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h4" sx={{ fontSize: { xs: 26, md: 30 }, fontWeight: 800 }}>
                {group.is_private ? 'Private' : 'Open'} Study Group
              </Typography>
              {group.course_code ? <Chip label={group.course_code} size="small" variant="outlined" /> : null}
              {isCreator ? <Chip label="Creator" size="small" sx={{ bgcolor: '#fef7e0', color: '#b06000' }} /> : null}
              {isMember && !isCreator ? <Chip label="Member" size="small" color="success" /> : null}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              <Group sx={{ fontSize: 24, verticalAlign: 'middle', mr: 1, color: '#1a73e8' }} />
              {group.name}
            </Typography>
            {group.description ? (
              <Typography variant="body1" sx={{ color: '#5f6368', maxWidth: 760 }}>
                {group.description}
              </Typography>
            ) : null}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Chip icon={<People />} label={`${group.member_count} / ${group.max_members} members`} />
              {group.meeting_schedule ? <Chip label={group.meeting_schedule} variant="outlined" /> : null}
              <Chip label={`Created ${formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}`} variant="outlined" />
              <Chip label={`By ${group.creator_name || 'Unknown'}`} variant="outlined" />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {!isMember ? (
              <Button
                variant="contained"
                startIcon={<Login />}
                onClick={handleJoin}
                disabled={busy || isFull}
                sx={{ minWidth: 150 }}
              >
                {isFull ? 'Group Full' : 'Join Group'}
              </Button>
            ) : (
              <Button
                color="error"
                variant="outlined"
                startIcon={<Logout />}
                onClick={handleLeave}
                disabled={busy}
              >
                Leave Group
              </Button>
            )}
            {canManageGroup ? (
              <IconButton color="error" onClick={handleDelete} disabled={busy} sx={{ border: '1px solid #f3c7c3' }}>
                <Delete />
              </IconButton>
            ) : null}
          </Box>
        </Box>
      </Paper>

      {!isMember ? (
        <SectionCard
          title="Join to participate"
          subtitle="Members can chat, post announcements, share resources, and view group activity."
        >
          <Typography variant="body2" sx={{ color: '#5f6368', mb: 2 }}>
            You can view the group summary here, but the collaboration tabs unlock after joining.
          </Typography>
          <Button variant="contained" startIcon={<Login />} onClick={handleJoin} disabled={busy || isFull}>
            {isFull ? 'This group is full' : 'Join this group'}
          </Button>
        </SectionCard>
      ) : (
        <Box>
          <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid #e8eaed', overflow: 'hidden' }}>
            <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto">
              <Tab value="members" label="Members" sx={tabSx} />
              <Tab value="chat" label="Chat" sx={tabSx} />
              <Tab value="announcements" label="Announcements" sx={tabSx} />
              <Tab value="resources" label="Resources" sx={tabSx} />
              <Tab value="activity" label="Activity" sx={tabSx} />
            </Tabs>
          </Paper>

          {activeTab === 'members' ? (
            <SectionCard title="Members" subtitle="Who is currently in this study group">
              <Grid container spacing={2}>
                {members.map((member) => (
                  <Grid item xs={12} md={6} key={member.id}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #eef0f2' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: member.is_online ? '#34a853' : '#1a73e8' }}>
                          {member.name?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                            {member.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#5f6368' }}>
                            {member.department || member.email}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9aa0a6' }}>
                            Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {member.role === 'creator' ? <Chip label="Creator" size="small" sx={{ bgcolor: '#fef7e0', color: '#b06000' }} /> : null}
                          <Chip label={member.is_online ? 'Online' : 'Offline'} size="small" color={member.is_online ? 'success' : 'default'} />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </SectionCard>
          ) : null}

          {activeTab === 'chat' ? (
            <SectionCard title="Group Chat" subtitle="Keep the discussion moving with quick updates and questions.">
              <Box sx={{ border: '1px solid #eef0f2', borderRadius: 3, p: 2, maxHeight: 420, overflowY: 'auto', bgcolor: '#fafbfc' }}>
                {messages.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#5f6368', textAlign: 'center', py: 5 }}>
                    No messages yet. Start the conversation.
                  </Typography>
                ) : (
                  messages.map((message) => (
                    <Box key={message.id} sx={{ mb: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{message.user_name || 'Unknown'}</Typography>
                        <Typography variant="caption" sx={{ color: '#9aa0a6' }}>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#202124', whiteSpace: 'pre-wrap' }}>
                        {message.message}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
              {memberNames.length ? (
                <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 1.5 }}>
                  {memberNames.join(', ')} typing...
                </Typography>
              ) : null}
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Write a message for the group"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                />
                <Button variant="contained" onClick={handleSendMessage} disabled={busy || !messageText.trim()}>
                  Send
                </Button>
              </Box>
            </SectionCard>
          ) : null}

          {activeTab === 'announcements' ? (
            <SectionCard title="Announcements" subtitle="Share important updates with the whole group.">
              <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid #eef0f2', bgcolor: '#fafbfc' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Title"
                  value={announcementTitle}
                  onChange={(event) => setAnnouncementTitle(event.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Announcement"
                  value={announcementContent}
                  onChange={(event) => setAnnouncementContent(event.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Button variant="contained" onClick={handlePostAnnouncement} disabled={busy}>
                  Post announcement
                </Button>
              </Paper>
              {announcements.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#5f6368', textAlign: 'center', py: 4 }}>
                  No announcements yet.
                </Typography>
              ) : (
                announcements.map((announcement, index) => (
                  <Box key={announcement.id}>
                    {index > 0 ? <Divider sx={{ my: 2 }} /> : null}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.75 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{announcement.title}</Typography>
                        <Typography variant="caption" sx={{ color: '#5f6368' }}>
                          By {announcement.user_name || 'Unknown'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#9aa0a6' }}>
                        {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {announcement.content}
                    </Typography>
                  </Box>
                ))
              )}
            </SectionCard>
          ) : null}

          {activeTab === 'resources' ? (
            <SectionCard title="Resources" subtitle="Collect links and references that help the group study faster.">
              <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid #eef0f2', bgcolor: '#fafbfc' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Resource title"
                  value={resourceTitle}
                  onChange={(event) => setResourceTitle(event.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Link"
                  value={resourceLink}
                  onChange={(event) => setResourceLink(event.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Description"
                  value={resourceDescription}
                  onChange={(event) => setResourceDescription(event.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Button variant="contained" onClick={handleShareResource} disabled={busy}>
                  Share resource
                </Button>
              </Paper>
              {resources.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#5f6368', textAlign: 'center', py: 4 }}>
                  No resources shared yet.
                </Typography>
              ) : (
                resources.map((resource, index) => (
                  <Box key={resource.id}>
                    {index > 0 ? <Divider sx={{ my: 2 }} /> : null}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{resource.title}</Typography>
                        <Typography variant="body2" sx={{ color: '#5f6368', mt: 0.5 }}>
                          {resource.description || 'No description provided.'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9aa0a6', display: 'block', mt: 0.75 }}>
                          Shared by {resource.user_name || 'Unknown'} {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
                        </Typography>
                      </Box>
                      <Button href={resource.resource_url} target="_blank" rel="noreferrer" variant="outlined" size="small">
                        Open link
                      </Button>
                    </Box>
                  </Box>
                ))
              )}
            </SectionCard>
          ) : null}

          {activeTab === 'activity' ? (
            <SectionCard title="Recent Activity" subtitle="A timeline of the latest actions in this group.">
              {activity.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#5f6368', textAlign: 'center', py: 4 }}>
                  No activity yet.
                </Typography>
              ) : (
                activity.map((item, index) => (
                  <Box key={item.id}>
                    {index > 0 ? <Divider sx={{ my: 2 }} /> : null}
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {item.user_name || 'System'} {String(item.action || '').replace(/_/g, ' ')}
                    </Typography>
                    {item.payload?.title ? (
                      <Typography variant="body2" sx={{ color: '#5f6368', mt: 0.5 }}>
                        {item.payload.title}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" sx={{ color: '#9aa0a6', display: 'block', mt: 0.75 }}>
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </Typography>
                  </Box>
                ))
              )}
            </SectionCard>
          ) : null}
        </Box>
      )}

      {busy ? (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
          <Paper elevation={4} sx={{ px: 2, py: 1.25, borderRadius: 99, display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Updating group...</Typography>
          </Paper>
        </Box>
      ) : null}
    </Box>
  );
}
