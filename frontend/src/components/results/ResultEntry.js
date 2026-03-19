// src/components/results/ResultEntry.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, Alert, CircularProgress, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, Divider, Paper
} from '@mui/material';
import {
  Add, Delete, Save, Search, PersonSearch,
  CheckCircle, Publish, Edit, ContentCopy,
  ArrowDropDown, Close, FileDownload
} from '@mui/icons-material';
import { resultService } from '../../services/api';
import { toast } from 'react-toastify';

// ── Grade lookup ───────────────────────────────────────────────
const GRADE_OPTIONS = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F'];
const gradeToPoint = (g) => ({
  'A+':4.00,'A':3.75,'A-':3.50,'B+':3.25,'B':3.00,'B-':2.75,
  'C+':2.50,'C':2.25,'C-':2.00,'D+':1.75,'D':1.50,'F':0.00
}[g?.trim()] ?? 0);

const gradeColor = (g) => {
  if (['A+','A'].includes(g))   return { bg:'#e6f4ea', color:'#137333' };
  if (['A-','B+'].includes(g))  return { bg:'#e8f0fe', color:'#1565c0' };
  if (['B','B-'].includes(g))   return { bg:'#e8f0fe', color:'#1e88e5' };
  if (['C+','C'].includes(g))   return { bg:'#fef7e0', color:'#e37400' };
  if (['C-','D+','D'].includes(g)) return { bg:'#fce8e6', color:'#c62828' };
  if (g === 'F')                return { bg:'#fce8e6', color:'#b71c1c' };
  return { bg:'#f1f3f4', color:'#5f6368' };
};

// Standard CSE courses by semester (for autocomplete)
const COURSE_CATALOG = [
  { code:'CSE-125', title:'Discrete Mathematics',                 ch:3   },
  { code:'ENG-114', title:'English I',                            ch:3   },
  { code:'GED-201', title:'Bangladesh Studies',                   ch:3   },
  { code:'GED-202', title:'History of Emergence of Bangladesh',   ch:3   },
  { code:'MAT-112', title:'Differential & Integral Calculus',     ch:3   },
  { code:'PHY-111', title:'Physics I',                            ch:3   },
  { code:'CSE-121', title:'Structured Programming',               ch:3   },
  { code:'CSE-122', title:'Structured Programming Lab',           ch:1.5 },
  { code:'CSE-123', title:'Basic Electrical Engineering',         ch:3   },
  { code:'CSE-124', title:'Basic Electrical Engineering Lab',     ch:1.5 },
  { code:'ENG-115', title:'English II',                           ch:3   },
  { code:'GED-119', title:'Engineering Ethics and Cyber Law',     ch:2   },
  { code:'MAT-123', title:'Differential Equation & Laplace Transform', ch:3 },
  { code:'PHY-123', title:'Physics II',                           ch:3   },
  { code:'CSE-131', title:'Basic Electronics Engineering',        ch:3   },
  { code:'CSE-132', title:'Basic Electronics Engineering Lab',    ch:1.5 },
  { code:'CSE-133', title:'Data Structure',                       ch:3   },
  { code:'CSE-134', title:'Data Structure Lab',                   ch:1.5 },
  { code:'GED-213', title:'Principles of Economics and Entrepreneurship Development', ch:3 },
  { code:'MAT-135', title:'Matrices, Complex Variable & Fourier Analysis', ch:3 },
  { code:'STA-215', title:'Basic Statistics & Probability',       ch:3   },
  { code:'CSE-200', title:'Competitive Programming',              ch:1.5 },
  { code:'CSE-211', title:'Digital Logic Design',                 ch:3   },
  { code:'CSE-212', title:'Digital Logic Design Lab',             ch:1.5 },
  { code:'CSE-231', title:'Algorithm Design and Analysis',        ch:3   },
  { code:'CSE-232', title:'Algorithm Design and Analysis Lab',    ch:1.5 },
  { code:'GED-431', title:'Business Communication',               ch:3   },
  { code:'MAT-216', title:'Geometry & Vector Analysis',           ch:3   },
  { code:'CSE-213', title:'Computer Organization and Architecture', ch:3 },
  { code:'CSE-221', title:'Object Oriented Programming',          ch:3   },
  { code:'CSE-222', title:'Object Oriented Programming Lab',      ch:1.5 },
  { code:'GED-215', title:'Industrial Management and Financial Accounting', ch:3 },
  { code:'MAT-235', title:'Numerical Methods',                    ch:3   },
  { code:'CSE-223', title:'Database Management System',           ch:3   },
  { code:'CSE-224', title:'Database Management System Lab',       ch:1.5 },
  { code:'CSE-237', title:'Microprocessor and Interfacing',       ch:3   },
  { code:'CSE-238', title:'Microprocessor and Interfacing Lab',   ch:1.5 },
  { code:'CSE-327', title:'Theory of Computation',                ch:3   },
  { code:'CSE-215', title:'Communication Engineering',            ch:3   },
  { code:'CSE-321', title:'Operating System',                     ch:3   },
  { code:'CSE-322', title:'Operating System Lab',                 ch:1.5 },
  { code:'CSE-421', title:'Artificial Intelligence',              ch:3   },
  { code:'CSE-422', title:'Artificial Intelligence Lab',          ch:1.5 },
  { code:'CSE-471', title:'Machine Learning',                     ch:3   },
  { code:'CSE-472', title:'Machine Learning Lab',                 ch:1.5 },
  { code:'CSE-417', title:'Software Engineering & Design Pattern', ch:3  },
  { code:'CSE-418', title:'Software Engineering & Design Pattern Lab', ch:1.5 },
  { code:'CSE-401', title:'Computer Graphics & Image Processing', ch:3   },
  { code:'CSE-402', title:'Computer Graphics & Image Processing Lab', ch:1.5 },
];

const SEMESTER_OPTIONS = [
  '1:1 Spring 2023','1:2 Summer 2023',
  '2:1 Spring 2024','2:2 Summer 2024',
  '3:1 Spring 2025','3:2 Summer 2025','3:3 Autumn 2025',
  '4:1 Spring 2026','4:2 Summer 2026',
];

function parseSemester(s) {
  const parts = s.split(' ');
  return { code: parts[0], name: parts.slice(1).join(' ') };
}

function emptyRow(id) {
  return { _id: id, course_code:'', course_title:'', credit_hours:3, letter_grade:'', grade_point:0, status:'Regular', batch_section:'', isNew: true };
}

// ── Inline editable cell ──────────────────────────────────────
function EditableCell({ value, onChange, type='text', options, width, align='left', placeholder='' }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal]     = useState(value);
  const inputRef = useRef();

  useEffect(() => setLocal(value), [value]);

  const commit = () => { setEditing(false); if (local !== value) onChange(local); };

  if (type === 'select') {
    return (
      <td style={{ padding: '4px 6px', width, borderRight:'1px solid #e8eaed' }}>
        <select
          value={local}
          onChange={e => { setLocal(e.target.value); onChange(e.target.value); }}
          style={{
            width:'100%', border:'none', background:'transparent',
            fontSize:13, color: local ? '#202124' : '#9aa0a6',
            cursor:'pointer', outline:'none', padding:'2px 0',
          }}
        >
          <option value="">— select —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </td>
    );
  }

  return (
    <td
      style={{ padding:'4px 6px', width, borderRight:'1px solid #e8eaed', cursor:'text' }}
      onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && commit()}
          placeholder={placeholder}
          style={{
            width:'100%', border:'none', outline:'1px solid #1a73e8',
            borderRadius:4, padding:'2px 4px', fontSize:13, background:'white',
          }}
        />
      ) : (
        <span style={{ fontSize:13, color: local ? '#202124' : '#9aa0a6' }}>
          {local || placeholder}
        </span>
      )}
    </td>
  );
}

export default function ResultEntry() {
  const [studentId,  setStudentId]  = useState('');
  const [studentInfo,setStudentInfo]= useState(null);
  const [semester,   setSemester]   = useState('');
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [students,   setStudents]   = useState([]);
  const [studSearch, setStudSearch] = useState('');
  const [studLoading,setStudLoading]= useState(false);
  const rowCount = useRef(0);

  // ── load existing results when student + semester selected ─
  useEffect(() => {
    if (studentId && semester) loadExistingResults();
  }, [studentId, semester]);

  const loadExistingResults = async () => {
    setLoading(true);
    try {
      const { code } = parseSemester(semester);
      const res = await resultService.getByStudentNumber(studentId, { includeUnpublished: true });
      const existing = (res.data.results || []).filter(r => r.semester_code === code);
      if (existing.length) {
        setRows(existing.map(r => ({
          _id:          ++rowCount.current,
          id:           r.id,
          course_code:  r.course_code,
          course_title: r.course_title,
          credit_hours: parseFloat(r.credit_hours),
          letter_grade: r.letter_grade,
          grade_point:  parseFloat(r.grade_point),
          status:       r.status,
          batch_section:r.batch_section || '',
          is_published: r.is_published,
          isNew:        false,
        })));
      } else {
        setRows([emptyRow(++rowCount.current)]);
      }
      setStudentInfo(res.data.student || null);
    } catch {
      setRows([emptyRow(++rowCount.current)]);
      setStudentInfo(null);
    } finally { setLoading(false); }
  };

  // ── student search dialog ─────────────────────────────────
  const openSearch = async () => {
    setSearchOpen(true);
    setStudLoading(true);
    try {
      const res = await resultService.getStudentList();
      setStudents(res.data.students || []);
    } catch { toast.error('Could not load students'); }
    finally { setStudLoading(false); }
  };

  const selectStudent = (s) => {
    setStudentId(s.student_number);
    setStudentInfo(s);
    setSearchOpen(false);
    setStudSearch('');
  };

  // ── row operations ─────────────────────────────────────────
  const addRow = () => setRows(r => [...r, emptyRow(++rowCount.current)]);

  const removeRow = (localId) => setRows(r => r.filter(x => x._id !== localId));

  const updateRow = (localId, field, value) => {
    setRows(prev => prev.map(r => {
      if (r._id !== localId) return r;
      const updated = { ...r, [field]: value };
      if (field === 'letter_grade') updated.grade_point = gradeToPoint(value);
      if (field === 'course_code') {
        const cat = COURSE_CATALOG.find(c => c.code === value);
        if (cat) { updated.course_title = cat.title; updated.credit_hours = cat.ch; }
      }
      return updated;
    }));
  };

  // ── fill course from catalog ──────────────────────────────
  const fillFromCatalog = (localId, code) => {
    const cat = COURSE_CATALOG.find(c => c.code === code);
    if (cat) {
      setRows(prev => prev.map(r =>
        r._id === localId
          ? { ...r, course_code: cat.code, course_title: cat.title, credit_hours: cat.ch }
          : r
      ));
    }
  };

  // ── computed CGPA ─────────────────────────────────────────
  const cgpaRows  = rows.filter(r => r.credit_hours && r.grade_point !== undefined);
  const totalCH   = cgpaRows.reduce((s, r) => s + parseFloat(r.credit_hours || 0), 0);
  const totalPts  = cgpaRows.reduce((s, r) => s + parseFloat(r.credit_hours || 0) * parseFloat(r.grade_point || 0), 0);
  const semGPA    = totalCH > 0 ? (totalPts / totalCH).toFixed(2) : '—';

  // ── save all rows ─────────────────────────────────────────
  const handleSave = async () => {
    if (!studentId || !semester) return toast.error('Select a student and semester first.');
    const invalid = rows.find(r => !r.course_code || !r.letter_grade);
    if (invalid) return toast.error('All rows need a Course Code and Grade.');

    setSaving(true);
    const { code, name } = parseSemester(semester);
    try {
      await resultService.bulkSave({
        student_number: studentId,
        semester_code:  code,
        semester_name:  name,
        rows: rows.map(r => ({
          course_code:   r.course_code,
          course_title:  r.course_title,
          credit_hours:  r.credit_hours,
          letter_grade:  r.letter_grade,
          grade_point:   r.grade_point,
          status:        r.status,
          batch_section: r.batch_section,
        })),
      });
      toast.success(`✅ ${rows.length} result${rows.length > 1 ? 's' : ''} saved successfully!`);
      await loadExistingResults();
    } catch (err) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  // ── publish semester ──────────────────────────────────────
  const handlePublish = async () => {
    if (!window.confirm(`Publish all ${semester} results for ${studentId}? Students will be able to see them.`)) return;
    setPublishing(true);
    const { code } = parseSemester(semester);
    try {
      const res = await resultService.publishSemester({ student_number: studentId, semester_code: code });
      toast.success(res.data.message);
      await loadExistingResults();
    } catch (err) { toast.error(err.message); }
    finally { setPublishing(false); }
  };

  const unpublishedCount = rows.filter(r => !r.is_published).length;
  const filteredStudents = studSearch
    ? students.filter(s =>
        s.name.toLowerCase().includes(studSearch.toLowerCase()) ||
        (s.student_number || '').includes(studSearch)
      )
    : students;

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div className="page-header">
        <h5 className="page-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Edit sx={{ color:'#1a73e8' }} />
          Result Entry Sheet
        </h5>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {rows.length > 0 && studentId && semester && (
            <>
              <Button
                variant="outlined" color="success"
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                onClick={handleSave} disabled={saving}
              >
                {saving ? 'Saving…' : 'Save All'}
              </Button>
              {unpublishedCount > 0 && (
                <Button
                  variant="contained" color="warning"
                  startIcon={publishing ? <CircularProgress size={16} /> : <Publish />}
                  onClick={handlePublish} disabled={publishing}
                  sx={{ bgcolor:'#34a853', '&:hover':{ bgcolor:'#2d8e48' } }}
                >
                  {publishing ? 'Publishing…' : `Publish (${unpublishedCount})`}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Student + Semester selector ── */}
      <Paper elevation={0} sx={{ border:'1px solid #dadce0', borderRadius:2, p:2, mb:3 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>

          {/* Student ID field */}
          <div style={{ flex:1, minWidth:240 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#5f6368', marginBottom:4 }}>STUDENT ID</div>
            <div style={{ display:'flex', gap:8 }}>
              <TextField
                size="small" placeholder="e.g. 231-115-094"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && semester && loadExistingResults()}
                sx={{ flex:1 }}
                InputProps={{
                  startAdornment: <span style={{ color:'#5f6368', marginRight:4, fontSize:13 }}>ID:</span>
                }}
              />
              <Tooltip title="Browse students">
                <Button variant="outlined" size="small" onClick={openSearch} startIcon={<PersonSearch />}>
                  Browse
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Semester selector */}
          <div style={{ minWidth:220 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#5f6368', marginBottom:4 }}>SEMESTER</div>
            <FormControl size="small" fullWidth>
              <Select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                displayEmpty
              >
                <MenuItem value=""><em>Select semester</em></MenuItem>
                {SEMESTER_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </div>

          {/* Student info badge */}
          {studentInfo && (
            <div style={{
              background:'#e8f0fe', borderRadius:8, padding:'6px 14px',
              fontSize:13, color:'#1a73e8'
            }}>
              <strong>{studentInfo.name}</strong>
              {studentInfo.batch_number && (
                <span style={{ marginLeft:8, color:'#5f6368' }}>
                  CSE-{studentInfo.batch_number} [{studentInfo.batch_section}]
                </span>
              )}
              {studentInfo.cgpa && (
                <span style={{ marginLeft:8, fontWeight:700 }}>CGPA: {studentInfo.cgpa}</span>
              )}
            </div>
          )}
        </div>
      </Paper>

      {/* ── Status info ── */}
      {!studentId || !semester ? (
        <Alert severity="info" sx={{ borderRadius:2 }}>
          Enter a Student ID and select a semester to start entering results.
        </Alert>
      ) : loading ? (
        <div style={{ textAlign:'center', padding:40 }}>
          <CircularProgress /> <div style={{ marginTop:12, color:'#5f6368' }}>Loading existing results…</div>
        </div>
      ) : (
        <>
          {/* ── Spreadsheet ── */}
          <div style={{ overflowX:'auto', borderRadius:8, border:'1px solid #dadce0' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>

              {/* Column headers */}
              <thead>
                <tr style={{ background:'#1a73e8' }}>
                  <th style={{ width:36, padding:'10px 8px', color:'white', fontWeight:600, fontSize:12, borderRight:'1px solid rgba(255,255,255,0.2)' }}>#</th>
                  <th style={{ width:120, padding:'10px 8px', color:'white', fontWeight:600, fontSize:12, borderRight:'1px solid rgba(255,255,255,0.2)', textAlign:'left' }}>Course Code</th>
                  <th style={{ padding:'10px 8px', color:'white', fontWeight:600, fontSize:12, borderRight:'1px solid rgba(255,255,255,0.2)', textAlign:'left' }}>Course Title</th>
                  <th style={{ width:60,  padding:'10px 8px', color:'white', fontWeight:600, fontSize:12, borderRight:'1px solid rgba(255,255,255,0.2)', textAlign:'center' }}>CH</th>
                  <th style={{ width:80,  padding:'10px 8px', color:'white', fontWeight:600, fontSize:12, borderRight:'1px solid rgba(255,255,255,0.2)', textAlign:'center' }}>Status</th>
                  <th style={{ width:80,  padding:'10px 8px', color:'white', fontWeight:600, fontSize:12, borderRight:'1px solid rgba(255,255,255,0.2)', textAlign:'center' }}>Batch [Sec]</th>
                  <th style={{ width:70,  padding:'10px 8px', color:'white', fontWeight:600, fontSize:12, borderRight:'1px solid rgba(255,255,255,0.2)', textAlign:'center' }}>Grade</th>
                  <th style={{ width:70,  padding:'10px 8px', color:'white', fontWeight:600, fontSize:12, borderRight:'1px solid rgba(255,255,255,0.2)', textAlign:'center' }}>GP/CH</th>
                  <th style={{ width:60,  padding:'10px 8px', color:'white', fontWeight:600, fontSize:12, textAlign:'center' }}>Published</th>
                  <th style={{ width:36,  padding:'10px 8px', color:'white', textAlign:'center' }}>✕</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, idx) => {
                  const gs = gradeColor(row.letter_grade);
                  const isSaved = !!row.id;
                  return (
                    <tr key={row._id} style={{
                      background: idx % 2 === 0 ? 'white' : '#fafafa',
                      borderBottom:'1px solid #e8eaed',
                    }}>
                      {/* Row number */}
                      <td style={{ padding:'4px 8px', textAlign:'center', fontSize:12, color:'#9aa0a6', borderRight:'1px solid #e8eaed' }}>
                        {idx + 1}
                      </td>

                      {/* Course Code — with autocomplete */}
                      <td style={{ padding:'4px 6px', borderRight:'1px solid #e8eaed' }}>
                        <select
                          value={row.course_code}
                          onChange={e => updateRow(row._id, 'course_code', e.target.value)}
                          style={{ width:'100%', border:'none', background:'transparent', fontSize:13, fontWeight:600, fontFamily:'monospace', cursor:'pointer', outline:'none', color:'#202124' }}
                        >
                          <option value="">— code —</option>
                          {COURSE_CATALOG.map(c => (
                            <option key={c.code} value={c.code}>{c.code}</option>
                          ))}
                        </select>
                      </td>

                      {/* Course Title — auto-filled or editable */}
                      <EditableCell
                        value={row.course_title}
                        onChange={v => updateRow(row._id, 'course_title', v)}
                        placeholder="Course title…"
                      />

                      {/* Credit Hours */}
                      <td style={{ padding:'4px 6px', textAlign:'center', borderRight:'1px solid #e8eaed' }}>
                        <input
                          type="number" value={row.credit_hours} min={0.5} max={5} step={0.5}
                          onChange={e => updateRow(row._id, 'credit_hours', parseFloat(e.target.value))}
                          style={{ width:50, border:'none', background:'transparent', fontSize:13, textAlign:'center', outline:'none', color:'#202124' }}
                        />
                      </td>

                      {/* Status */}
                      <td style={{ padding:'4px 6px', textAlign:'center', borderRight:'1px solid #e8eaed' }}>
                        <select
                          value={row.status}
                          onChange={e => updateRow(row._id, 'status', e.target.value)}
                          style={{ border:'none', background:'transparent', fontSize:12, cursor:'pointer', outline:'none', color:'#5f6368' }}
                        >
                          <option>Regular</option>
                          <option>Irregular</option>
                          <option>Retake</option>
                          <option>Improvement</option>
                        </select>
                      </td>

                      {/* Batch Section */}
                      <EditableCell
                        value={row.batch_section}
                        onChange={v => updateRow(row._id, 'batch_section', v)}
                        placeholder="58th[C]"
                        width={80}
                        align="center"
                      />

                      {/* Grade */}
                      <td style={{ padding:'4px 6px', textAlign:'center', borderRight:'1px solid #e8eaed' }}>
                        <select
                          value={row.letter_grade}
                          onChange={e => updateRow(row._id, 'letter_grade', e.target.value)}
                          style={{
                            border:'none', borderRadius:12, padding:'2px 6px',
                            fontSize:13, fontWeight:700, cursor:'pointer', outline:'none',
                            background: gs.bg, color: gs.color,
                          }}
                        >
                          <option value="">—</option>
                          {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>

                      {/* Grade Point */}
                      <td style={{ padding:'4px 8px', textAlign:'center', fontSize:13, fontWeight:600, color:'#5f6368', borderRight:'1px solid #e8eaed' }}>
                        {row.letter_grade ? row.grade_point.toFixed(2) : '—'}
                      </td>

                      {/* Published badge */}
                      <td style={{ padding:'4px 8px', textAlign:'center', borderRight:'1px solid #e8eaed' }}>
                        {row.is_published
                          ? <CheckCircle sx={{ fontSize:16, color:'#34a853' }} />
                          : <span style={{ fontSize:10, color:'#fbbc04', fontWeight:600 }}>DRAFT</span>
                        }
                      </td>

                      {/* Delete */}
                      <td style={{ padding:'4px', textAlign:'center' }}>
                        <IconButton size="small" color="error"
                          onClick={() => removeRow(row._id)}
                          sx={{ opacity:0.6, '&:hover':{ opacity:1 } }}
                        >
                          <Close sx={{ fontSize:16 }} />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* ── Footer: totals + CGPA ── */}
              <tfoot>
                <tr style={{ background:'#f8f9fa', borderTop:'2px solid #dadce0' }}>
                  <td colSpan={3} style={{ padding:'10px 12px', fontWeight:700, fontSize:13, color:'#202124' }}>
                    Total / Semester GPA
                  </td>
                  <td style={{ padding:'10px 6px', textAlign:'center', fontWeight:700, fontSize:14, color:'#1a73e8' }}>
                    {totalCH.toFixed(1)}
                  </td>
                  <td colSpan={2} />
                  <td style={{ padding:'10px 6px', textAlign:'center' }}>
                    <span style={{
                      background: parseFloat(semGPA) >= 3.75 ? '#e6f4ea' : parseFloat(semGPA) >= 3.0 ? '#e8f0fe' : '#fce8e6',
                      color:      parseFloat(semGPA) >= 3.75 ? '#137333' : parseFloat(semGPA) >= 3.0 ? '#1a73e8' : '#c5221f',
                      borderRadius:12, padding:'3px 10px', fontWeight:800, fontSize:14
                    }}>
                      {semGPA}
                    </span>
                  </td>
                  <td colSpan={3} style={{ padding:'10px 12px', fontSize:12, color:'#5f6368' }}>
                    Semester GPA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Add row button ── */}
          <Button
            startIcon={<Add />}
            onClick={addRow}
            sx={{ mt:1.5, borderRadius:8, textTransform:'none', color:'#1a73e8' }}
          >
            Add Course Row
          </Button>

          {/* ── Quick-fill from catalog ── */}
          <div style={{ marginTop:16, padding:'12px 16px', background:'#f8f9fa', borderRadius:8, fontSize:12, color:'#5f6368' }}>
            💡 <strong>Tip:</strong> Select a Course Code from the dropdown — the title and credit hours fill automatically.
            After entering all grades, click <strong>Save All</strong>, then <strong>Publish</strong> to make visible to students.
          </div>

          {/* ── CSV Bulk Import ── */}
          <div style={{ marginTop:16, padding:'16px', border:'1px dashed #1a73e8', borderRadius:8, background:'#f8fbff' }}>
            <div style={{ fontWeight:600, fontSize:13, color:'#1a73e8', marginBottom:8 }}>
              📥 Bulk Import from CSV
            </div>
            <div style={{ fontSize:12, color:'#5f6368', marginBottom:12 }}>
              Upload a CSV file to import results for multiple students at once.
              Required columns: <code style={{ background:'#e8f0fe', padding:'1px 4px', borderRadius:3 }}>student_number</code>{', '}
              <code style={{ background:'#e8f0fe', padding:'1px 4px', borderRadius:3 }}>course_code</code>{', '}
              <code style={{ background:'#e8f0fe', padding:'1px 4px', borderRadius:3 }}>letter_grade</code>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <input
                type="file" accept=".csv" id="csv-import"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file || !semester) { if (!semester) toast.error('Select a semester first.'); return; }
                  const { code, name } = parseSemester(semester);
                  const formData = new FormData();
                  formData.append('csv', file);
                  formData.append('semester_code', code);
                  formData.append('semester_name', name);
                  try {
                    const { resultService } = await import('../../services/api');
                    const res = await resultService.importCSV(formData);
                    toast.success(res.data.message);
                    if (res.data.errors?.length) toast.warning(`${res.data.errors.length} rows skipped.`);
                    if (studentId) await loadExistingResults();
                  } catch (err) { toast.error(err.message || 'Import failed'); }
                  e.target.value = '';
                }}
                style={{ display:'none' }}
              />
              <label htmlFor="csv-import">
                <Button variant="outlined" size="small" component="span" disabled={!semester}>
                  Choose CSV File
                </Button>
              </label>
              <Button
                variant="text" size="small"
                onClick={() => {
                  const header = 'student_number,course_code,course_title,credit_hours,letter_grade,batch_section\n';
                  const ex1 = '231-115-094,CSE-421,Artificial Intelligence,3,A+,58th[C]\n';
                  const ex2 = '231-115-095,CSE-421,Artificial Intelligence,3,A,58th[C]\n';
                  const blob = new Blob([header+ex1+ex2], {type:'text/csv'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href=url; a.download='result_template.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download Template
              </Button>
              {!semester && <span style={{ fontSize:11, color:'#ea4335' }}>Select a semester first</span>}
            </div>
          </div>
        </>
      )}

      {/* ── Student search dialog ── */}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle sx={{ fontWeight:700, pb:1 }}>
          <PersonSearch sx={{ mr:1, verticalAlign:'middle', color:'#1a73e8' }} />
          Select Student
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus fullWidth size="small" placeholder="Search by name or student ID…"
            value={studSearch} onChange={e => setStudSearch(e.target.value)}
            sx={{ mb:2 }}
          />
          {studLoading ? (
            <div style={{ textAlign:'center', padding:24 }}><CircularProgress size={28} /></div>
          ) : (
            <div style={{ maxHeight:400, overflowY:'auto' }}>
              {filteredStudents.length === 0 ? (
                <div style={{ textAlign:'center', padding:24, color:'#5f6368' }}>
                  No students found. Make sure students have registered with their Student ID.
                </div>
              ) : (
                filteredStudents.map(s => (
                  <div
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'10px 12px', borderRadius:8, cursor:'pointer',
                      marginBottom:4, border:'1px solid #e8eaed',
                      transition:'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='#f1f3f4'}
                    onMouseLeave={e => e.currentTarget.style.background='white'}
                  >
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{s.name}</div>
                      <div style={{ fontSize:12, color:'#5f6368', marginTop:2, display:'flex', gap:10 }}>
                        <span>ID: <strong style={{ fontFamily:'monospace' }}>{s.student_number}</strong></span>
                        {s.batch_number && <span>CSE-{s.batch_number} [{s.batch_section}]</span>}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      {s.cgpa && (
                        <span style={{
                          background:'#e8f0fe', color:'#1a73e8',
                          padding:'2px 10px', borderRadius:12, fontWeight:700, fontSize:13
                        }}>CGPA: {s.cgpa}</span>
                      )}
                      <div style={{ fontSize:11, color:'#9aa0a6', marginTop:2 }}>
                        {s.result_count} results
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p:2 }}>
          <Button onClick={() => setSearchOpen(false)}>Cancel</Button>
          {studentId && (
            <Button variant="contained" onClick={() => { setSearchOpen(false); }}>
              Use ID: {studentId}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}
