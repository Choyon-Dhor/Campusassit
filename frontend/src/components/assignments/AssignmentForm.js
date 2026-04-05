// src/components/assignments/AssignmentForm.js
import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Grid, Typography, FormControl,
  InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { UploadFile, Save, Cancel } from '@mui/icons-material';
import { toast } from 'react-toastify';

const getAttachmentName = (item) => {
  if (item?.file_path) return item.file_path.split('/').pop();
  if (item?.attachments?.length) {
    const first = item.attachments[0];
    const raw = typeof first === 'string' ? first : first?.file_path || first?.path || first?.filename;
    return raw ? raw.split('/').pop() : '';
  }
  return '';
};

export default function AssignmentForm({ classroomId, assignment, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    classroom_id: classroomId,
    title: '',
    description: '',
    due_date: '',
    points: 100,
    file: null
  });
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignment) {
      setFormData({
        classroom_id: classroomId,
        title: assignment.title || '',
        description: assignment.description || '',
        due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '',
        points: assignment.points || 100,
        file: null
      });
    }
  }, [assignment, classroomId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.due_date) {
      toast.error('Due date is required');
      return;
    }

    if (formData.points < 0) {
      toast.error('Points must be a positive number');
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('classroom_id', formData.classroom_id);
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('due_date', formData.due_date);
      submitData.append('points', formData.points);

      if (formData.file) {
        submitData.append('file', formData.file);
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting assignment form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Assignment Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            variant="outlined"
            placeholder="Describe the assignment requirements, instructions, and any additional details..."
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Due Date & Time"
            name="due_date"
            type="datetime-local"
            value={formData.due_date}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Points"
            name="points"
            type="number"
            value={formData.points}
            onChange={handleChange}
            required
            inputProps={{ min: 0, max: 1000 }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12}>
          <Box>
            <input
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.gif"
              style={{ display: 'none' }}
              id="assignment-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="assignment-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadFile />}
                sx={{ mb: 1 }}
              >
                {assignment ? 'Replace Attachment' : 'Add Attachment'}
              </Button>
            </label>
            {fileName && (
              <Typography variant="body2" color="text.secondary">
                Selected: {fileName}
              </Typography>
            )}
            {getAttachmentName(assignment) && !fileName && (
              <Typography variant="body2" color="text.secondary">
                Current attachment: {getAttachmentName(assignment)}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" display="block">
              Supported formats: PDF, DOC, PPT, XLS, TXT, ZIP, Images
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Students will be notified when you create this assignment.
              Make sure all details are correct before submitting.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button
          type="button"
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          startIcon={<Cancel />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={<Save />}
        >
          {loading ? 'Saving...' : (assignment ? 'Update Assignment' : 'Create Assignment')}
        </Button>
      </Box>
    </Box>
  );
}
