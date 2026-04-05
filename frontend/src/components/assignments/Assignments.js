// src/components/assignments/Assignments.js
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  LinearProgress, Alert, Divider, CardHeader, IconButton,
  Menu, MenuItem, ListItemIcon, ListItemText, Fab
} from '@mui/material';
import {
  Add, Assignment, Edit, Delete, MoreVert, UploadFile,
  Schedule, Grade, Person, Description, AttachFile
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { assignmentService } from '../../services/api';
import { readCollection } from '../../services/contracts';
import { toast } from 'react-toastify';
import AssignmentForm from './AssignmentForm';
import AssignmentDetail from './AssignmentDetail';

const hasAttachment = (item) => Boolean(item?.file_path || item?.attachments?.length);

export default function Assignments({ classroomId, onDataChange }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuAssignment, setMenuAssignment] = useState(null);

  useEffect(() => {
    if (classroomId) {
      fetchAssignments();
    }
  }, [classroomId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAssignments({ classroom_id: classroomId });
      setAssignments(readCollection(response, 'assignments'));
    } catch (error) {
      toast.error('Failed to load assignments');
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (formData) => {
    try {
      await assignmentService.createAssignment(formData);
      toast.success('Assignment created successfully');
      setShowCreateForm(false);
      await fetchAssignments();
      if (onDataChange) await onDataChange();
    } catch (error) {
      toast.error('Failed to create assignment');
      console.error('Error creating assignment:', error);
    }
  };

  const handleUpdateAssignment = async (id, formData) => {
    try {
      await assignmentService.updateAssignment(id, formData);
      toast.success('Assignment updated successfully');
      setEditingAssignment(null);
      setShowDetail(false);
      await fetchAssignments();
      if (onDataChange) await onDataChange();
    } catch (error) {
      toast.error('Failed to update assignment');
      console.error('Error updating assignment:', error);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await assignmentService.deleteAssignment(id);
      toast.success('Assignment deleted successfully');
      setShowDetail(false);
      setSelectedAssignment(null);
      await fetchAssignments();
      if (onDataChange) await onDataChange();
    } catch (error) {
      toast.error('Failed to delete assignment');
      console.error('Error deleting assignment:', error);
    }
  };

  const handleMenuOpen = (event, assignment) => {
    setMenuAnchor(event.currentTarget);
    setMenuAssignment(assignment);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuAssignment(null);
  };

  const getStatusColor = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'error'; // Overdue
    if (diffDays <= 1) return 'warning'; // Due soon
    return 'success'; // Due later
  };

  const getStatusText = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    return `Due in ${diffDays} days`;
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Assignments
        </Typography>
        {isTeacher && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
          >
            Create Assignment
          </Button>
        )}
      </Box>

      {assignments.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No assignments found for this classroom.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {assignments.map((assignment) => (
            <Grid item xs={12} md={6} lg={4} key={assignment.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                }}
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setShowDetail(true);
                }}
              >
                <CardHeader
                  title={assignment.title}
                  subheader={`Due: ${new Date(assignment.due_date).toLocaleDateString()}`}
                  action={
                    isTeacher && (
                      <IconButton onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, assignment);
                      }}>
                        <MoreVert />
                      </IconButton>
                    )
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {assignment.description?.length > 100
                      ? `${assignment.description.substring(0, 100)}...`
                      : assignment.description
                    }
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Chip
                      label={`${assignment.points} points`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={getStatusText(assignment.due_date)}
                      size="small"
                      color={getStatusColor(assignment.due_date)}
                    />
                  </Box>

                  {hasAttachment(assignment) && (
                    <Box display="flex" alignItems="center" mt={1}>
                      <AttachFile fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Attachment available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menu for teacher actions */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setEditingAssignment(menuAssignment);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteAssignment(menuAssignment.id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Assignment Dialog */}
      <Dialog
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Assignment</DialogTitle>
        <DialogContent>
          <AssignmentForm
            classroomId={classroomId}
            onSubmit={handleCreateAssignment}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog
        open={Boolean(editingAssignment)}
        onClose={() => setEditingAssignment(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Assignment</DialogTitle>
        <DialogContent>
          <AssignmentForm
            classroomId={classroomId}
            assignment={editingAssignment}
            onSubmit={(formData) => handleUpdateAssignment(editingAssignment.id, formData)}
            onCancel={() => setEditingAssignment(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Dialog */}
      <Dialog
        open={showDetail}
        onClose={() => setShowDetail(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedAssignment && (
            <AssignmentDetail
              assignment={selectedAssignment}
              onClose={() => setShowDetail(false)}
              onUpdate={fetchAssignments}
              onDataChange={onDataChange}
              onEdit={(assignmentToEdit) => {
                setShowDetail(false);
                setEditingAssignment(assignmentToEdit);
              }}
              onDelete={(assignmentId) => handleDeleteAssignment(assignmentId)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
