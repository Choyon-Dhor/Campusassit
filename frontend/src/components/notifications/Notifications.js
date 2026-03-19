// src/components/notifications/Notifications.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, Button, Chip, IconButton,
  Divider, Skeleton, Alert, Tabs, Tab
} from '@mui/material';
import {
  Notifications as NotifIcon, DoneAll,
  Campaign, Assignment, EventNote, Group,
  MenuBook, CheckCircle, Circle
} from '@mui/icons-material';
import { notificationService } from '../../services/api';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

const typeConfig = {
  announcement: { icon: <Campaign />,  color: '#1a73e8', bg: '#e8f0fe', label: 'Announcement' },
  deadline:     { icon: <Assignment />, color: '#ea4335', bg: '#fce8e6', label: 'Deadline'      },
  consultation: { icon: <EventNote />,  color: '#34a853', bg: '#e6f4ea', label: 'Consultation'  },
  studygroup:   { icon: <Group />,      color: '#fbbc04', bg: '#fef7e0', label: 'Study Group'   },
  resource:     { icon: <MenuBook />,   color: '#9334e8', bg: '#f3e8fd', label: 'Resource'      },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState(0);
  const [markingAll,    setMarkingAll]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch { toast.error('Failed to mark all as read.'); }
    finally { setMarkingAll(false); }
  };

  const filtered = tab === 0
    ? notifications
    : tab === 1
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.is_read);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title">
          <NotifIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />
          Notifications
          {unreadCount > 0 && (
            <Chip
              label={unreadCount}
              size="small"
              color="error"
              sx={{ ml: 1, height: 20, fontSize: 11, fontWeight: 700 }}
            />
          )}
        </h5>
        {unreadCount > 0 && (
          <Button
            variant="outlined" size="small"
            startIcon={markingAll ? null : <DoneAll />}
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? 'Marking…' : 'Mark All Read'}
          </Button>
        )}
      </div>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #dadce0' }}>
        <Tab label={`All (${notifications.length})`} />
        <Tab label={`Unread (${unreadCount})`} />
        <Tab label="Read" />
      </Tabs>

      {loading ? (
        [...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1.5, borderRadius: 2 }} />
        ))
      ) : filtered.length === 0 ? (
        <div className="empty-state ca-card" style={{ padding: 60 }}>
          <NotifIcon sx={{ fontSize: 64, opacity: 0.3 }} />
          <h6>{tab === 1 ? 'No Unread Notifications' : 'No Notifications'}</h6>
          <p>You're all caught up!</p>
        </div>
      ) : (
        filtered.map((n, idx) => {
          const tc = typeConfig[n.type] || typeConfig.announcement;
          return (
            <React.Fragment key={n.id}>
              <div
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '14px 16px',
                  background: n.is_read ? 'white' : '#f0f4ff',
                  cursor: n.is_read ? 'default' : 'pointer',
                  borderLeft: `4px solid ${n.is_read ? '#dadce0' : tc.color}`,
                  transition: 'background 0.15s',
                  borderRadius: idx === 0 ? '8px 8px 0 0' : idx === filtered.length - 1 ? '0 0 8px 8px' : 0,
                }}
                onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = '#e8f0fe'; }}
                onMouseLeave={e => { if (!n.is_read) e.currentTarget.style.background = '#f0f4ff'; }}
              >
                {/* Type icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: tc.bg, color: tc.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {React.cloneElement(tc.icon, { sx: { fontSize: 18 } })}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontWeight: n.is_read ? 500 : 700,
                      fontSize: 14, color: '#202124',
                    }}>
                      {n.title}
                    </span>
                    <Chip
                      label={tc.label}
                      size="small"
                      sx={{ height: 18, fontSize: 10, bgcolor: tc.bg, color: tc.color, fontWeight: 600 }}
                    />
                    {!n.is_read && (
                      <Circle sx={{ fontSize: 8, color: tc.color }} />
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#5f6368', marginTop: 3, lineHeight: 1.5 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 4 }}>
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>

                {/* Read status */}
                <div style={{ flexShrink: 0 }}>
                  {n.is_read
                    ? <CheckCircle sx={{ fontSize: 16, color: '#dadce0' }} />
                    : (
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: tc.color, marginTop: 4,
                      }} />
                    )
                  }
                </div>
              </div>
              {idx < filtered.length - 1 && (
                <Divider sx={{ borderColor: '#f1f3f4' }} />
              )}
            </React.Fragment>
          );
        })
      )}

      {notifications.length > 0 && (
        <div style={{
          marginTop: 16, textAlign: 'center',
          fontSize: 12, color: '#9aa0a6',
        }}>
          Showing {filtered.length} of {notifications.length} notifications
        </div>
      )}
    </div>
  );
}
