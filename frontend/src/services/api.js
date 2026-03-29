// ============================================================
// src/services/api.js — Axios Instance & API Service Layer
// ============================================================
import axios from 'axios';
import { toast } from 'react-toastify';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusassist_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.message || 'Network error occurred';
    if (error.response?.status === 401) {
      localStorage.removeItem('campusassist_token');
      localStorage.removeItem('campusassist_user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Permission denied.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }
    return Promise.reject({ ...error, message: msg });
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getAllUsers: () => api.get('/auth/users'),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  toggleUserActive: (id) => api.patch(`/auth/users/${id}/toggle`),
};

// ── Announcements ─────────────────────────────────────────────
export const announcementService = {
  getAll: (params) => api.get('/announcements', { params }),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// ── Classrooms ────────────────────────────────────────────────
export const classroomService = {
  getFreeRooms: (params) => api.get('/classrooms/free', { params }),
  getAllRooms: () => api.get('/classrooms/rooms'),
  getRoutine: (params) => api.get('/classrooms/routine', { params }),
  getRoomSchedule: (name, params) => api.get(`/classrooms/room/${name}/schedule`, { params }),
  getTimeSlots: () => api.get('/classrooms/timeslots'),
  uploadRoutine: (formData) => api.post('/classrooms/routine/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadTemplate: () => api.get('/classrooms/routine/template', { responseType: 'blob' }),

  // Smart Classroom APIs
  createClassroom: (data) => api.post('/classrooms/create', data),
  uploadStudents: (data) => api.post('/classrooms/upload-students', data),
  listClassrooms: () => api.get('/classrooms/list'),
  getClassroom: (id) => api.get(`/classrooms/${id}`),
  editClassroom: (id, data) => api.put(`/classrooms/${id}`, data),
  deleteClassroom: (id) => api.delete(`/classrooms/${id}`),
  getClassroomStats: (id) => api.get(`/classrooms/${id}/stats`),
  getClassroomStudents: (id) => api.get(`/classrooms/${id}/students`),
  markAttendance: (classroomId, data) => api.post(`/classrooms/${classroomId}/attendance/mark`, data),
  getAttendance: (classroomId, params) => api.get(`/classrooms/${classroomId}/attendance`, { params }),
  addMarks: (classroomId, data) => api.post(`/classrooms/${classroomId}/marks/add`, data),
  getMarks: (classroomId, params) => api.get(`/classrooms/${classroomId}/marks`, { params }),
  createAnnouncement: (classroomId, data) => api.post(`/classrooms/${classroomId}/announcements`, data),
  listAnnouncements: (classroomId) => api.get(`/classrooms/${classroomId}/announcements`),
  addResource: (classroomId, data) => api.post(`/classrooms/${classroomId}/resources`, data),
  listResources: (classroomId) => api.get(`/classrooms/${classroomId}/resources`),
};

  // ── Resources ─────────────────────────────────────────────────
export const resourceService = {
  getAll: (params) => api.get('/resources', { params }),
  getById: (id) => api.get(`/resources/${id}`),
  upload: (formData) => api.post('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (id) => api.get(`/resources/${id}/download`, { responseType: 'blob' }),
  rate: (id, rating) => api.post(`/resources/${id}/rate`, { rating }),
  delete: (id) => api.delete(`/resources/${id}`),
  getRecommendations: (params) => api.get('/resources/recommendations', { params }),
};

// ── Study Groups ──────────────────────────────────────────────
export const studyGroupService = {
  getAll: () => api.get('/study-groups'),
  create: (data) => api.post('/study-groups', data),
  join: (id) => api.post(`/study-groups/${id}/join`),
  leave: (id) => api.post(`/study-groups/${id}/leave`),
  getMembers: (id) => api.get(`/study-groups/${id}/members`),
  delete: (id) => api.delete(`/study-groups/${id}`),
};

// ── Deadlines ─────────────────────────────────────────────────
export const deadlineService = {
  getAll: (params) => api.get('/deadlines', { params }),
  getUpcoming: (params) => api.get('/deadlines/upcoming', { params }),
  create: (data) => api.post('/deadlines', data),
  update: (id, data) => api.put(`/deadlines/${id}`, data),
  delete: (id) => api.delete(`/deadlines/${id}`),
  toggleComplete: (id) => api.patch(`/deadlines/${id}/toggle`),
};

// ── Consultations ─────────────────────────────────────────────
export const consultationService = {
  getHours: () => api.get('/consultations/hours'),
  createHours: (data) => api.post('/consultations/hours', data),
  getAppointments: () => api.get('/consultations/appointments'),
  bookAppointment: (data) => api.post('/consultations/appointments', data),
  updateStatus: (id, data) => api.patch(`/consultations/appointments/${id}/status`, data),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;

// ── Results ───────────────────────────────────────────────────
export const resultService = {
  getMyResults:         ()             => api.get('/results/me'),
  getSemesters:         ()             => api.get('/results/semesters'),
  getStudentList:       (params)       => api.get('/results/students', { params }),
  getByStudentNumber:   (num, params)  => api.get(`/results/student/${num}`, { params }),
  uploadResult:         (data)         => api.post('/results/upload', data),
  bulkSave:             (data)         => api.post('/results/bulk-save', data),
  updateResult:         (id, data)     => api.put(`/results/${id}`, data),
  deleteResult:         (id)           => api.delete(`/results/${id}`),
  publishResult:        (id)           => api.patch(`/results/${id}/publish`),
  publishSemester:      (data)         => api.patch('/results/publish-semester', data),
  importCSV:            (formData)     => api.post('/results/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadCSVTemplate:  ()             => {
    const header = 'student_number,course_code,course_title,credit_hours,letter_grade,batch_section\n';
    const example = '231-115-094,CSE-421,Artificial Intelligence,3,A+,58th[C]\n';
    const blob = new Blob([header + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'result_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  },
};

// ── Bus ───────────────────────────────────────────────────────
export const busService = {
  getSchedule:  ()       => api.get('/bus/schedule'),
  getRoutes:    (params) => api.get('/bus/routes', { params }),
  getNextBuses: ()       => api.get('/bus/next'),
  uploadSchedule: (formData) => api.post('/bus/schedule/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Batch Routine ─────────────────────────────────────────────
export const batchRoutineService = {
  getBatches:       ()                  => api.get('/batch-routine/batches'),
  getRoutine:       (batch, section, p) => api.get(`/batch-routine/${batch}/${section}`, { params: p }),
  getTodayClasses:  (batch, section)    => api.get(`/batch-routine/today/${batch}/${section}`),
  getFreeRooms:     (params)            => api.get('/batch-routine/free-rooms', { params }),
};
