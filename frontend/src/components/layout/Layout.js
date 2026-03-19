// ============================================================
// src/components/layout/Layout.js
// ============================================================
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Badge, IconButton, Avatar, Menu, MenuItem, Divider,
  Tooltip, Drawer, useMediaQuery, useTheme, ListItemIcon
} from '@mui/material';
import {
  Dashboard, Campaign, MeetingRoom, MenuBook, Group,
  Assignment, EventNote, Notifications, Search,
  Menu as MenuIcon, Logout, Person, School,
  CalendarMonth, DirectionsBus, ManageAccounts
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/api';

// ── Sidebar navigation items ──────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard',     label: 'Dashboard',      icon: <Dashboard />,     roles: ['student','teacher','admin'] },
      { path: '/announcements', label: 'Announcements',  icon: <Campaign />,      roles: ['student','teacher','admin'] },
    ],
  },
  {
    label: 'Academic',
    items: [
      { path: '/routine',       label: 'Class Routine',  icon: <CalendarMonth />, roles: ['student','teacher','admin'] },
      { path: '/classrooms',    label: 'Free Classrooms',icon: <MeetingRoom />,   roles: ['student','teacher','admin'] },
      { path: '/results',       label: 'Result Portal',  icon: <School />,        roles: ['student','teacher','admin'] },
      { path: '/resources',     label: 'Resources',      icon: <MenuBook />,      roles: ['student','teacher','admin'] },
    ],
  },
  {
    label: 'Student',
    items: [
      { path: '/study-groups',  label: 'Study Groups',   icon: <Group />,         roles: ['student','admin'] },
      { path: '/deadlines',     label: 'Deadlines',      icon: <Assignment />,    roles: ['student','admin'] },
      { path: '/consultations', label: 'Consultations',  icon: <EventNote />,     roles: ['student','teacher','admin'] },
      { path: '/bus',           label: 'Bus Schedule',   icon: <DirectionsBus />, roles: ['student','teacher','admin'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/users', label: 'User Management', icon: <ManageAccounts />, roles: ['admin'] },
    ],
  },
];

const roleColors  = { admin: '#ea4335', teacher: '#34a853', student: '#1a73e8' };
const roleLabels  = { admin: 'Admin', teacher: 'Teacher', student: 'Student' };

// ── Sidebar content (used in both desktop + mobile drawer) ───
function SidebarContent({ user, unreadCount, onClose }) {
  return (
    <div style={{ width: 256, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* User card */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #dadce0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar sx={{
            bgcolor: roleColors[user?.role] || '#1a73e8',
            width: 40, height: 40, fontSize: 16, fontWeight: 700,
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: '#5f6368', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.student_number || user?.email}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 7px',
              borderRadius: 10, textTransform: 'uppercase',
              background: roleColors[user?.role] + '20',
              color: roleColors[user?.role],
              letterSpacing: '0.5px', display: 'inline-block', marginTop: 2,
            }}>
              {roleLabels[user?.role] || user?.role}
            </span>
          </div>
        </div>
        {/* Batch info for students */}
        {user?.batch_number && (
          <div style={{
            marginTop: 8, padding: '4px 8px', background: '#e8f0fe',
            borderRadius: 6, fontSize: 11, color: '#1a73e8', fontWeight: 600,
          }}>
            CSE-{user.batch_number} [{user.batch_section}] · Spring 2026
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '6px 0', overflowY: 'auto' }}>
        {NAV_SECTIONS.map(section => {
          const visible = section.items.filter(item => item.roles.includes(user?.role));
          if (!visible.length) return null;
          return (
            <div key={section.label}>
              <div className="ca-nav-section">{section.label}</div>
              {visible.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `ca-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon" style={{ display: 'flex', color: 'inherit' }}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span style={{
                      marginLeft: 'auto', background: '#ea4335', color: 'white',
                      borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700,
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid #dadce0',
        fontSize: 11, color: '#9aa0a6', textAlign: 'center',
      }}>
        Metropolitan University · CampusAssist v1.0
      </div>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate    = useNavigate();
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [profileAnchor,setProfileAnchor]= useState(null);
  const [notifAnchor,  setNotifAnchor]  = useState(null);
  const [notifications,setNotifications]= useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="ca-layout">

      {/* ── Navbar ── */}
      <header className="ca-navbar">
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(true)} size="small">
            <MenuIcon />
          </IconButton>
        )}

        <a className="brand" href="/dashboard">
          <School style={{ fontSize: 26, color: '#1a73e8' }} />
          <span>CampusAssist</span>
        </a>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Notification bell */}
        <Tooltip title="Notifications">
          <IconButton
            onClick={e => setNotifAnchor(e.currentTarget)}
            style={{ position: 'relative' }}
          >
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Profile avatar */}
        <Tooltip title="Account">
          <IconButton onClick={e => setProfileAnchor(e.currentTarget)}>
            <Avatar sx={{
              width: 32, height: 32,
              bgcolor: roleColors[user?.role] || '#1a73e8',
              fontSize: 14, fontWeight: 700,
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
      </header>

      {/* ── Notification Popover ── */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{ sx: { width: 380, maxHeight: 480, borderRadius: 2 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <div style={{
          padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #dadce0',
        }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8, background: '#ea4335', color: 'white',
                borderRadius: 10, padding: '1px 8px', fontSize: 12,
              }}>
                {unreadCount}
              </span>
            )}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{
                background: 'none', border: 'none', color: '#1a73e8',
                cursor: 'pointer', fontSize: 12, fontWeight: 500,
              }}>
                Mark all read
              </button>
            )}
            <button onClick={() => { setNotifAnchor(null); navigate('/notifications'); }} style={{
              background: 'none', border: 'none', color: '#5f6368',
              cursor: 'pointer', fontSize: 12,
            }}>
              View all
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#5f6368', fontSize: 13 }}>
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 8).map(n => (
            <MenuItem
              key={n.id}
              sx={{
                whiteSpace: 'normal', py: 1.5,
                bgcolor: n.is_read ? 'transparent' : '#e8f0fe',
                borderBottom: '1px solid #f1f3f4',
              }}
              onClick={() => { setNotifAnchor(null); navigate('/notifications'); }}
            >
              <div>
                <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: 13, color: '#202124' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 12, color: '#5f6368', marginTop: 2, lineHeight: 1.4 }}>
                  {n.message?.substring(0, 90)}{n.message?.length > 90 ? '…' : ''}
                </div>
              </div>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* ── Profile Menu ── */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        PaperProps={{ sx: { width: 230, borderRadius: 2 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #dadce0' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#5f6368' }}>{user?.email}</div>
          {user?.student_number && (
            <div style={{ fontSize: 11, color: '#1a73e8', fontFamily: 'monospace', marginTop: 2 }}>
              ID: {user.student_number}
            </div>
          )}
        </div>
        <MenuItem onClick={() => { setProfileAnchor(null); navigate('/profile'); }}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          My Account
        </MenuItem>
        <MenuItem onClick={() => { setProfileAnchor(null); navigate('/notifications'); }}>
          <ListItemIcon>
            <Badge badgeContent={unreadCount || null} color="error">
              <Notifications fontSize="small" />
            </Badge>
          </ListItemIcon>
          Notifications
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: '#ea4335' }}>
          <ListItemIcon><Logout fontSize="small" sx={{ color: '#ea4335' }} /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>

      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <aside className="ca-sidebar">
          <SidebarContent user={user} unreadCount={unreadCount} onClose={() => {}} />
        </aside>
      )}

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { top: 0 } }}
      >
        <SidebarContent user={user} unreadCount={unreadCount} onClose={() => setDrawerOpen(false)} />
      </Drawer>

      {/* ── Page Content ── */}
      <main className="ca-main">
        <Outlet />
      </main>
    </div>
  );
}
