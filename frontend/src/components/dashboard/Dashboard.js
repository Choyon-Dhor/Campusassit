// src/components/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, CardHeader, Chip, LinearProgress, Divider, Button, Skeleton } from '@mui/material';
import {
  People, Campaign, MenuBook, Group, Assignment,
  TrendingUp, Star, GetApp, AccessTime, CheckCircle,
  ArrowForward, EmojiEvents, CalendarMonth, DirectionsBus, School
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { dashboardService, resourceService, announcementService, deadlineService, batchRoutineService, busService } from '../../services/api';
import { formatDistanceToNow, isPast, differenceInDays, differenceInHours } from 'date-fns';

// Countdown helper
function getCountdown(dateStr) {
  const date = new Date(dateStr);
  if (isPast(date)) return { label: 'Overdue', class: 'countdown-urgent' };
  const days = differenceInDays(date, new Date());
  const hours = differenceInHours(date, new Date());
  if (days === 0) return { label: `${hours}h left`, class: 'countdown-urgent' };
  if (days <= 2) return { label: `${days}d left`, class: 'countdown-urgent' };
  if (days <= 5) return { label: `${days}d left`, class: 'countdown-warning' };
  return { label: `${days}d left`, class: 'countdown-ok' };
}

const priorityColor = { high: '#ea4335', medium: '#fbbc04', low: '#34a853' };
const typeIcons = { notes: '📝', question_paper: '📋', assignment: '📄', reference: '📚', other: '📁' };

export default function Dashboard() {
  const { user, isAdmin, isTeacherOrAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [nextBuses, setNextBuses] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, annRes] = await Promise.all([
        dashboardService.getStats(),
        announcementService.getAll({ page: 1, limit: 3 }),
      ]);
      setStats(statsRes.data.stats);
      setDeadlines(statsRes.data.upcomingDeadlines || []);
      setAnnouncements(annRes.data.announcements || []);

      const recRes = await resourceService.getRecommendations({ limit: 4, department: user?.department });
      setRecommendations(recRes.data.resources || []);

      // Load today's classes if student has batch info
      if (user?.batch_number && user?.batch_section) {
        try {
          const routineRes = await batchRoutineService.getTodayClasses(user.batch_number, user.batch_section);
          setTodayClasses(routineRes.data.classes || []);
        } catch {}
      }
      // Load next buses
      try {
        const busRes = await busService.getNextBuses();
        setNextBuses(busRes.data.nextBuses || []);
      } catch {}
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: <People />, color: '#1a73e8', bg: '#e8f0fe' },
    { label: 'Announcements', value: stats?.totalAnnouncements, icon: <Campaign />, color: '#34a853', bg: '#e6f4ea' },
    { label: 'Resources', value: stats?.totalResources, icon: <MenuBook />, color: '#ea4335', bg: '#fce8e6' },
    { label: 'Study Groups', value: stats?.totalStudyGroups, icon: <Group />, color: '#fbbc04', bg: '#fef7e0' },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: '1.6rem', margin: 0, color: '#202124' }}>
          Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </h4>
        <p style={{ color: '#5f6368', margin: '4px 0 0', fontSize: 14 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Grid container spacing={3}>
        {/* Stat Cards */}
        {statCards.map((s, i) => (
          <Grid item xs={12} sm={6} lg={3} key={i}>
            {loading ? (
              <Skeleton variant="rounded" height={100} />
            ) : (
              <div className="stat-card">
                <div className="stat-icon" style={{ background: s.bg }}>
                  <span style={{ color: s.color, display: 'flex' }}>{s.icon}</span>
                </div>
                <div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value ?? '—'}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            )}
          </Grid>
        ))}

        {/* Upcoming Deadlines */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title="Upcoming Deadlines"
              titleTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
              action={
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/deadlines')}>
                  View All
                </Button>
              }
              sx={{ pb: 0 }}
            />
            <CardContent>
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />)
              ) : deadlines.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <CheckCircle sx={{ fontSize: 48, color: '#34a853', opacity: 0.6 }} />
                  <p style={{ margin: '8px 0 0', color: '#5f6368', fontSize: 14 }}>No upcoming deadlines!</p>
                </div>
              ) : (
                deadlines.map(d => {
                  const cd = getCountdown(d.deadline_date);
                  return (
                    <div key={d.id} className={`deadline-card ca-card mb-2 ${d.priority}`} style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#202124', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#5f6368', marginTop: 2 }}>
                            {d.course_code && <span style={{ marginRight: 6 }}>{d.course_code}</span>}
                            {d.type}
                          </div>
                        </div>
                        <span className={cd.class} style={{ fontSize: 12, whiteSpace: 'nowrap', marginLeft: 8 }}>
                          {cd.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Announcements */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title="Recent Announcements"
              titleTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
              action={
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/announcements')}>
                  View All
                </Button>
              }
              sx={{ pb: 0 }}
            />
            <CardContent>
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1.5 }} />)
              ) : announcements.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <p style={{ color: '#5f6368', fontSize: 14 }}>No announcements yet.</p>
                </div>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} className={`announcement-card ca-card mb-2 ${ann.category}`} style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{ann.title}</div>
                        <div style={{ fontSize: 12, color: '#5f6368', marginTop: 2 }}>
                          By {ann.author_name} • {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <Chip label={ann.category} size="small" sx={{ fontSize: 10, height: 20 }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Classes */}
        {todayClasses.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader
                title={<span><CalendarMonth sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8', fontSize: 20 }} />Today's Classes</span>}
                subheader={`${user?.batch_number ? `CSE-${user.batch_number} [${user.batch_section}]` : ''} · ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`}
                titleTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
                action={<Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/routine')}>Routine</Button>}
                sx={{ pb: 0 }}
              />
              <CardContent>
                {todayClasses.map((cls, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: i < todayClasses.length - 1 ? '1px solid #f1f3f4' : 'none'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{cls.course_code}</div>
                      <div style={{ fontSize: 12, color: '#5f6368' }}>{cls.course_name?.substring(0,35)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a73e8' }}>
                        {cls.start_time?.slice(0,5)} – {cls.end_time?.slice(0,5)}
                      </div>
                      <div style={{ fontSize: 11, color: '#5f6368' }}>Room {cls.room_name}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Next Buses */}
        {nextBuses.length > 0 && (
          <Grid item xs={12} md={todayClasses.length > 0 ? 6 : 4}>
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader
                title={<span><DirectionsBus sx={{ mr: 1, verticalAlign: 'middle', color: '#34a853', fontSize: 20 }} />Next Buses</span>}
                subheader="Departing within 2 hours"
                titleTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
                action={<Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/bus')}>Schedule</Button>}
                sx={{ pb: 0 }}
              />
              <CardContent>
                {nextBuses.slice(0, 4).map((bus, i) => {
                  const [h, m] = (bus.departure_time || '').slice(0,5).split(':').map(Number);
                  const ampm = h >= 12 ? 'PM' : 'AM';
                  const h12 = h % 12 || 12;
                  const dirColor = bus.direction === 'to_campus' ? '#34a853' : bus.direction === 'from_campus' ? '#ea4335' : '#1a73e8';
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', borderBottom: i < Math.min(nextBuses.length, 4) - 1 ? '1px solid #f1f3f4' : 'none'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {bus.short_name || bus.route_name?.substring(0, 40)}
                        </div>
                        <div style={{ fontSize: 11, color: '#5f6368' }}>Bus: {bus.bus_number}</div>
                      </div>
                      <div style={{ background: dirColor + '20', color: dirColor, borderRadius: 10, padding: '3px 10px', fontWeight: 700, fontSize: 13, flexShrink: 0, marginLeft: 8 }}>
                        {h12}:{String(m).padStart(2,'0')} {ampm}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Smart Recommendations */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title={<span><EmojiEvents sx={{ color: '#fbbc04', mr: 1, verticalAlign: 'middle' }} />Smart Recommendations</span>}
              subheader="Top resources based on downloads, ratings & recency"
              titleTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
              action={
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/resources')}>
                  All Resources
                </Button>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                      <Skeleton variant="rounded" height={140} />
                    </Grid>
                  ))
                ) : recommendations.length === 0 ? (
                  <Grid item xs={12}>
                    <div className="empty-state" style={{ padding: '24px 0' }}>
                      <p>No resources available yet.</p>
                    </div>
                  </Grid>
                ) : (
                  recommendations.map(r => (
                    <Grid item xs={12} sm={6} md={3} key={r.id}>
                      <div className="ca-card resource-card" style={{ padding: 16, height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 28 }}>{typeIcons[r.file_type] || '📁'}</div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#202124', lineHeight: 1.4 }}>
                          {r.title.length > 50 ? r.title.substring(0, 50) + '...' : r.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#5f6368' }}>
                          {r.course_code && <span style={{ marginRight: 4 }}>{r.course_code}</span>}
                          {r.department}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 'auto', fontSize: 12, color: '#5f6368' }}>
                          <span title="Downloads"><GetApp sx={{ fontSize: 14 }} /> {r.download_count}</span>
                          <span title="Rating"><Star sx={{ fontSize: 14, color: '#fbbc04' }} /> {parseFloat(r.average_rating).toFixed(1)}</span>
                          <span style={{ marginLeft: 'auto', color: '#1a73e8', fontWeight: 600 }}>
                            {parseFloat(r.recommendation_score).toFixed(2)}
                          </span>
                        </div>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, parseFloat(r.recommendation_score) * 20)}
                          sx={{ borderRadius: 2, height: 4, bgcolor: '#e8f0fe', '& .MuiLinearProgress-bar': { bgcolor: '#1a73e8' } }}
                        />
                      </div>
                    </Grid>
                  ))
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
