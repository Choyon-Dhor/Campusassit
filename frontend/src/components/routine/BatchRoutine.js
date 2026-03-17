// src/components/routine/BatchRoutine.js
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Button, Chip, Select,
  MenuItem, FormControl, InputLabel, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody,
  Skeleton, Alert, Tooltip
} from '@mui/material';
import { CalendarMonth, Today, AccessTime, Person, Room } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { batchRoutineService } from '../../services/api';
import { toast } from 'react-toastify';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday'];
const TIME_SLOTS = [
  '9:00-10:15', '10:15-11:30', '11:30-12:45',
  '1:00-2:15',  '2:15-3:30',  '3:30-4:45'
];
const SLOT_LABELS = [
  '9:00 AM', '10:15 AM', '11:30 AM',
  '1:00 PM', '2:15 PM',  '3:30 PM'
];

// Course colour palette (consistent per code)
const courseColors = [
  '#e8f0fe','#e6f4ea','#fef7e0','#fce8e6','#f3e8fd',
  '#e0f7fa','#fff3e0','#fce4ec','#e8eaf6','#f1f8e9',
];
const colorCache = {};
let colorIdx = 0;
function getCourseColor(code) {
  if (!colorCache[code]) colorCache[code] = courseColors[colorIdx++ % courseColors.length];
  return colorCache[code];
}

function ClassCard({ entry }) {
  const bg = getCourseColor(entry.course_code);
  return (
    <div style={{
      background: bg, borderRadius: 8, padding: '8px 10px',
      fontSize: 12, height: '100%', minHeight: 72,
      border: `1px solid ${bg === '#e8f0fe' ? '#c5d8f8' : '#ddd'}`,
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a', marginBottom: 3 }}>
        {entry.course_code}
      </div>
      <div style={{ color: '#3c4043', lineHeight: 1.3, marginBottom: 4 }}>
        {entry.course_name}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#5f6368' }}>
          <Room sx={{ fontSize: 12 }} />{entry.room_name}
        </span>
        {entry.faculty_name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#5f6368' }}>
            <Person sx={{ fontSize: 12 }} />
            {entry.faculty_name.split(' ').slice(-1)[0]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function BatchRoutine() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [routine, setRoutine] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchOptions, setBatchOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);

  useEffect(() => { loadBatches(); }, []);

  const loadBatches = async () => {
    try {
      const res = await batchRoutineService.getBatches();
      const raw = res.data.batches || [];
      setBatches(raw);
      // Unique batch numbers
      const nums = [...new Set(raw.map(b => b.batch_number))].sort((a,b)=>a-b);
      setBatchOptions(nums);
      // Default to batch 58
      if (nums.includes(58)) {
        setSelectedBatch(58);
        const secs = raw.filter(b => b.batch_number === 58).map(b => b.batch_section);
        setSectionOptions(secs);
        setSelectedSection('C+G');
      } else if (nums.length) {
        setSelectedBatch(nums[0]);
        const secs = raw.filter(b => b.batch_number === nums[0]).map(b => b.batch_section);
        setSectionOptions(secs);
        if (secs.length) setSelectedSection(secs[0]);
      }
    } catch { toast.error('Could not load batches'); }
  };

  useEffect(() => {
    if (selectedBatch && selectedSection) {
      loadRoutine();
      loadToday();
    }
  }, [selectedBatch, selectedSection]);

  const loadRoutine = async () => {
    setLoading(true);
    try {
      const res = await batchRoutineService.getRoutine(selectedBatch, selectedSection);
      setRoutine(res.data.routine || []);
    } catch { toast.error('Could not load routine'); }
    finally { setLoading(false); }
  };

  const loadToday = async () => {
    try {
      const res = await batchRoutineService.getTodayClasses(selectedBatch, selectedSection);
      setTodayClasses(res.data.classes || []);
    } catch {}
  };

  const handleBatchChange = (bn) => {
    setSelectedBatch(bn);
    const secs = batches.filter(b => b.batch_number === parseInt(bn)).map(b => b.batch_section);
    setSectionOptions(secs);
    setSelectedSection(secs[0] || '');
  };

  // Build timetable grid: grid[day][slotLabel] = entry
  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; });
  for (const entry of routine) {
    const slot = entry.time_slot;
    if (!grid[entry.day]) grid[entry.day] = {};
    if (!grid[entry.day][slot]) grid[entry.day][slot] = [];
    grid[entry.day][slot].push(entry);
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title">
          <CalendarMonth sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />
          Batch-Specific Routine
        </h5>
      </div>

      {/* Batch selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Batch</InputLabel>
          <Select value={selectedBatch} onChange={e => handleBatchChange(e.target.value)} label="Batch">
            {batchOptions.map(n => <MenuItem key={n} value={n}>CSE-{n}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Section</InputLabel>
          <Select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} label="Section">
            {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        {selectedBatch && selectedSection && (
          <Chip
            label={`CSE-${selectedBatch} [${selectedSection}] — Spring 2026`}
            color="primary" variant="outlined" sx={{ fontWeight: 600 }}
          />
        )}
      </div>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #dadce0' }}>
        <Tab label={<span><Today sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />Today's Classes</span>} />
        <Tab label="Weekly Timetable" />
        <Tab label="List View" />
      </Tabs>

      {/* ── Tab 0: Today ── */}
      {tab === 0 && (
        <div>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            <strong>{today}</strong> — {todayClasses.length} class{todayClasses.length !== 1 ? 'es' : ''} scheduled
          </Alert>
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 1.5 }} />)
          ) : todayClasses.length === 0 ? (
            <div className="empty-state ca-card" style={{ padding: 48 }}>
              <CalendarMonth sx={{ fontSize: 56, opacity: 0.3 }} />
              <h6>No Classes Today</h6>
              <p>Enjoy your day off! 🎉</p>
            </div>
          ) : (
            todayClasses.map((cls, i) => (
              <div key={i} className="ca-card mb-2" style={{ padding: '14px 18px', borderLeft: `4px solid #1a73e8` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#202124' }}>
                      {cls.course_code} — {cls.course_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#5f6368', marginTop: 3, display: 'flex', gap: 12 }}>
                      <span><Room sx={{ fontSize: 13, verticalAlign: 'middle' }} /> Room {cls.room_name}</span>
                      {cls.faculty_name && <span><Person sx={{ fontSize: 13, verticalAlign: 'middle' }} /> {cls.faculty_name}</span>}
                    </div>
                  </div>
                  <Chip
                    icon={<AccessTime sx={{ fontSize: 14 }} />}
                    label={`${cls.start_time?.slice(0,5)} – ${cls.end_time?.slice(0,5)}`}
                    variant="outlined" size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab 1: Timetable Grid ── */}
      {tab === 1 && (
        loading ? <Skeleton variant="rounded" height={400} /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#1a73e8' }}>
                  <th style={{ padding: '10px 12px', color: 'white', fontWeight: 600, fontSize: 12, width: 90 }}>Day</th>
                  {TIME_SLOTS.map((slot, i) => (
                    <th key={slot} style={{ padding: '10px 8px', color: 'white', fontWeight: 600, fontSize: 11, textAlign: 'center' }}>
                      {SLOT_LABELS[i]}<br /><span style={{ fontSize: 10, opacity: 0.8 }}>{slot}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => (
                  <tr key={day} style={{ background: day === today ? '#e8f0fe' : di % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{
                      padding: '8px 12px', fontWeight: 700, fontSize: 12,
                      borderRight: '2px solid #dadce0', whiteSpace: 'nowrap',
                      color: day === today ? '#1a73e8' : '#202124'
                    }}>
                      {day === today && <span style={{ marginRight: 4 }}>📍</span>}
                      {day}
                    </td>
                    {TIME_SLOTS.map(slot => {
                      const entries = grid[day]?.[slot];
                      return (
                        <td key={slot} style={{ padding: 4, border: '1px solid #e0e0e0', verticalAlign: 'top', minWidth: 130 }}>
                          {entries?.map((e, i) => <ClassCard key={i} entry={e} />)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Tab 2: List View ── */}
      {tab === 2 && (
        loading ? <Skeleton variant="rounded" height={300} /> : (
          <div style={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f3f4' }}>
                  {['Day','Time','Course Code','Course Name','Room','Faculty'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {routine.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: '#5f6368' }}>No routine data found.</TableCell></TableRow>
                ) : (
                  routine.map((r, i) => (
                    <TableRow key={i} hover sx={{ bgcolor: r.day === today ? '#e8f0fe' : 'inherit' }}>
                      <TableCell>
                        <Chip label={r.day} size="small"
                          color={r.day === today ? 'primary' : 'default'}
                          sx={{ fontSize: 11, height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{r.time_slot}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{r.course_code}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.course_name}</TableCell>
                      <TableCell><strong>{r.room_name}</strong></TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.faculty_name || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )
      )}
    </div>
  );
}
