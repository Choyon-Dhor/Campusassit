// src/components/results/ResultPortal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Grid, Card, CardContent, CardHeader, Chip, Button,
  TextField, Tab, Tabs, Table, TableHead, TableRow,
  TableCell, TableBody, Skeleton, Alert, Tooltip,
  CircularProgress, Divider
} from '@mui/material';
import {
  EmojiEvents, School, Print, Search, TrendingUp,
  CheckCircle, StarRate
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { resultService } from '../../services/api';
import { toast } from 'react-toastify';

// Grade color map
const gradeStyle = {
  'A+': { bg: '#e6f4ea', color: '#137333' },
  'A':  { bg: '#e6f4ea', color: '#1e7e34' },
  'A-': { bg: '#e6f4ea', color: '#388e3c' },
  'B+': { bg: '#e8f0fe', color: '#1565c0' },
  'B':  { bg: '#e8f0fe', color: '#1976d2' },
  'B-': { bg: '#e8f0fe', color: '#1e88e5' },
  'C+': { bg: '#fef7e0', color: '#e37400' },
  'C':  { bg: '#fef7e0', color: '#f57c00' },
  'D':  { bg: '#fce8e6', color: '#c62828' },
  'F':  { bg: '#fce8e6', color: '#b71c1c' },
};

function CGPAGauge({ cgpa }) {
  const pct = Math.min(100, (cgpa / 4.0) * 100);
  const color = cgpa >= 3.75 ? '#34a853' : cgpa >= 3.5 ? '#1a73e8' : cgpa >= 3.0 ? '#fbbc04' : '#ea4335';
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        position: 'relative', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="58" fill="none" stroke="#f1f3f4" strokeWidth="14" />
          <circle cx="70" cy="70" r="58" fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={`${2 * Math.PI * 58}`}
            strokeDashoffset={`${2 * Math.PI * 58 * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color, lineHeight: 1 }}>{cgpa.toFixed(2)}</div>
          <div style={{ fontSize: '11px', color: '#5f6368', marginTop: 2 }}>CGPA / 4.00</div>
        </div>
      </div>
    </div>
  );
}

function SemesterTable({ semData }) {
  const semGPA = semData.gpa;
  const gStyle = gradeStyle[semData.courses[0]?.letter_grade] || {};
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 8, padding: '8px 0'
      }}>
        <span style={{
          background: '#1a73e8', color: 'white',
          padding: '2px 12px', borderRadius: 20,
          fontSize: 13, fontWeight: 700
        }}>
          {semData.code} — {semData.name}
        </span>
        <span style={{ fontSize: 12, color: '#5f6368' }}>
          GPA: <strong style={{ color: '#1a73e8' }}>{semGPA.toFixed(2)}</strong>
          {' · '}
          Credits: <strong>{semData.semesterCredits.toFixed(1)}</strong>
        </span>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #dadce0' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, width: '100px' }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Course Title</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, textAlign: 'center', width: 70 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, textAlign: 'center', width: 50 }}>CH</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, textAlign: 'center', width: 80 }}>Batch</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, textAlign: 'center', width: 60 }}>Grade</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, textAlign: 'center', width: 70 }}>GP/CH</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {semData.courses.map((c, i) => {
              const gs = gradeStyle[c.letter_grade] || { bg: '#f1f3f4', color: '#202124' };
              return (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, fontFamily: 'monospace' }}>{c.course_code}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{c.course_title}</TableCell>
                  <TableCell align="center">
                    <Chip label={c.status} size="small"
                      sx={{ height: 18, fontSize: 10, bgcolor: '#e6f4ea', color: '#137333' }} />
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 12 }}>{parseFloat(c.credit_hours).toFixed(1)}</TableCell>
                  <TableCell align="center" sx={{ fontSize: 11, color: '#5f6368' }}>{c.batch_section}</TableCell>
                  <TableCell align="center">
                    <span style={{
                      ...gs, padding: '2px 8px', borderRadius: 12,
                      fontSize: 12, fontWeight: 700
                    }}>{c.letter_grade}</span>
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 12, fontWeight: 600 }}>
                    {parseFloat(c.grade_point).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function ResultPortal() {
  const { user, isTeacherOrAdmin } = useAuth();
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchNum, setSearchNum] = useState('');
  const [searching, setSearching] = useState(false);
  const printRef = useRef();

  useEffect(() => { loadMyResults(); }, []);

  const loadMyResults = async () => {
    setLoading(true);
    try {
      const res = await resultService.getMyResults();
      setData(res.data);
    } catch { toast.error('Could not load results'); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchNum.trim()) return;
    setSearching(true);
    try {
      const res = await resultService.getByStudentNumber(searchNum.trim());
      setData(res.data);
      toast.success(`Results loaded for ${searchNum}`);
    } catch { toast.error('Student not found or no published results.'); }
    finally { setSearching(false); }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-area');
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head>
        <title>Academic Transcript</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
          h2 { text-align: center; margin-bottom: 4px; }
          h4 { text-align: center; color: #555; margin-top: 0; }
          .info { margin-bottom: 16px; }
          .sem-header { background: #1a73e8; color: white; padding: 4px 12px; border-radius: 12px; display: inline-block; margin-bottom: 6px; font-weight: bold; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #f1f3f4; text-align: left; padding: 5px 8px; font-size: 11px; border: 1px solid #ddd; }
          td { padding: 4px 8px; border: 1px solid #eee; font-size: 11px; }
          .grade { text-align: center; font-weight: bold; }
          .cgpa-box { text-align: right; font-size: 16px; font-weight: bold; margin-top: 12px; border-top: 2px solid #1a73e8; padding-top: 8px; }
          .note { font-size: 10px; color: #888; margin-top: 20px; text-align: center; }
          @media print { body { margin: 0; } }
        </style>
      </head><body>
        ${printContent.innerHTML}
        <div class="note">This is a draft academic record. It is not an official document without authorized seal &amp; signature.</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const summary = data?.summary;
  const semesters = summary ? Object.values(summary.semesters).sort((a,b) => a.code.localeCompare(b.code)) : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title">
          <School sx={{ mr: 1, verticalAlign: 'middle', color: '#1a73e8' }} />
          Result Portal
        </h5>
        <div style={{ display: 'flex', gap: 8 }}>
          {data && (
            <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
              Print / Export PDF
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #dadce0' }}>
        <Tab label="My Results" />
        {isTeacherOrAdmin && <Tab label="Search by Student ID" />}
      </Tabs>

      {/* ── Tab 1: Search (admin/faculty) ── */}
      {tab === 1 && isTeacherOrAdmin && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <TextField
            label="Student Number (e.g. 231-115-094)"
            value={searchNum}
            onChange={e => setSearchNum(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            size="small"
            sx={{ width: 320 }}
          />
          <Button variant="contained" startIcon={<Search />} onClick={handleSearch} disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </Button>
          <Button variant="outlined" onClick={() => { setSearchNum('231-115-094'); }}>
            Demo: 231-115-094
          </Button>
        </div>
      )}

      {loading ? (
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Skeleton variant="rounded" height={200} /></Grid>
          <Grid item xs={12} md={9}><Skeleton variant="rounded" height={400} /></Grid>
        </Grid>
      ) : !data || !summary ? (
        <div className="empty-state ca-card" style={{ padding: 60 }}>
          <School sx={{ fontSize: 64, opacity: 0.3 }} />
          <h6>No Results Published</h6>
          <p>Your results will appear here once published by your faculty.</p>
        </div>
      ) : (
        <Grid container spacing={3}>
          {/* ── Left: Summary ── */}
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, position: 'sticky', top: 80 }}>
              <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#5f6368', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Academic Summary
                </div>
                <CGPAGauge cgpa={summary.cgpa} />
                <Divider sx={{ my: 1.5 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px' }}>
                  <span style={{ fontSize: 12, color: '#5f6368' }}>Total Credits</span>
                  <strong style={{ fontSize: 13 }}>{summary.totalCredits}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px' }}>
                  <span style={{ fontSize: 12, color: '#5f6368' }}>Semesters</span>
                  <strong style={{ fontSize: 13 }}>{summary.totalSemesters}</strong>
                </div>
                {data.studentNumber && (
                  <div style={{ marginTop: 12, padding: '8px', background: '#f8f9fa', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#5f6368' }}>Student ID</div>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{data.studentNumber}</div>
                  </div>
                )}
                <Divider sx={{ my: 1.5 }} />
                {/* Per-semester GPA mini list */}
                {semesters.map(sem => (
                  <div key={sem.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', fontSize: 12 }}>
                    <span style={{ color: '#5f6368' }}>{sem.code} {sem.name.split(' ')[0]}</span>
                    <strong style={{ color: sem.gpa >= 3.75 ? '#34a853' : sem.gpa >= 3.5 ? '#1a73e8' : '#fbbc04' }}>
                      {sem.gpa.toFixed(2)}
                    </strong>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* ── Right: Semester tables ── */}
          <Grid item xs={12} md={9}>
            <div id="print-area" ref={printRef}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Google Sans', fontWeight: 700, margin: '0 0 4px', fontSize: '1.4rem' }}>
                  Metropolitan University, Sylhet
                </h2>
                <div style={{ fontSize: 13, color: '#5f6368' }}>
                  Department of Computer Science and Engineering
                </div>
                {data.studentNumber && (
                  <Alert severity="info" icon={<School />} sx={{ mt: 1.5, borderRadius: 2 }}>
                    <strong>Student ID:</strong> {data.studentNumber} &nbsp;·&nbsp;
                    <strong>CGPA:</strong> {summary.cgpa.toFixed(2)} &nbsp;·&nbsp;
                    <strong>Credits:</strong> {summary.totalCredits}
                  </Alert>
                )}
              </div>
              {semesters.map(sem => <SemesterTable key={sem.code} semData={sem} />)}
              <div style={{ textAlign: 'right', padding: '12px 0', borderTop: '2px solid #1a73e8', marginTop: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>
                  Overall CGPA: <span style={{ color: '#1a73e8', fontSize: 20 }}>{summary.cgpa.toFixed(2)}</span> / 4.00
                </span>
                <div style={{ fontSize: 12, color: '#5f6368' }}>
                  Credit Completed: {summary.totalCredits}
                </div>
              </div>
            </div>
          </Grid>
        </Grid>
      )}
    </div>
  );
}
