// src/components/classrooms/FreeClassrooms.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, CardHeader, Chip, Button,
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Skeleton, Alert
} from '@mui/material';
import { MeetingRoom, Refresh, CloudUpload, CheckCircle, Cancel, Schedule } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { classroomService } from '../../services/api';
import { toast } from 'react-toastify';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const roomTypeColor = { classroom: '#e8f0fe', lab: '#fce8e6', seminar: '#fef7e0', lecture_hall: '#e6f4ea' };

export default function FreeClassrooms() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState(0);
  const [freeData, setFreeData] = useState(null);
  const [routine, setRoutine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadFreeRooms = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await classroomService.getFreeRooms();
      setFreeData(res.data);
      setLastUpdated(new Date());
    } catch (err) { toast.error('Failed to load classroom data'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const loadRoutine = async (day = '') => {
    try {
      const res = await classroomService.getRoutine({ day: day || undefined });
      setRoutine(res.data.routine || []);
    } catch {}
  };

  useEffect(() => {
    loadFreeRooms();
    loadRoutine();
    const interval = setInterval(() => loadFreeRooms(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadFreeRooms]);

  useEffect(() => {
    if (tab === 1) loadRoutine(selectedDay);
  }, [tab, selectedDay]);

  const handleUpload = async () => {
    if (!uploadFile) return toast.error('Please select a file.');
    const formData = new FormData();
    formData.append('routine', uploadFile);
    formData.append('replace', replaceExisting);
    setUploading(true);
    try {
      const res = await classroomService.uploadRoutine(formData);
      toast.success(res.data.message);
      if (res.data.errors?.length > 0) {
        toast.warning(`${res.data.errors.length} rows had errors.`);
      }
      setUploadOpen(false);
      loadFreeRooms();
      loadRoutine();
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const downloadTemplate = async () => {
    try {
      const res = await classroomService.downloadTemplate();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'routine_template.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title"><MeetingRoom sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />Smart Classroom Finder</h5>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => loadFreeRooms(true)} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          {isAdmin && (
            <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setUploadOpen(true)}>
              Upload Routine
            </Button>
          )}
        </div>
      </div>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span className="live-dot" />
        <span style={{ fontSize: 12, color: '#5f6368' }}>
          Live — {currentDay} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {lastUpdated && ` • Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </span>
      </div>

      {refreshing && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #dadce0' }}>
        <Tab label="Live Free Rooms" />
        <Tab label="Class Routine" />
      </Tabs>

      {/* ── Tab 0: Live Free Rooms ── */}
      {tab === 0 && (
        <>
          {loading ? (
            <Grid container spacing={2}>
              {[...Array(6)].map((_, i) => <Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={100} /></Grid>)}
            </Grid>
          ) : freeData ? (
            <>
              {/* Summary */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e6f4ea' }}>
                      <CheckCircle sx={{ color: '#34a853' }} />
                    </div>
                    <div>
                      <div className="stat-value" style={{ color: '#34a853' }}>{freeData.freeCount}</div>
                      <div className="stat-label">Free Rooms Now</div>
                    </div>
                  </div>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fce8e6' }}>
                      <Cancel sx={{ color: '#ea4335' }} />
                    </div>
                    <div>
                      <div className="stat-value" style={{ color: '#ea4335' }}>{freeData.occupiedCount}</div>
                      <div className="stat-label">Occupied Rooms</div>
                    </div>
                  </div>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e8f0fe' }}>
                      <MeetingRoom sx={{ color: '#1a73e8' }} />
                    </div>
                    <div>
                      <div className="stat-value" style={{ color: '#1a73e8' }}>{freeData.totalRooms}</div>
                      <div className="stat-label">Total Rooms</div>
                    </div>
                  </div>
                </Grid>
              </Grid>

              {freeData.currentSlot && (
                <Alert severity="info" icon={<Schedule />} sx={{ mb: 2, borderRadius: 2 }}>
                  Current slot: <strong>{freeData.currentSlot.label}</strong>
                </Alert>
              )}

              {/* Free Rooms Grid */}
              <h6 style={{ fontWeight: 600, marginBottom: 12 }}>
                <CheckCircle sx={{ color: '#34a853', mr: 0.5, fontSize: 18, verticalAlign: 'middle' }} />
                Available Now ({freeData.freeCount})
              </h6>
              {freeData.freeRooms.length === 0 ? (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>All rooms are currently occupied.</Alert>
              ) : (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {freeData.freeRooms.map(room => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={room.id}>
                      <Card sx={{ borderRadius: 2, border: '1px solid #ceead6', bgcolor: '#f8fdf9', textAlign: 'center', p: 0.5 }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <div style={{ fontSize: 24, marginBottom: 4 }}>
                            {room.type === 'lab' ? '🧪' : room.type === 'seminar' ? '🗣️' : room.type === 'lecture_hall' ? '🏛️' : '🏫'}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: '#137333' }}>{room.room_name}</div>
                          <div style={{ fontSize: 11, color: '#5f6368' }}>{room.building}</div>
                          <span className="room-badge-free" style={{ marginTop: 4, display: 'inline-block' }}>FREE</span>
                          <div style={{ fontSize: 10, color: '#9aa0a6', marginTop: 4 }}>
                            Cap: {room.capacity} • Fl {room.floor}
                          </div>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Occupied Rooms */}
              <h6 style={{ fontWeight: 600, marginBottom: 12 }}>
                <Cancel sx={{ color: '#ea4335', mr: 0.5, fontSize: 18, verticalAlign: 'middle' }} />
                Occupied Now ({freeData.occupiedCount})
              </h6>
              <Grid container spacing={2}>
                {freeData.occupiedRooms.map(room => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={room.id}>
                    <Card sx={{ borderRadius: 2, border: '1px solid #f5c6c3', bgcolor: '#fff8f7', textAlign: 'center', p: 0.5 }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>
                          {room.type === 'lab' ? '🧪' : room.type === 'seminar' ? '🗣️' : room.type === 'lecture_hall' ? '🏛️' : '🏫'}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#c5221f' }}>{room.room_name}</div>
                        <div style={{ fontSize: 11, color: '#5f6368', marginBottom: 2 }}>{room.schedule?.course_code}</div>
                        <span className="room-badge-occupied">OCCUPIED</span>
                        <div style={{ fontSize: 10, color: '#9aa0a6', marginTop: 4 }}>
                          {room.schedule?.time_slot}
                        </div>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Alert severity="warning">Could not load classroom data.</Alert>
          )}
        </>
      )}

      {/* ── Tab 1: Routine Table ── */}
      {tab === 1 && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Filter by Day</InputLabel>
              <Select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} label="Filter by Day">
                <MenuItem value="">All Days</MenuItem>
                {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
          <div className="ca-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f1f3f4' }}>
                    {['Day', 'Time Slot', 'Course Code', 'Course Name', 'Room', 'Faculty', 'Dept', 'Semester'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {routine.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#5f6368' }}>
                        No routine data. {isAdmin && 'Upload a CSV file to populate.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    routine.map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell><Chip label={row.day} size="small" sx={{ fontSize: 11 }} /></TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.time_slot}</TableCell>
                        <TableCell><Chip label={row.course_code} size="small" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.course_name}</TableCell>
                        <TableCell><strong>{row.room_name}</strong></TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.faculty_name || '—'}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.department || '—'}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.semester || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Upload Class Routine</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Upload a CSV file with columns: day, time_slot, start_time, end_time, course_code, course_name, room_name, faculty_name, department, semester, batch
          </Alert>
          <Button variant="outlined" size="small" onClick={downloadTemplate} sx={{ mb: 2 }}>
            Download CSV Template
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={e => setUploadFile(e.target.files[0])}
            style={{ display: 'block', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="replace" checked={replaceExisting} onChange={e => setReplaceExisting(e.target.checked)} />
            <label htmlFor="replace" style={{ fontSize: 14, cursor: 'pointer' }}>Replace existing routine data</label>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !uploadFile}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
