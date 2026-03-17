// src/components/bus/BusSchedule.js
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Chip, Button, TextField,
  Tabs, Tab, Select, MenuItem, FormControl, InputLabel,
  Skeleton, Alert, Divider
} from '@mui/material';
import {
  DirectionsBus, AccessTime, Place, ArrowForward,
  NorthEast, SouthWest, SwapHoriz, Search as SearchIcon
} from '@mui/icons-material';
import { busService } from '../../services/api';
import { toast } from 'react-toastify';

const directionConfig = {
  to_campus:   { label: 'To Campus',    icon: <NorthEast />,  color: '#34a853', bg: '#e6f4ea' },
  from_campus: { label: 'From Campus',  icon: <SouthWest />, color: '#ea4335', bg: '#fce8e6' },
  shuttle:     { label: 'Shuttle',      icon: <SwapHoriz />, color: '#1a73e8', bg: '#e8f0fe' },
};

function TimelineBus({ route }) {
  const dc = directionConfig[route.direction] || directionConfig.to_campus;
  const stops = Array.isArray(route.stops) ? route.stops.filter(s => s && s.stop_name) : [];
  return (
    <div className="ca-card" style={{ padding: '16px 20px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <Chip
              icon={<span style={{ display:'flex', color: dc.color }}>{dc.icon}</span>}
              label={dc.label}
              size="small"
              sx={{ bgcolor: dc.bg, color: dc.color, fontWeight: 700, height: 24, fontSize: 11 }}
            />
            <span style={{ fontWeight: 600, fontSize: 14, color: '#202124' }}>
              {route.short_name || route.route_name.substring(0, 60)}
            </span>
            {route.bus_number && (
              <Chip label={`Bus: ${route.bus_number}`} size="small" variant="outlined"
                sx={{ height: 20, fontSize: 10 }} />
            )}
            {route.passenger_type === 'teacher' && (
              <Chip label="Teacher" size="small"
                sx={{ height: 20, fontSize: 10, bgcolor: '#fef7e0', color: '#e37400' }} />
            )}
          </div>

          {/* Stop timeline */}
          {stops.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', margin: '8px 0' }}>
              {stops.map((s, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i === 0 ? dc.color : i === stops.length - 1 ? '#ea4335' : '#dadce0',
                      flexShrink: 0
                    }} />
                    <span style={{ fontSize: 11, color: '#3c4043', whiteSpace: 'nowrap' }}>
                      {s.stop_name}
                    </span>
                  </div>
                  {i < stops.length - 1 && (
                    <ArrowForward sx={{ fontSize: 12, color: '#9aa0a6', flexShrink: 0 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {route.schedule_note && (
            <div style={{ fontSize: 11, color: '#5f6368', fontStyle: 'italic', marginTop: 4 }}>
              ℹ️ {route.schedule_note}
            </div>
          )}

          <div style={{ fontSize: 12, color: '#5f6368', marginTop: 6 }}>
            {route.driver_name && <span>Driver: <strong>{route.driver_name}</strong> · </span>}
            Capacity: Students
          </div>
        </div>

        {/* Time box */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          {route.departure_time && (
            <div style={{
              background: dc.bg, color: dc.color, borderRadius: 10,
              padding: '6px 14px', fontWeight: 700, fontSize: 16
            }}>
              <AccessTime sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {formatTime(route.departure_time)}
            </div>
          )}
          {route.arrival_time && route.arrival_time !== route.departure_time && (
            <div style={{ fontSize: 11, color: '#5f6368', marginTop: 3 }}>
              Arrives: {formatTime(route.arrival_time)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

export default function BusSchedule() {
  const [tab, setTab] = useState(0);
  const [schedule, setSchedule] = useState({ to_campus: [], from_campus: [], shuttle: [] });
  const [nextBuses, setNextBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    loadSchedule();
    loadNext();
    const tick = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    return () => clearInterval(tick);
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await busService.getSchedule();
      setSchedule(res.data.schedule || { to_campus: [], from_campus: [], shuttle: [] });
    } catch { toast.error('Could not load bus schedule'); }
    finally { setLoading(false); }
  };

  const loadNext = async () => {
    try {
      const res = await busService.getNextBuses();
      setNextBuses(res.data.nextBuses || []);
      setCurrentTime(res.data.currentTime || '');
    } catch {}
  };

  const filterRoutes = (routes) => {
    if (!search.trim()) return routes;
    const q = search.toLowerCase();
    return routes.filter(r =>
      r.route_name.toLowerCase().includes(q) ||
      (r.short_name || '').toLowerCase().includes(q) ||
      (r.bus_number || '').toLowerCase().includes(q)
    );
  };

  const allDirections = [
    { key: 'to_campus',   label: `To Campus (${schedule.to_campus.length})` },
    { key: 'from_campus', label: `From Campus (${schedule.from_campus.length})` },
    { key: 'shuttle',     label: `Shuttle (${schedule.shuttle.length})` },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title">
          <DirectionsBus sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />
          MU Bus Schedule — Sylhet
        </h5>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 12, color: '#5f6368' }}>Live · {currentTime}</span>
        </div>
      </div>

      {/* Next departures widget */}
      {nextBuses.length > 0 && (
        <Alert severity="success" icon={<DirectionsBus />} sx={{ mb: 2, borderRadius: 2 }}>
          <strong>Next departures in 2 hours:</strong>{' '}
          {nextBuses.slice(0, 3).map((b, i) => (
            <span key={i}>
              {formatTime(b.departure_time)} ({b.short_name || b.bus_number})
              {i < Math.min(nextBuses.length, 3) - 1 ? ' · ' : ''}
            </span>
          ))}
        </Alert>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <SearchIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#5f6368', fontSize: 18 }} />
        <input
          placeholder="Search by route, area, or bus number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #dadce0', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
      </div>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #dadce0' }}>
        {allDirections.map(d => <Tab key={d.key} label={d.label} />)}
      </Tabs>

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 1.5 }} />)
      ) : (
        <>
          {allDirections.map((d, i) => tab === i && (
            <div key={d.key}>
              {filterRoutes(schedule[d.key] || []).length === 0 ? (
                <div className="empty-state ca-card" style={{ padding: 48 }}>
                  <DirectionsBus sx={{ fontSize: 56, opacity: 0.3 }} />
                  <h6>No Routes Found</h6>
                  <p>Try a different search term.</p>
                </div>
              ) : (
                filterRoutes(schedule[d.key] || []).map(route => (
                  <TimelineBus key={route.id} route={route} />
                ))
              )}
            </div>
          ))}
        </>
      )}

      {/* Info footer */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: '#f8f9fa', borderRadius: 8, fontSize: 12, color: '#5f6368' }}>
        <strong>Metropolitan University, Sylhet</strong> — Bus service for regular term academic schedule (Day shift).
        Schedule valid from 11.01.2026. For updates contact the transport office.
      </div>
    </div>
  );
}
