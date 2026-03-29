// src/components/classrooms/SmartClassrooms.js
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody, LinearProgress,
  Alert, Divider, CardHeader, Chip, Checkbox
} from '@mui/material';
import { Add, UploadFile, People, Checklist, BarChart } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { classroomService } from '../../services/api';
import { toast } from 'react-toastify';

const initialForm = { course_code: '', course_name: '', batch: '', section: '', semester: '' };

export default function SmartClassrooms() {
  const { user, isAuthenticated } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [resources, setResources] = useState([]);
  const [tab, setTab] = useState(0);

  const [createForm, setCreateForm] = useState(initialForm);
  const [addStudents, setAddStudents] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [examForm, setExamForm] = useState({ title: '', marks_obtained: '', total_marks: '', student_id: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [bulkSelectAll, setBulkSelectAll] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [touchTableRef, setTouchTableRef] = useState(null);
  const [touchStartX, setTouchStartX] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchClassrooms();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedId && isAuthenticated) {
      fetchClassroomDetails();
      fetchStudents();
      fetchAttendance();
      fetchMarks();
      fetchAnnouncements();
      fetchResources();
    }
  }, [selectedId, isAuthenticated]);

  // Keyboard shortcuts for attendance (Step 12)
  useEffect(() => {
    if (!isTeacher || tab !== 2) return;

    const handleKeyDown = async (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (selectedStudents.size > 0) {
          // Bulk present
          for (const id of selectedStudents) {
            await handleMarkAttendance(id, 'present');
          }
        } else {
          // Single (focus last row or first)
          const lastStudent = students[students.length - 1];
          if (lastStudent) await handleMarkAttendance(lastStudent.id, 'present');
        }
        toast.info('P = Present');
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (selectedStudents.size > 0) {
          // Bulk absent
          for (const id of selectedStudents) {
            await handleMarkAttendance(id, 'absent');
          }
        } else {
          const lastStudent = students[students.length - 1];
          if (lastStudent) await handleMarkAttendance(lastStudent.id, 'absent');
        }
        toast.info('A = Absent');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tab, isTeacher, selectedStudents, students, attendanceDate]);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await classroomService.listClassrooms();
      setClassrooms(res.data.classrooms || []);
      if (!selectedId && res.data.classrooms?.length) setSelectedId(res.data.classrooms[0].id);
    } catch (err) {
      console.error('Failed to load classrooms:', err);
      toast.error(err.message || 'Could not load classrooms.');
    } finally { setLoading(false); }
  };

  const fetchClassroomDetails = async () => {
    try {
      const res = await classroomService.getClassroom(selectedId);
      setSelectedClassroom(res.data.classroom);
    } catch (err) {
      toast.error(err.message || 'Could not load classroom details.');
    }
  };

  const fetchStudents = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.getClassroomStudents(selectedId);
      setStudents(res.data.students || []);
    } catch (err) {
      toast.error(err.message || 'Could not load students.');
    }
  };

  const fetchAttendance = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.getAttendance(selectedId, { classroom_id: selectedId });
      setAttendance(res.data.attendance || []);
    } catch (err) {
      toast.error(err.message || 'Could not load attendance.');
    }
  };

  const fetchMarks = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.getMarks(selectedId, { classroom_id: selectedId });
      setMarks(res.data.marks || []);
    } catch (err) {
      toast.error(err.message || 'Could not load marks.');
    }
  };

  const fetchAnnouncements = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.listAnnouncements(selectedId);
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      toast.error(err.message || 'Could not load announcements.');
    }
  };

  const fetchResources = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.listResources(selectedId);
      setResources(res.data.resources || []);
    } catch (err) {
      toast.error(err.message || 'Could not load resources.');
    }
  };

  const handleCreateClassroom = async () => {
    if (!createForm.course_code || !createForm.course_name || !createForm.batch || !createForm.section || !createForm.semester) {
      return toast.warn('Please fill all fields.');
    }
    try {
      await classroomService.createClassroom(createForm);
      toast.success('Classroom created.');
      setCreateForm(initialForm);
      fetchClassrooms();
    } catch (err) {
      toast.error(err.message || 'Failed to create classroom.');
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) return toast.warn('Fill all fields');
    try {
      await classroomService.createAnnouncement(selectedId, announcementForm);
      toast.success('Announcement posted');
      setAnnouncementForm({ title: '', content: '' });
      fetchAnnouncements();
    } catch (err) { toast.error(err.message); }
  };

  const handleUploadStudents = async () => {
    if (!addStudents || !selectedId) return toast.warn('Add at least one student ID.');
    const list = addStudents
      .split(/\r?\n|,|;/g)
      .map(s => s.trim())
      .filter(Boolean);
    if (!list.length) return toast.warn('Add at least one student ID.');

    try {
      const res = await classroomService.uploadStudents({ classroom_id: selectedId, student_numbers: list });
      const added = res.data.added_student_count || 0;
      const missing = res.data.missing_student_numbers || [];
      toast.success(`${added} student(s) added. ${missing.length ? `${missing.length} missing.` : ''}`);
      setAddStudents('');
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to add students.');
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    if (!selectedId) return;
    try {
      await classroomService.markAttendance(selectedId, {
        classroom_id: selectedId,
        student_id: studentId,
        date: attendanceDate,
        status,
      });
      toast.success(`${status.charAt(0).toUpperCase() + status.slice(1)} for ${students.find(s => s.id === studentId)?.name || studentId}`);
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || 'Could not mark attendance.');
    }
  };

  const handleAddMarks = async () => {
    const { title, marks_obtained, total_marks, student_id } = examForm;
    if (!title || !marks_obtained || !total_marks || !student_id) {
      return toast.warn('Please fill all mark fields.');
    }
    try {
      await classroomService.addMarks(selectedId, {
        classroom_id: selectedId,
        student_id,
        title,
        marks_obtained: Number(marks_obtained),
        total_marks: Number(total_marks),
        date: new Date().toISOString().split('T')[0],
      });
      toast.success('Marks saved.');
      setExamForm({ ...examForm, title: '', marks_obtained: '', total_marks: '' });
      fetchMarks();
    } catch (err) {
      toast.error(err.message || 'Could not add marks.');
    }
  };

  const attendanceStats = () => {
    const rows = attendance.filter(r => r.date && r.status);
    const total = rows.length;
    const present = rows.filter(r => r.status === 'present').length;
    const absent = rows.filter(r => r.status === 'absent').length;
    const percentage = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  };

  const marksStats = () => {
    const totalMax = marks.reduce((sum, m) => sum + Number(m.total_marks), 0);
    const totalGot = marks.reduce((sum, m) => sum + Number(m.marks_obtained), 0);
    return { totalMax, totalGot, percentage: totalMax ? Math.round((totalGot / totalMax) * 100) : 0 };
  };

  const stats = attendanceStats();
  const mStats = marksStats();

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Please log in to access Smart Classroom.</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box className="fade-in" sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardHeader avatar={<BarChart />} title="Smart Classroom" subheader="Teacher-Student interaction hub" />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Classroom</InputLabel>
                <Select value={selectedId || ''} label="Classroom" onChange={(e) => setSelectedId(e.target.value)}>
                  {classrooms.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {`${c.course_code} - ${c.course_name} (${c.batch}${c.section ? ' ' + c.section : ''})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {isTeacher && (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Create Classroom</Typography>
                  <TextField
                    label="Course Code" fullWidth value={createForm.course_code}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, course_code: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Course Name" fullWidth value={createForm.course_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, course_name: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Batch" fullWidth value={createForm.batch}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, batch: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Section" fullWidth value={createForm.section}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, section: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Semester" fullWidth value={createForm.semester}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, semester: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <Button startIcon={<Add />} variant="contained" fullWidth onClick={handleCreateClassroom}>Create</Button>
                </>
              )}
            </CardContent>
          </Card>

          {selectedClassroom && isTeacher && (
            <Card>
              <CardHeader avatar={<People />} title="Add Students" subheader="CSV IDs or newline-separated" />
              <CardContent>
                <TextField
                  multiline fullWidth minRows={4}
                  placeholder="231-115-094\n231-115-095"
                  value={addStudents} onChange={(e) => setAddStudents(e.target.value)} sx={{ mb: 1 }}
                />
                <Button
                  startIcon={<UploadFile />} variant="outlined" fullWidth onClick={handleUploadStudents}
                >Add to Classroom</Button>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <Tabs value={tab} onChange={(_, val) => setTab(val)}>
              <Tab icon={<BarChart />} label="Stream" />
              <Tab icon={<Add />} label="Classwork" />
              <Tab icon={<Checklist />} label="Attendance" />
              <Tab icon={<People />} label="People" />
              <Tab icon={<Add />} label="Grades" />
            </Tabs>
          </Card>

          {!selectedClassroom ? (
            <Alert severity="info">No classroom selected yet. Create one to continue.</Alert>
          ) : loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography>Loading classroom data...</Typography>
            </Box>
          ) : (
            <>
{tab === 0 && (
                <div>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Classroom Stream</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                      Announcements and recent activity for {selectedClassroom.course_code}
                    </Typography>
                    
                    {isTeacher && (
                      <>
                        <TextField
                          label="New Announcement Title" fullWidth sx={{ mb: 2 }}
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                        <TextField
                          label="Announcement Content" multiline fullWidth minRows={3} sx={{ mb: 2 }}
                          value={announcementForm.content}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                        />
                        <Button variant="contained" startIcon={<Add />} fullWidth onClick={handlePostAnnouncement}>
                          Post Announcement
                        </Button>
                      </>
                    )}
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                    
                    {announcements.slice(0, 5).map((ann, idx) => (
                      <Card key={ann.id || idx} sx={{ mb: 2, p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Announcement by {ann.author_name || 'Teacher'} • {new Date(ann.created_at).toLocaleDateString()}
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 1 }}>{ann.title}</Typography>
                        <Typography variant="body2">{ann.content}</Typography>
                      </Card>
                    ))}
                    
                    {announcements.length === 0 && (
                      <Alert severity="info">
                        No announcements yet. {isTeacher ? 'Post the first one!' : 'Stay tuned for updates.'}
                      </Alert>
                    )}
                  </Card>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Card sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Typography variant="subtitle2">Attendance</Typography>
                          <Typography variant="h5">{stats.percentage}%</Typography>
                          <Typography variant="caption">Present {stats.present}, Absent {stats.absent}</Typography>
                        </div>
                        <Chip label={stats.percentage < 75 ? 'LOW 🔴' : 'Good ✅'} color={stats.percentage < 75 ? 'error' : 'success'} />
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Marks</Typography>
                        <Typography variant="h5">{mStats.percentage}%</Typography>
                        <Typography variant="caption">Total Scored {mStats.totalGot} / {mStats.totalMax}</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Students</Typography>
                        <Typography variant="h5">{students.length}</Typography>
                        <Typography variant="caption">Total enrolled</Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </div>
              )}

              {tab === 1 && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Classwork & Resources</Typography>
                  {isTeacher && (
                    <>
                      <TextField
                        label="Resource Title" fullWidth sx={{ mb: 2 }}
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <TextField
                        label="File URL (Google Drive/Dropbox)" multiline fullWidth minRows={2} sx={{ mb: 2 }}
                        placeholder="https://drive.google.com/file/d/..."
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                      />
                      <Button 
                        variant="contained" 
                        startIcon={<UploadFile />} 
                        fullWidth 
                        onClick={async () => {
                          if (!announcementForm.title || !announcementForm.content) return toast.warn('Fill title and URL');
                          try {
                            await classroomService.addResource(selectedId, {
                              classroom_id: selectedId,
                              title: announcementForm.title,
                              file_url: announcementForm.content
                            });
                            toast.success('Resource added');
                            setAnnouncementForm({ title: '', content: '' });
                            fetchResources();
                          } catch (err) { toast.error(err.message); }
                        }}
                      >
                        Add Resource
                      </Button>
                    </>
                  )}
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>Available Resources</Typography>
                  {resources.length === 0 ? (
                    <Alert severity="info">
                      No resources yet. {isTeacher ? 'Upload the first one!' : 'Check back later.'}
                    </Alert>
                  ) : (
                    resources.map((res, idx) => (
                      <Card key={res.id || idx} sx={{ mb: 2, p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Uploaded by {res.uploader_name} • {new Date(res.created_at).toLocaleDateString()}
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 1 }}>{res.title}</Typography>
                        <Button 
                          variant="outlined" 
                          href={res.file_url} 
                          target="_blank" 
                          fullWidth 
                          sx={{ mb: 1 }}
                        >
                          Open Resource
                        </Button>
                      </Card>
                    ))
                  )}
                </Card>
              )}

              {tab === 2 && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Attendance — {attendanceDate}</Typography>
                  <TextField
                    type="date" value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  {isTeacher && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                      <Button 
                        variant="contained" 
                        color="success" 
                        size="small"
                        disabled={selectedStudents.size === 0}
                        onClick={async () => {
                          for (const id of selectedStudents) {
                            await handleMarkAttendance(id, 'present');
                          }
                          setSelectedStudents(new Set());
                          setBulkSelectAll(false);
                        }}
                      >
                        Mark Selected Present ({selectedStudents.size})
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        disabled={selectedStudents.size === 0}
                        onClick={async () => {
                          for (const id of selectedStudents) {
                            await handleMarkAttendance(id, 'absent');
                          }
                          setSelectedStudents(new Set());
                          setBulkSelectAll(false);
                        }}
                      >
                        Mark Selected Absent
                      </Button>
                      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox 
                          checked={bulkSelectAll}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(new Set(students.map(s => s.id)));
                              setBulkSelectAll(true);
                            } else {
                              setSelectedStudents(new Set());
                              setBulkSelectAll(false);
                            }
                          }}
                        />
                        <Typography variant="body2">Select All ({students.length})</Typography>
                      </Box>
                    </Box>
                  )}
                  <Box 
                    ref={setTouchTableRef}
                    sx={{ overflow: 'auto' }}
                    onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                    onTouchEnd={async (e) => {
                      if (!isTeacher || !touchTableRef) return;
                      const touchEndX = e.changedTouches[0].clientX;
                      const deltaX = touchEndX - touchStartX;
                      const targetClass = selectedStudents.size > 0 ? 'selected' : 'all';
                      let status = 'absent';
                      if (deltaX > 50) {
                        status = 'present';
                      } else if (deltaX < -50) {
                        status = 'absent';
                      } else return;
                      toast.info(`Swipe ${targetClass} ${status}`);
                      const ids = selectedStudents.size > 0 ? Array.from(selectedStudents) : students.map(s => s.id);
                      for (const id of ids) {
                        await handleMarkAttendance(id, status);
                      }
                      setSelectedStudents(new Set());
                      setBulkSelectAll(false);
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>{isTeacher && <Checkbox 
                            indeterminate={!bulkSelectAll && selectedStudents.size > 0}
                            checked={bulkSelectAll}
                            onChange={null}
                          />}</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Student ID</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map(student => {
                          const record = attendance.find(r => r.student_id === student.id && r.date === attendanceDate);
                          const status = record?.status || 'absent';
                          const isSelected = selectedStudents.has(student.id);
                          return (
                            <TableRow key={student.id}>
                              <TableCell>{isTeacher && <Checkbox 
                                checked={isSelected}
                                onChange={(e) => {
                                  const newSet = new Set(selectedStudents);
                                  if (e.target.checked) {
                                    newSet.add(student.id);
                                  } else {
                                    newSet.delete(student.id);
                                  }
                                  setSelectedStudents(newSet);
                                  setBulkSelectAll(newSet.size === students.length);
                                }}
                              />}</TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.student_number || '-'}</TableCell>
                              <TableCell>
                                <Chip label={status.toUpperCase()} color={status === 'present' ? 'success' : 'error'} size="small" />
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant={status === 'present' ? 'contained' : 'outlined'} color="success" onClick={() => handleMarkAttendance(student.id, 'present')} sx={{ mr: 1 }}>P</Button>
                                <Button size="small" variant={status === 'absent' ? 'contained' : 'outlined'} color="error" onClick={() => handleMarkAttendance(student.id, 'absent')}>A</Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                </Card>
              )}

              {tab === 4 && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Marks</Typography>
                  {isTeacher && (
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Student</InputLabel>
                          <Select
                            value={examForm.student_id}
                            label="Student"
                            onChange={(e) => setExamForm(prev => ({ ...prev, student_id: e.target.value }))}
                          >
                            {students.map(s => (
                              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          label="Title" value={examForm.title}
                          onChange={(e) => setExamForm(prev => ({ ...prev, title: e.target.value }))}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <TextField
                          label="Got" type="number" value={examForm.marks_obtained}
                          onChange={(e) => setExamForm(prev => ({ ...prev, marks_obtained: e.target.value }))}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <TextField
                          label="Total" type="number" value={examForm.total_marks}
                          onChange={(e) => setExamForm(prev => ({ ...prev, total_marks: e.target.value }))}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Button variant="contained" onClick={handleAddMarks} startIcon={<Add />} fullWidth>Save</Button>
                      </Grid>
                    </Grid>
                  )}
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(marks || []).map((m, idx) => {
                        const student = students.find(s => s.id === m.student_id);
                        return (
                          <TableRow key={m.id || idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{student?.name || m.student_id}</TableCell>
                            <TableCell>{m.title}</TableCell>
                            <TableCell>{m.marks_obtained}/{m.total_marks}</TableCell>
                            <TableCell>{m.date}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {tab === 3 && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6">Students ({students.length})</Typography>
                  <Divider sx={{ my: 1 }} />
                  {students.length === 0 && <Alert severity="info">No students in classroom yet.</Alert>}
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Student ID</TableCell>
                        <TableCell>Email</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map(s => (
                        <TableRow key={s.id}>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.student_number}</TableCell>
                          <TableCell>{s.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {loading && <LinearProgress sx={{ mt: 2 }} />}
    </Box>
  );
}
