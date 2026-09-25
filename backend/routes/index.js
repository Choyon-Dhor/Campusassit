const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');

const { auth, isAdmin, isTeacherOrAdmin } = require('../middleware/auth');
const { uploadResource, uploadRoutine, uploadBusSchedule, uploadAssignment } = require('../middleware/upload');

const authCtrl = require('../controllers/authController');
const annCtrl = require('../controllers/announcementController');
const classCtrl = require('../controllers/classroomController');
const smartClassCtrl = require('../controllers/smartClassroomController');
const assignmentCtrl = require('../controllers/assignmentController');
const { studyGroup, deadline, consultation, notification, dashboardStats } = require('../controllers/featureControllers');
const resultCtrl = require('../controllers/resultController');
const busCtrl = require('../controllers/busController');

const { resourceRepo } = require('../repositories');
const recommendationService = require('../services/RecommendationService');

const router = express.Router();
const tmpUpload = multer({ dest: path.join(__dirname, '../uploads/tmp'), limits: { fileSize: 2 * 1024 * 1024 } });

const authRouter = express.Router();
authRouter.post('/register', authCtrl.register);
authRouter.post('/login', authCtrl.login);
authRouter.post('/forgot-password', authCtrl.forgotPassword);
authRouter.post('/reset-password', authCtrl.resetPassword);
authRouter.get('/me', auth, authCtrl.getMe);
authRouter.put('/profile', auth, authCtrl.updateProfile);
authRouter.put('/change-password', auth, authCtrl.changePassword);
authRouter.get('/users', auth, isAdmin, authCtrl.getAllUsers);
authRouter.put('/admin/users/:id', auth, isAdmin, authCtrl.adminUpdateUser);
authRouter.put('/admin/users/:id/password', auth, isAdmin, authCtrl.adminResetUserPassword);
authRouter.patch('/admin/users/:id/toggle', auth, isAdmin, authCtrl.adminToggleUser);

const annRouter = express.Router();
annRouter.get('/', auth, annCtrl.getAll);
annRouter.post('/', auth, isTeacherOrAdmin, annCtrl.create);
annRouter.put('/:id', auth, isTeacherOrAdmin, annCtrl.update);
annRouter.delete('/:id', auth, isTeacherOrAdmin, annCtrl.delete);

const classRouter = express.Router();
classRouter.post('/create', auth, isTeacherOrAdmin, smartClassCtrl.createClassroom);
classRouter.put('/:id', auth, isTeacherOrAdmin, smartClassCtrl.updateClassroom);
classRouter.delete('/:id', auth, isTeacherOrAdmin, smartClassCtrl.deleteClassroom);
classRouter.post('/upload-students', auth, isTeacherOrAdmin, smartClassCtrl.uploadStudents);
classRouter.get('/list', auth, smartClassCtrl.listClassrooms);
classRouter.get('/free', auth, classCtrl.getFreeRooms);
classRouter.get('/rooms', auth, classCtrl.getAllRooms);
classRouter.get('/routine', auth, classCtrl.getRoutine);
classRouter.get('/timeslots', auth, classCtrl.getTimeSlots);
classRouter.post('/routine/upload', auth, isAdmin, uploadRoutine, classCtrl.uploadRoutine);
classRouter.get('/routine/template', auth, isAdmin, classCtrl.downloadTemplate);
classRouter.get('/room/:name/schedule', auth, classCtrl.getRoomSchedule);
classRouter.get('/:id/people', auth, smartClassCtrl.getClassroomPeople);
classRouter.get('/:id/people/download', auth, smartClassCtrl.downloadClassroomPeople);
classRouter.get('/:id', auth, smartClassCtrl.getClassroom);
classRouter.get('/:id/students', auth, smartClassCtrl.getClassroomStudents);
classRouter.post('/:id/attendance/mark', auth, isTeacherOrAdmin, smartClassCtrl.markAttendance);
classRouter.get('/:id/attendance', auth, smartClassCtrl.getAttendance);
classRouter.post('/:id/marks/add', auth, isTeacherOrAdmin, smartClassCtrl.addMarks);
classRouter.get('/:id/marks', auth, smartClassCtrl.getMarks);
classRouter.post('/:id/announcements', auth, isTeacherOrAdmin, smartClassCtrl.createAnnouncement);
classRouter.get('/:id/announcements', auth, smartClassCtrl.listAnnouncements);
classRouter.post('/:id/resources', auth, isTeacherOrAdmin, smartClassCtrl.addResource);
classRouter.get('/:id/resources', auth, smartClassCtrl.listResources);

const assignmentRouter = express.Router();
assignmentRouter.post('/', auth, isTeacherOrAdmin, uploadAssignment, assignmentCtrl.createAssignment);
assignmentRouter.get('/', auth, assignmentCtrl.getAssignments);
assignmentRouter.get('/submissions', auth, isTeacherOrAdmin, assignmentCtrl.getSubmissions);
assignmentRouter.put('/submissions/:id/grade', auth, isTeacherOrAdmin, assignmentCtrl.gradeSubmission);
assignmentRouter.get('/submissions/:id/download', auth, assignmentCtrl.downloadSubmissionAttachment);
assignmentRouter.get('/my-submission', auth, assignmentCtrl.getMySubmission);
assignmentRouter.put('/:id', auth, isTeacherOrAdmin, uploadAssignment, assignmentCtrl.updateAssignment);
assignmentRouter.delete('/:id', auth, isTeacherOrAdmin, assignmentCtrl.deleteAssignment);
assignmentRouter.post('/:id/submit', auth, uploadAssignment, assignmentCtrl.submitAssignment);
assignmentRouter.get('/:id/download', auth, assignmentCtrl.downloadAssignmentAttachment);
assignmentRouter.get('/:id', auth, assignmentCtrl.getAssignment);

const resourceRouter = express.Router();
resourceRouter.get('/recommendations', auth, async (req, res, next) => {
  try {
    const { limit = 6, department, course_code } = req.query;
    const resources = await recommendationService.getTopRecommendations(
      parseInt(limit, 10),
      { department, course_code }
    );
    res.json({ success: true, resources });
  } catch (err) {
    next(err);
  }
});

resourceRouter.get('/', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 12, file_type, department, course_code, search, sort } = req.query;
    const resources = await resourceRepo.findWithUploader(
      { file_type, department, course_code, search, sort },
      parseInt(page, 10),
      parseInt(limit, 10)
    );
    res.json({ success: true, resources });
  } catch (err) {
    next(err);
  }
});

resourceRouter.get('/:id', auth, async (req, res, next) => {
  try {
    const r = await resourceRepo.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, resource: r });
  } catch (err) {
    next(err);
  }
});

resourceRouter.post('/', auth, uploadResource, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const { title, description, file_type = 'notes', course_code, course_name, semester, department } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required.' });

    const resource = await resourceRepo.create({
      title,
      description,
      file_path: req.file.filename,
      file_type,
      course_code,
      course_name,
      semester,
      department,
      uploader_id: req.user.id,
    });
    res.status(201).json({ success: true, resource });
  } catch (err) {
    next(err);
  }
});

resourceRouter.get('/:id/download', auth, async (req, res, next) => {
  try {
    const r = await resourceRepo.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found.' });

    const filePath = path.join(__dirname, '../uploads/resources', r.file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File missing.' });

    await resourceRepo.incrementDownload(req.params.id);
    await recommendationService.updateSingleScore(req.params.id);
    res.download(filePath);
  } catch (err) {
    next(err);
  }
});

resourceRouter.post('/:id/rate', auth, async (req, res, next) => {
  try {
    const { rating } = req.body;
    const num = parseInt(rating, 10);
    if (!num || num < 1 || num > 5) {
      return res.status(400).json({ success: false, message: 'Rating 1–5 required.' });
    }

    const avg = await resourceRepo.upsertRating(req.params.id, req.user.id, num);
    await recommendationService.updateSingleScore(req.params.id);
    res.json({ success: true, message: 'Rated.', averageRating: avg });
  } catch (err) {
    next(err);
  }
});

resourceRouter.delete('/:id', auth, async (req, res, next) => {
  try {
    const r = await resourceRepo.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found.' });
    if (r.uploader_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const filePath = path.join(__dirname, '../uploads/resources', r.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await resourceRepo.delete(req.params.id);
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    next(err);
  }
});

const sgRouter = express.Router();
sgRouter.get('/', auth, studyGroup.getAll);
sgRouter.post('/', auth, studyGroup.create);
sgRouter.post('/:id/join', auth, studyGroup.join);
sgRouter.post('/:id/leave', auth, studyGroup.leave);
sgRouter.get('/:id/members', auth, studyGroup.getMembers);
sgRouter.get('/:id', auth, studyGroup.getOne);
sgRouter.get('/:id/messages', auth, studyGroup.getMessages);
sgRouter.post('/:id/messages', auth, studyGroup.postMessage);
sgRouter.post('/:id/messages/read', auth, studyGroup.markMessagesRead);
sgRouter.post('/:id/messages/:messageId/reactions', auth, studyGroup.reactToMessage);
sgRouter.post('/:id/typing', auth, studyGroup.setTypingStatus);
sgRouter.get('/:id/announcements', auth, studyGroup.getAnnouncements);
sgRouter.post('/:id/announcements', auth, studyGroup.postAnnouncement);
sgRouter.post('/:id/announcements/:announcementId/comments', auth, studyGroup.commentAnnouncement);
sgRouter.get('/:id/resources', auth, studyGroup.getResources);
sgRouter.post('/:id/resources', auth, studyGroup.postResource);
sgRouter.get('/:id/activity', auth, studyGroup.getActivity);
sgRouter.delete('/:id', auth, studyGroup.delete);

const dlRouter = express.Router();
dlRouter.get('/', auth, deadline.getAll);
dlRouter.get('/upcoming', auth, deadline.getUpcoming);
dlRouter.post('/', auth, deadline.create);
dlRouter.put('/:id', auth, deadline.update);
dlRouter.delete('/:id', auth, deadline.delete);
dlRouter.patch('/:id/toggle', auth, deadline.toggleComplete);

const consultRouter = express.Router();
consultRouter.get('/hours', auth, consultation.getHours);
consultRouter.post('/hours', auth, isTeacherOrAdmin, consultation.createHours);
consultRouter.get('/appointments', auth, consultation.getAppointments);
consultRouter.post('/appointments', auth, consultation.bookAppointment);
consultRouter.patch('/appointments/:id/status', auth, consultation.updateAppointmentStatus);

const notifRouter = express.Router();
notifRouter.get('/', auth, notification.getAll);
notifRouter.patch('/:id/read', auth, notification.markRead);
notifRouter.patch('/read-all', auth, notification.markAllRead);

const dashRouter = express.Router();
dashRouter.get('/stats', auth, dashboardStats);

const resultRouter = express.Router();
resultRouter.get('/students', auth, isTeacherOrAdmin, resultCtrl.getStudentList);
resultRouter.get('/semesters', auth, resultCtrl.getSemesters);
resultRouter.get('/me', auth, resultCtrl.getMyResults);
resultRouter.get('/student/:studentNumber', auth, isTeacherOrAdmin, resultCtrl.getByStudentNumber);
resultRouter.post('/upload', auth, isTeacherOrAdmin, resultCtrl.uploadResult);
resultRouter.post('/bulk-save', auth, isTeacherOrAdmin, resultCtrl.bulkSave);
resultRouter.post('/import-csv', auth, isTeacherOrAdmin, tmpUpload.single('csv'), resultCtrl.importCSV);
resultRouter.put('/:id', auth, isTeacherOrAdmin, resultCtrl.updateResult);
resultRouter.delete('/:id', auth, isTeacherOrAdmin, resultCtrl.deleteResult);
resultRouter.patch('/publish-semester', auth, isTeacherOrAdmin, resultCtrl.publishSemester);
resultRouter.patch('/:id/publish', auth, isAdmin, resultCtrl.publishResult);

router.post('/attendance/mark', auth, isTeacherOrAdmin, smartClassCtrl.markAttendance);
router.get('/attendance/student', auth, smartClassCtrl.getAttendance);
router.post('/marks/add', auth, isTeacherOrAdmin, smartClassCtrl.addMarks);
router.get('/marks/student', auth, smartClassCtrl.getMarks);

const busRouter = express.Router();
busRouter.get('/schedule', auth, busCtrl.getSchedule);
busRouter.get('/routes', auth, busCtrl.getAllRoutes);
busRouter.get('/next', auth, busCtrl.getNextBuses);
busRouter.post('/schedule/upload', auth, isAdmin, uploadBusSchedule, busCtrl.uploadBusSchedule);

const routineRouter = express.Router();
routineRouter.get('/batches', auth, busCtrl.getBatchList);
routineRouter.get('/free-rooms', auth, busCtrl.getFreeRooms);
routineRouter.get('/today/:batchNumber/:section', auth, busCtrl.getTodayClasses);
routineRouter.get('/:batchNumber/:section', auth, busCtrl.getBatchRoutine);

router.use('/auth', authRouter);
router.use('/announcements', annRouter);
router.use('/classrooms', classRouter);
router.use('/assignments', assignmentRouter);
router.use('/resources', resourceRouter);
router.use('/study-groups', sgRouter);
router.use('/deadlines', dlRouter);
router.use('/consultations', consultRouter);
router.use('/notifications', notifRouter);
router.use('/dashboard', dashRouter);
router.use('/results', resultRouter);
router.use('/bus', busRouter);
router.use('/batch-routine', routineRouter);

module.exports = router;
