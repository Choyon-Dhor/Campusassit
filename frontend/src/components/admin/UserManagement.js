// src/components/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Button, TextField, Select, MenuItem, FormControl,
  InputLabel, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Skeleton, Avatar, CircularProgress,
  Card, CardContent, Grid
} from '@mui/material';
import {
  Search, Edit, Block, CheckCircle, ManageAccounts,
  People, School, Person, AdminPanelSettings, Refresh
} from '@mui/icons-material';
import { authService } from '../../services/api';
import { toast } from 'react-toastify';
import api from '../../services/api';

const roleColors = { admin:'#ea4335', teacher:'#34a853', student:'#1a73e8' };

export default function UserManagement() {
  const [users,     setUsers]     = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [roleFilter,setRoleFilter]= useState('');
  const [editUser,  setEditUser]  = useState(null);
  const [editForm,  setEditForm]  = useState({});
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    let list = users;
    if (roleFilter) list = list.filter(u => u.role === roleFilter);
    if (search)     list = list.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.student_number||'').includes(search)
    );
    setFiltered(list);
  }, [users, search, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await authService.getAllUsers();
      setUsers(res.data.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      name:           u.name,
      department:     u.department || '',
      student_number: u.student_number || '',
      batch_number:   u.batch_number   || '',
      batch_section:  u.batch_section  || '',
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      // Admin updates another user — use a specific endpoint
      await api.put(`/auth/admin/users/${editUser.id}`, editForm);
      toast.success('User updated.');
      setEditUser(null);
      loadUsers();
    } catch (err) { toast.error(err.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (u) => {
    const action = u.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} ${u.name}?`)) return;
    try {
      await api.patch(`/auth/admin/users/${u.id}/toggle`);
      toast.success(`User ${action}d.`);
      loadUsers();
    } catch (err) { toast.error(err.message); }
  };

  // Stats
  const stats = {
    total:    users.length,
    students: users.filter(u=>u.role==='student').length,
    teachers: users.filter(u=>u.role==='teacher').length,
    admins:   users.filter(u=>u.role==='admin').length,
    withId:   users.filter(u=>u.student_number).length,
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h5 className="page-title">
          <ManageAccounts sx={{ mr:1, verticalAlign:'middle', color:'#1a73e8' }} />
          User Management
        </h5>
        <Button startIcon={<Refresh />} onClick={loadUsers} variant="outlined" size="small">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb:3 }}>
        {[
          { icon:<People />,       label:'Total Users',     value:stats.total,    color:'#1a73e8', bg:'#e8f0fe' },
          { icon:<School />,       label:'Students',        value:stats.students, color:'#34a853', bg:'#e6f4ea' },
          { icon:<Person />,       label:'Teachers',        value:stats.teachers, color:'#fbbc04', bg:'#fef7e0' },
          { icon:<AdminPanelSettings/>,label:'With Student ID', value:stats.withId, color:'#ea4335', bg:'#fce8e6' },
        ].map((s,i)=>(
          <Grid item xs={6} sm={3} key={i}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:s.bg }}>
                <span style={{ color:s.color, display:'flex' }}>{s.icon}</span>
              </div>
              <div>
                <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#5f6368', fontSize:18 }} />
          <input
            placeholder="Search by name, email, or student ID…"
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1px solid #dadce0', borderRadius:8, fontSize:14, outline:'none' }}
          />
        </div>
        <FormControl size="small" sx={{ minWidth:140 }}>
          <InputLabel>Role</InputLabel>
          <Select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} label="Role">
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="teacher">Teacher</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* Table */}
      <div className="ca-card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor:'#f1f3f4' }}>
                <TableCell sx={{ fontWeight:700, fontSize:12 }}>User</TableCell>
                <TableCell sx={{ fontWeight:700, fontSize:12 }}>Role</TableCell>
                <TableCell sx={{ fontWeight:700, fontSize:12 }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight:700, fontSize:12 }}>Batch</TableCell>
                <TableCell sx={{ fontWeight:700, fontSize:12 }}>Department</TableCell>
                <TableCell sx={{ fontWeight:700, fontSize:12 }}>Status</TableCell>
                <TableCell sx={{ fontWeight:700, fontSize:12 }}>Joined</TableCell>
                <TableCell sx={{ fontWeight:700, fontSize:12, textAlign:'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_,i)=>(
                  <TableRow key={i}>
                    <TableCell colSpan={8}><Skeleton variant="text" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py:6, color:'#5f6368' }}>
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(u => (
                  <TableRow key={u.id} hover sx={{ opacity: u.is_active===false ? 0.5 : 1 }}>
                    <TableCell>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar sx={{ width:32, height:32, fontSize:13, bgcolor:roleColors[u.role]||'#1a73e8' }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                          <div style={{ fontSize:11, color:'#5f6368' }}>{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip label={u.role} size="small"
                        sx={{ height:20, fontSize:10, fontWeight:700,
                          bgcolor:roleColors[u.role]+'20', color:roleColors[u.role] }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily:'monospace', fontSize:12, color:'#1a73e8', fontWeight:600 }}>
                      {u.student_number || <span style={{ color:'#9aa0a6' }}>—</span>}
                    </TableCell>
                    <TableCell sx={{ fontSize:12 }}>
                      {u.batch_number
                        ? <span>CSE-{u.batch_number} <strong>[{u.batch_section}]</strong></span>
                        : <span style={{ color:'#9aa0a6' }}>—</span>}
                    </TableCell>
                    <TableCell sx={{ fontSize:12 }}>{u.department || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.is_active===false ? 'Inactive' : 'Active'}
                        size="small"
                        sx={{ height:20, fontSize:10, fontWeight:600,
                          bgcolor: u.is_active===false ? '#fce8e6' : '#e6f4ea',
                          color:   u.is_active===false ? '#c5221f' : '#137333' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize:11, color:'#5f6368' }}>
                      {new Date(u.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit user">
                        <IconButton size="small" onClick={()=>openEdit(u)}>
                          <Edit sx={{ fontSize:16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={u.is_active===false ? 'Activate' : 'Deactivate'}>
                        <IconButton size="small"
                          color={u.is_active===false ? 'success' : 'error'}
                          onClick={()=>handleToggleActive(u)}>
                          {u.is_active===false
                            ? <CheckCircle sx={{ fontSize:16 }} />
                            : <Block sx={{ fontSize:16 }} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!loading && (
          <div style={{ padding:'8px 16px', fontSize:12, color:'#5f6368', borderTop:'1px solid #f1f3f4' }}>
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onClose={()=>setEditUser(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle sx={{ fontWeight:700 }}>
          <Edit sx={{ mr:1, verticalAlign:'middle', color:'#1a73e8', fontSize:20 }} />
          Edit User — {editUser?.name}
        </DialogTitle>
        <DialogContent dividers>
          {editUser?.role === 'student' && (
            <Alert severity="info" sx={{ mb:2, borderRadius:2 }}>
              The Student ID links this account to results. Make sure it matches the university record.
            </Alert>
          )}
          <TextField
            label="Full Name" fullWidth value={editForm.name||''}
            onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} sx={{ mb:2 }}
          />
          <TextField
            label="Department" fullWidth value={editForm.department||''}
            onChange={e=>setEditForm(f=>({...f,department:e.target.value}))} sx={{ mb:2 }}
          />
          {editUser?.role === 'student' && (
            <>
              <TextField
                label="Student ID" fullWidth value={editForm.student_number||''}
                onChange={e=>setEditForm(f=>({...f,student_number:e.target.value}))}
                placeholder="e.g. 231-115-094" sx={{ mb:2 }}
                helperText="University-issued ID. Used to link results."
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Batch Number" fullWidth type="number"
                    value={editForm.batch_number||''}
                    onChange={e=>setEditForm(f=>({...f,batch_number:e.target.value}))}
                    placeholder="e.g. 58"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Batch Section" fullWidth
                    value={editForm.batch_section||''}
                    onChange={e=>setEditForm(f=>({...f,batch_section:e.target.value}))}
                    placeholder="e.g. C+G"
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p:2 }}>
          <Button onClick={()=>setEditUser(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving}>
            {saving ? <CircularProgress size={18}/> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
