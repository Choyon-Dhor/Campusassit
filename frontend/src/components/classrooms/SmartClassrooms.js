// src/components/classrooms/SmartClassrooms.js
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody, LinearProgress,
  Alert, Divider, CardHeader, Chip, Checkbox
} from '@mui/material';
import { Add, UploadFile, People, Checklist, BarChart, Edit, Delete, Save, Cancel, Assignment, Download } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { classroomService } from '../../services/api';
import { readCollection, readEntity } from '../../services/contracts';
import { toast } from 'react-toastify';
import { Assignments } from '../assignments';

const initialForm = { course_code: '', course_name: '', description: '', batch: '', section: '', semester: '' };

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
  const [people, setPeople] = useState([]);
  const [tab, setTab] = useState(0);

  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addStudents, setAddStudents] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [examForm, setExamForm] = useState({ title: '', marks_obtained: '', total_marks: '', student_id: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [bulkSelectAll, setBulkSelectAll] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [touchTableRef, setTouchTableRef] = useState(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const streamTab = 0;
  const classworkTab = isTeacher ? 1 : null;
  const attendanceTab = isTeacher ? 2 : null;
  const peopleTab = isTeacher ? 3 : 1;
  const assignmentsTab = isTeacher ? 4 : 2;
  const gradesTab = isTeacher ? 5 : 3;

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
      fetchPeople();
    }
  }, [selectedId, isAuthenticated]);

  // Keyboard shortcuts for attendance (Step 12)
  useEffect(() => {
    if (!isTeacher || tab !== attendanceTab) return;

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
  }, [attendanceTab, tab, isTeacher, selectedStudents, students, attendanceDate]);

  useEffect(() => {
    const maxTab = gradesTab;
    if (tab > maxTab) {
      setTab(streamTab);
    }
  }, [gradesTab, streamTab, tab]);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await classroomService.listClassrooms();
      const nextClassrooms = readCollection(res, 'classrooms');
      setClassrooms(nextClassrooms);
      if (!selectedId && nextClassrooms.length) setSelectedId(nextClassrooms[0].id);
    } catch (err) {
      console.error('Failed to load classrooms:', err);
      toast.error(err.message || 'Could not load classrooms.');
    } finally { setLoading(false); }
  };

  const fetchClassroomDetails = async () => {
    try {
      const res = await classroomService.getClassroom(selectedId);
      setSelectedClassroom(readEntity(res, 'classroom'));
    } catch (err) {
      toast.error(err.message || 'Could not load classroom details.');
    }
  };

  const fetchStudents = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.getClassroomStudents(selectedId);
      setStudents(readCollection(res, 'students'));
    } catch (err) {
      toast.error(err.message || 'Could not load students.');
    }
  };

  const fetchAttendance = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.getAttendance(selectedId, { classroom_id: selectedId });
      setAttendance(readCollection(res, 'attendance'));
    } catch (err) {
      toast.error(err.message || 'Could not load attendance.');
    }
  };

  const fetchMarks = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.getMarks(selectedId, { classroom_id: selectedId });
      setMarks(readCollection(res, 'marks'));
    } catch (err) {
      toast.error(err.message || 'Could not load marks.');
    }
  };

  const fetchAnnouncements = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.listAnnouncements(selectedId);
      setAnnouncements(readCollection(res, 'announcements'));
    } catch (err) {
      toast.error(err.message || 'Could not load announcements.');
    }
  };

  const fetchResources = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.listResources(selectedId);
      setResources(readCollection(res, 'resources'));
    } catch (err) {
      toast.error(err.message || 'Could not load resources.');
    }
  };

  const fetchPeople = async () => {
    if (!selectedId) return;
    try {
      const res = await classroomService.getClassroomPeople(selectedId);
      setPeople(readCollection(res, 'people'));
    } catch (err) {
      toast.error(err.message || 'Could not load classroom people.');
    }
  };

  const handleAssignmentDataChange = async () => {
    await Promise.all([fetchAnnouncements(), fetchMarks()]);
  };

  const handleDownloadPeople = async () => {
    if (!selectedId) return;
    try {
      const response = await classroomService.downloadClassroomPeople(selectedId);
      
      // Check if we got an error response (JSON) instead of a blob
      if (response.data instanceof Blob && response.data.type === 'application/json') {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.message || 'Failed to download');
      }

      // Ensure we have a proper blob
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      let blob = response.data;
      if (!(blob instanceof Blob)) {
        blob = new Blob([blob], { type: 'text/csv; charset=utf-8' });
      }
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `classroom-people-${selectedId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('People information downloaded successfully.');
    } catch (err) {
      console.error('Download error:', err);
      toast.error(err.message || 'Could not download people information. Please ensure the server is running.');
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

  const handleEditClassroom = (classroom) => {
    setEditForm({
      course_code: classroom.course_code,
      course_name: classroom.course_name,
      description: classroom.description || '',
      batch: classroom.batch,
      section: classroom.section,
      semester: classroom.semester,
    });
    setEditingId(classroom.id);
    setIsEditing(true);
  };

  const handleUpdateClassroom = async () => {
    if (!editForm.course_code || !editForm.course_name || !editForm.batch || !editForm.section || !editForm.semester) {
      return toast.warn('Please fill all fields.');
    }
    try {
      await classroomService.updateClassroom(editingId, editForm);
      toast.success('Classroom updated.');
      setIsEditing(false);
      setEditingId(null);
      setEditForm(initialForm);
      fetchClassrooms();
      if (selectedId === editingId) {
        fetchClassroomDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update classroom.');
    }
  };

  const handleDeleteClassroom = async (classroomId) => {
    if (!window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      return;
    }
    try {
      await classroomService.deleteClassroom(classroomId);
      toast.success('Classroom deleted.');
      fetchClassrooms();
      if (selectedId === classroomId) {
        setSelectedId(null);
        setSelectedClassroom(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete classroom.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setEditForm(initialForm);
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
    const normalizedMarks = marks.map((mark) => ({
      ...mark,
      total: Number(mark.total_marks) || 0,
      got: Number(mark.marks_obtained) || 0,
    }));
    const totalMax = normalizedMarks.reduce((sum, m) => sum + m.total, 0);
    const totalGot = normalizedMarks.reduce((sum, m) => sum + m.got, 0);
    const assignmentCount = normalizedMarks.filter((m) => m.source === 'assignment').length;
    const manualCount = normalizedMarks.length - assignmentCount;
    const averagePercentage = normalizedMarks.length
      ? Math.round(normalizedMarks.reduce((sum, m) => sum + (m.total ? ((m.got / m.total) * 100) : 0), 0) / normalizedMarks.length)
      : 0;
    const uniqueStudents = new Set(normalizedMarks.map((m) => m.student_id)).size;
    return {
      totalMax,
      totalGot,
      assignmentCount,
      manualCount,
      totalRecords: normalizedMarks.length,
      averagePercentage,
      uniqueStudents,
      percentage: totalMax ? Math.round((totalGot / totalMax) * 100) : 0
    };
  };

  const getMarkSourceColor = (source) => (source === 'assignment' ? 'primary' : 'default');

  const getMarkScoreColor = (mark) => {
    const total = Number(mark.total_marks) || 0;
    const got = Number(mark.marks_obtained) || 0;
    const percentage = total ? (got / total) * 100 : 0;

    if (percentage >= 85) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
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
                    label="Course Description" fullWidth multiline rows={2} value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))} sx={{ mb: 1 }}
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

              {isTeacher && classrooms.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Manage Classrooms</Typography>
                  {classrooms.map(c => (
                    <Card key={c.id} sx={{ mb: 1, p: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {c.course_code} - {c.course_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.batch}{c.section ? ' ' + c.section : ''} • {c.semester}
                          </Typography>
                          {c.description && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {c.description}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => handleEditClassroom(c)}
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleDeleteClassroom(c.id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </>
              )}

              {isEditing && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Edit Classroom</Typography>
                  <TextField
                    label="Course Code" fullWidth value={editForm.course_code}
                    onChange={(e) => setEditForm(prev => ({ ...prev, course_code: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Course Name" fullWidth value={editForm.course_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, course_name: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Course Description" fullWidth multiline rows={2} value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Batch" fullWidth value={editForm.batch}
                    onChange={(e) => setEditForm(prev => ({ ...prev, batch: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Section" fullWidth value={editForm.section}
                    onChange={(e) => setEditForm(prev => ({ ...prev, section: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Semester" fullWidth value={editForm.semester}
                    onChange={(e) => setEditForm(prev => ({ ...prev, semester: e.target.value }))} sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button startIcon={<Save />} variant="contained" fullWidth onClick={handleUpdateClassroom}>
                      Update
                    </Button>
                    <Button startIcon={<Cancel />} variant="outlined" fullWidth onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </Box>
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
              {isTeacher && <Tab icon={<Add />} label="Classwork" />}
              {isTeacher && <Tab icon={<Checklist />} label="Attendance" />}
              <Tab icon={<People />} label="People" />
              <Tab icon={<Assignment />} label="Assignments" />
              <Tab icon={<BarChart />} label={isTeacher ? 'Grades' : 'My Grades'} />
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
              {/* Classroom Header with Description */}
              <Card sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedClassroom.course_code} - {selectedClassroom.course_name}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  {selectedClassroom.batch}{selectedClassroom.section ? ' ' + selectedClassroom.section : ''} • {selectedClassroom.semester}
                </Typography>
                {selectedClassroom.description && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedClassroom.description}
                  </Typography>
                )}
                <Chip
                  label={isTeacher ? "Teaching" : "Enrolled"}
                  color={isTeacher ? "primary" : "success"}
                  size="small"
                />
              </Card>

{tab === streamTab && (
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

              {tab === classworkTab && isTeacher && (
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

              {tab === attendanceTab && isTeacher && (
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

              {tab === peopleTab && (
                <Card sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom style={{ margin: 0 }}>People</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total: {people.length} people in this classroom
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={handleDownloadPeople}
                      disabled={people.length === 0}
                    >
                      Download CSV
                    </Button>
                  </Box>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {people.map(person => (
                        <TableRow key={person.id}>
                          <TableCell>{person.name}</TableCell>
                          <TableCell>{person.student_number || person.id}</TableCell>
                          <TableCell>{person.email || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={person.role === 'teacher' ? 'Teacher' : 'Student'} 
                              color={person.role === 'teacher' ? 'secondary' : 'primary'} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {people.length === 0 && (
                    <Alert severity="info">No people enrolled yet.</Alert>
                  )}
                </Card>
              )}

              {tab === assignmentsTab && (
                <Assignments classroomId={selectedId} onDataChange={handleAssignmentDataChange} />
              )}

              {tab === gradesTab && (
                <Card sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        {isTeacher ? 'Gradebook' : 'My Grades'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isTeacher
                          ? 'Assignment grades sync here automatically when you grade a submission.'
                          : 'Assignment scores and manual marks appear together in one running record.'}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${mStats.percentage}% overall`}
                      color={mStats.percentage >= 60 ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </Box>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    {isTeacher
                      ? 'Use manual entries for quizzes, vivas, or offline work. Assignment grading now updates this section automatically.'
                      : 'Teacher feedback from graded assignments appears here whenever it is available.'}
                  </Alert>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6} lg={3}>
                      <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Overall Score</Typography>
                        <Typography variant="h5">{mStats.totalGot}/{mStats.totalMax}</Typography>
                        <Typography variant="caption">{mStats.percentage}% weighted total</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                      <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Assignment Synced</Typography>
                        <Typography variant="h5">{mStats.assignmentCount}</Typography>
                        <Typography variant="caption">Auto-created from assignment grading</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                      <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle2">Manual Entries</Typography>
                        <Typography variant="h5">{mStats.manualCount}</Typography>
                        <Typography variant="caption">Quizzes, viva, class tests, lab checks</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                      <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle2">{isTeacher ? 'Students Covered' : 'Average Grade'}</Typography>
                        <Typography variant="h5">{isTeacher ? mStats.uniqueStudents : `${mStats.averagePercentage}%`}</Typography>
                        <Typography variant="caption">
                          {isTeacher ? `${mStats.totalRecords} grade records logged` : `${mStats.totalRecords} graded record(s)`}
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {isTeacher && (
                    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>Add Manual Grade</Typography>
                      <Grid container spacing={1}>
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
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Title"
                            value={examForm.title}
                            onChange={(e) => setExamForm(prev => ({ ...prev, title: e.target.value }))}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            label="Got"
                            type="number"
                            value={examForm.marks_obtained}
                            onChange={(e) => setExamForm(prev => ({ ...prev, marks_obtained: e.target.value }))}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            label="Total"
                            type="number"
                            value={examForm.total_marks}
                            onChange={(e) => setExamForm(prev => ({ ...prev, total_marks: e.target.value }))}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <Button variant="contained" onClick={handleAddMarks} startIcon={<Add />} fullWidth>
                            Save
                          </Button>
                        </Grid>
                      </Grid>
                    </Card>
                  )}

                  {marks.length === 0 ? (
                    <Alert severity="info">
                      {isTeacher
                        ? 'No grades recorded yet. Grade an assignment or add the first manual mark.'
                        : 'No grades have been published for this classroom yet.'}
                    </Alert>
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          {isTeacher && <TableCell>Student</TableCell>}
                          <TableCell>Grade Item</TableCell>
                          <TableCell>Score</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(marks || []).map((m, idx) => {
                          const student = students.find(s => s.id === m.student_id);
                          const studentLabel = m.student_name || student?.name || m.student_id;
                          return (
                            <TableRow key={m.id || idx}>
                              <TableCell>{idx + 1}</TableCell>
                              {isTeacher && (
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{studentLabel}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {m.student_number || student?.student_number || '-'}
                                  </Typography>
                                </TableCell>
                              )}
                              <TableCell>
                                <Box display="flex" flexDirection="column" gap={0.75}>
                                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.title}</Typography>
                                    <Chip
                                      label={m.source === 'assignment' ? 'Assignment Sync' : 'Manual'}
                                      size="small"
                                      color={getMarkSourceColor(m.source)}
                                      variant="outlined"
                                    />
                                  </Box>
                                  {m.feedback && (
                                    <Typography variant="caption" color="text.secondary">
                                      Feedback: {m.feedback}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`${m.marks_obtained}/${m.total_marks}`}
                                  size="small"
                                  color={getMarkScoreColor(m)}
                                />
                              </TableCell>
                              <TableCell>{new Date(m.date).toLocaleDateString()}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
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
