// src/components/assignments/AssignmentDetail.js
import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, IconButton,
  LinearProgress, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography
} from '@mui/material';
import {
  AttachFile, Close, Description, Grade, Person, Schedule,
  UploadFile, Edit, Delete
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { useAuth } from '../../context/AuthContext';
import { assignmentService } from '../../services/api';
import { readCollection, readEntity } from '../../services/contracts';

const getAttachmentPath = (item) => {
  if (item?.file_path) return item.file_path;
  if (item?.attachments?.length) {
    const first = item.attachments[0];
    return typeof first === 'string'
      ? first
      : first?.file_path || first?.path || first?.filename || null;
  }
  return null;
};

const getAttachmentName = (item) => {
  const filePath = getAttachmentPath(item);
  return filePath ? filePath.split('/').pop() : '';
};

const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function AssignmentDetail({ assignment, onClose, onUpdate, onDataChange, onEdit, onDelete }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const canSubmitBeforeDue = !isTeacher && new Date() <= new Date(assignment.due_date);

  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitForm, setSubmitForm] = useState({ file: null, comments: '' });
  const [fileName, setFileName] = useState('');
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (isTeacher) {
          const res = await assignmentService.getSubmissions({ assignment_id: assignment.id });
          setSubmissions(readCollection(res, 'submissions'));
          return;
        }

        try {
          const res = await assignmentService.getMySubmission(assignment.id);
          setMySubmission(readEntity(res, 'submission'));
        } catch (_) {
          setMySubmission(null);
        }
      } catch (error) {
        console.error('Error fetching assignment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignment.id, isTeacher]);

  const refreshData = async () => {
    try {
      setLoading(true);

      if (isTeacher) {
        const res = await assignmentService.getSubmissions({ assignment_id: assignment.id });
        setSubmissions(readCollection(res, 'submissions'));
      } else {
        const res = await assignmentService.getMySubmission(assignment.id);
        setMySubmission(readEntity(res, 'submission'));
      }
    } catch (error) {
      console.error('Error refreshing assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSubmitForm((prev) => ({ ...prev, file }));
    setFileName(file.name);
  };

  const handleSubmit = async () => {
    if (!submitForm.file) {
      toast.error('Please select a file to submit');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', submitForm.file);
      if (submitForm.comments.trim()) {
        formData.append('submission_text', submitForm.comments.trim());
      }

      await assignmentService.submitAssignment(assignment.id, formData);
      toast.success('Assignment submitted successfully');

      setShowSubmitDialog(false);
      setSubmitForm({ file: null, comments: '' });
      setFileName('');

      await refreshData();
      if (onUpdate) await onUpdate();
      if (onDataChange) await onDataChange();
    } catch (error) {
      toast.error('Failed to submit assignment');
      console.error('Error submitting assignment:', error);
    }
  };

  const openSubmitDialog = () => {
    setSubmitForm({ file: null, comments: mySubmission?.submission_text || '' });
    setFileName('');
    setShowSubmitDialog(true);
  };

  const handleGrade = async (submissionId) => {
    if (!gradeForm.grade || gradeForm.grade < 0 || gradeForm.grade > assignment.points) {
      toast.error(`Grade must be between 0 and ${assignment.points}`);
      return;
    }

    try {
      await assignmentService.gradeSubmission(submissionId, {
        grade: parseFloat(gradeForm.grade),
        feedback: gradeForm.feedback.trim(),
      });

      toast.success('Submission graded successfully');
      setGradingSubmission(null);
      setGradeForm({ grade: '', feedback: '' });
      await refreshData();
      if (onUpdate) await onUpdate();
      if (onDataChange) await onDataChange();
    } catch (error) {
      toast.error('Failed to grade submission');
      console.error('Error grading submission:', error);
    }
  };

  const downloadAssignmentFile = async () => {
    try {
      const res = await assignmentService.downloadAssignment(assignment.id);
      saveBlob(res.data, getAttachmentName(assignment) || `${assignment.title}.bin`);
    } catch (error) {
      toast.error('Failed to download assignment file');
      console.error('Error downloading assignment file:', error);
    }
  };

  const downloadSubmissionFile = async (submission) => {
    try {
      const res = await assignmentService.downloadSubmission(submission.id);
      saveBlob(res.data, getAttachmentName(submission) || `submission-${submission.id}.bin`);
    } catch (error) {
      toast.error('Failed to download submission');
      console.error('Error downloading submission:', error);
    }
  };

  const getStatusColor = (dueDate, submittedAt) => {
    const now = new Date();
    const due = new Date(dueDate);

    if (submittedAt) return 'success';
    if (now > due) return 'error';
    return 'warning';
  };

  const getStatusText = (dueDate, submittedAt) => {
    if (submittedAt) return 'Submitted';

    const now = new Date();
    const due = new Date(dueDate);
    if (now > due) return 'Overdue';
    return 'Pending';
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ minHeight: '80vh', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box flex={1}>
          <Typography variant="h4" component="h1" gutterBottom>
            {assignment.title}
          </Typography>
          <Box display="flex" gap={2} mb={2}>
            <Chip
              icon={<Schedule />}
              label={`Due: ${new Date(assignment.due_date).toLocaleString()}`}
              color={getStatusColor(assignment.due_date, mySubmission?.submitted_at)}
              variant="outlined"
            />
            <Chip
              icon={<Grade />}
              label={`${assignment.points} points`}
              color="primary"
              variant="outlined"
            />
            {!isTeacher && (
              <Chip
                label={getStatusText(assignment.due_date, mySubmission?.submitted_at)}
                color={getStatusColor(assignment.due_date, mySubmission?.submitted_at)}
              />
            )}
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {isTeacher && onEdit && (
            <Button variant="outlined" startIcon={<Edit />} onClick={() => onEdit(assignment)}>
              Edit
            </Button>
          )}
          {isTeacher && onDelete && (
            <Button color="error" variant="outlined" startIcon={<Delete />} onClick={() => onDelete(assignment.id)}>
              Delete
            </Button>
          )}
          <IconButton onClick={onClose} size="large">
            <Close />
          </IconButton>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
            Assignment Details
          </Typography>
          <Typography variant="body1" paragraph>
            {assignment.description}
          </Typography>

          {getAttachmentPath(assignment) && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                <AttachFile sx={{ mr: 1, verticalAlign: 'middle' }} />
                Attachment
              </Typography>
              <Button variant="outlined" size="small" onClick={downloadAssignmentFile}>
                Download Assignment File
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {!isTeacher && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Your Submission
            </Typography>

            {mySubmission ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Submitted on {new Date(mySubmission.submitted_at).toLocaleString()}
                </Alert>

                {mySubmission.grade !== null ? (
                  <Box>
                    <Typography variant="h6" color="primary">
                      Grade: {mySubmission.grade}/{assignment.points} points
                    </Typography>
                    {mySubmission.feedback && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Feedback:</strong> {mySubmission.feedback}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info">
                    Your submission is being reviewed by the teacher.
                  </Alert>
                )}

                {getAttachmentPath(mySubmission) && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Your submitted file:
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => downloadSubmissionFile(mySubmission)}>
                      Download Your Submission
                    </Button>
                  </Box>
                )}

                {canSubmitBeforeDue && (
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      startIcon={<UploadFile />}
                      onClick={openSubmitDialog}
                    >
                      Resubmit Before Due Date
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  You have not submitted this assignment yet.
                </Alert>
                <Button
                  variant="contained"
                  startIcon={<UploadFile />}
                  onClick={openSubmitDialog}
                  disabled={!canSubmitBeforeDue}
                >
                  Submit Assignment
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {isTeacher && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Student Submissions ({submissions.length})
            </Typography>

            {submissions.length === 0 ? (
              <Alert severity="info">No submissions yet.</Alert>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        {submission.student_name}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {submission.student_number || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(submission.submitted_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {submission.grade !== null ? (
                          <Chip
                            label={`${submission.grade}/${assignment.points}`}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip label="Not graded" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => downloadSubmissionFile(submission)}
                          sx={{ mr: 1 }}
                          disabled={!getAttachmentPath(submission)}
                        >
                          Download
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setGradingSubmission(submission);
                            setGradeForm({
                              grade: submission.grade || '',
                              feedback: submission.feedback || '',
                            });
                          }}
                        >
                          {submission.grade !== null ? 'Update Grade' : 'Grade'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{mySubmission ? 'Resubmit Assignment' : 'Submit Assignment'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <input
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.gif"
              style={{ display: 'none' }}
              id="submit-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="submit-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadFile />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Choose File
              </Button>
            </label>

            {fileName && (
              <Typography variant="body2" color="primary" gutterBottom>
                Selected: {fileName}
              </Typography>
            )}

            <TextField
              fullWidth
              label="Comments (optional)"
              multiline
              rows={3}
              value={submitForm.comments}
              onChange={(event) => setSubmitForm((prev) => ({ ...prev, comments: event.target.value }))}
              placeholder="Add any comments for your teacher..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!fileName}>
            {mySubmission ? 'Resubmit' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(gradingSubmission)} onClose={() => setGradingSubmission(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Grade Submission</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Student: {gradingSubmission?.student_name}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Grade (0-${assignment.points})`}
                  type="number"
                  value={gradeForm.grade}
                  onChange={(event) => setGradeForm((prev) => ({ ...prev, grade: event.target.value }))}
                  inputProps={{ min: 0, max: assignment.points }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Feedback"
                  multiline
                  rows={3}
                  value={gradeForm.feedback}
                  onChange={(event) => setGradeForm((prev) => ({ ...prev, feedback: event.target.value }))}
                  placeholder="Provide feedback for the student..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradingSubmission(null)}>Cancel</Button>
          <Button onClick={() => handleGrade(gradingSubmission.id)} variant="contained">
            Save Grade
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
