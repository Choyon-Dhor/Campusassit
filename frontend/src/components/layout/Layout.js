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
  Assignment, EventNote, Notifications, Search, Menu as MenuIcon,
  Logout, Person, School, ChevronRight, CalendarMonth, DirectionsBus
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/api';

const navItems = [
  { path: '/dashboard',     label: 'Dashboard',        icon: <Dashboard />,    roles: ['student','teacher','admin'] },
  { path: '/announcements', label: 'Announcements',     icon: <Campaign />,     roles: ['student','teacher','admin'] },
  { path: '/routine',       label: 'Class Routine',     icon: <CalendarMonth />,roles: ['student','teacher','admin'] },
  { path: '/classrooms',    label: 'Free Classrooms',   icon: <MeetingRoom />,  roles: ['student','teacher','admin'] },
  { path: '/results',       label: 'Result Portal',     icon: <School />,       roles: ['student','teacher','admin'] },
  { path: '/resources',     label: 'Resources',         icon: <MenuBook />,     roles: ['student','teacher','admin'] },
  { path: '/study-groups',  label: 'Study Groups',      icon: <Group />,        roles: ['student','admin'] },
  { path: '/deadlines',     label: 'Deadlines',         icon: <Assignment />,   roles: ['student','admin'] },
  { path: '/consultations', label: 'Consultations',     icon: <EventNote />,    roles: ['student','teacher','admin'] },
  { path: '/bus',           label: 'Bus Schedule',      icon: <DirectionsBus />,roles: ['student','teacher','admin'] },
];

const roleColors = {
  admin: '#ea4335', teacher: '#34a853', student: '#1a73e8'
};

function SidebarContent({ user, onClose }) {
  return (
    <div style={{ width: 256, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User info */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #dadce0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar sx={{ bgcolor: roleColors[user?.role] || '#1a73e8', width: 40, height: 40 }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#202124', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 12, color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.department || user?.email}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 8px',
              borderRadius: 10, textTransform: 'uppercase',
              background: roleColors[user?.role] + '20',
              color: roleColors[user?.role],
              letterSpacing: '0.5px'
            }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        <div className="ca-nav-section">Navigation</div>
        {navItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `ca-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon" style={{ display: 'flex', color: 'inherit' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #dadce0', fontSize: 11, color: '#9aa0a6', textAlign: 'center' }}>
        CampusAssist v1.0 • 2025
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
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
          <School style={{ fontSize: 28, color: '#1a73e8' }} />
          <span>CampusAssist</span>
        </a>

        {/* Search */}
        <div className="ca-search-bar" style={{ position: 'relative' }}>
          <Search style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: '#5f6368', fontSize: 18
          }} />
          <input
            placeholder="Search resources, courses, groups..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton onClick={e => setNotifAnchor(e.currentTarget)} style={{ position: 'relative' }}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Account">
            <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: roleColors[user?.role], fontSize: 14 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </div>
      </header>

      {/* ── Notification Popover ── */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{ sx: { width: 360, maxHeight: 480, borderRadius: 2 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dadce0' }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Notifications</span>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#5f6368' }}>
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 10).map(n => (
            <MenuItem key={n.id} sx={{ whiteSpace: 'normal', py: 1.5, bgcolor: n.is_read ? 'transparent' : '#e8f0fe' }}>
              <div>
                <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: 13 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#5f6368', marginTop: 2 }}>
                  {n.message?.substring(0, 80)}...
                </div>
              </div>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* ── Profile Menu ── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 220, borderRadius: 2 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #dadce0' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#5f6368' }}>{user?.email}</div>
        </div>
        <MenuItem onClick={() => { setAnchorEl(null); }}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: '#ea4335' }}>
          <ListItemIcon><Logout fontSize="small" sx={{ color: '#ea4335' }} /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>

      {/* ── Sidebar (Desktop) ── */}
      {!isMobile && (
        <aside className="ca-sidebar">
          <SidebarContent user={user} onClose={() => {}} />
        </aside>
      )}

      {/* ── Sidebar (Mobile Drawer) ── */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { top: 0 } }}
      >
        <SidebarContent user={user} onClose={() => setDrawerOpen(false)} />
      </Drawer>

      {/* ── Main Content ── */}
      <main className="ca-main">
        <Outlet />
      </main>
    </div>
  );
}
