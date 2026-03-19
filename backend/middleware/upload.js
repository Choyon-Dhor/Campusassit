// ============================================================
// middleware/upload.js — Multer File Upload Configuration
// ============================================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Storage for resources (notes, question papers, etc.)
const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/resources');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${base}-${unique}${ext}`);
  },
});

// Storage for routine files (CSV/PDF)
const routineStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/routines');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `routine-${unique}${ext}`);
  },
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} not allowed. Allowed: ${allowedTypes.join(', ')}`), false);
  }
};

const uploadResource = multer({
  storage: resourceStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: fileFilter(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip']),
});

const uploadRoutine = multer({
  storage: routineStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['csv', 'pdf', 'xlsx']),
});

// Storage for bus schedule uploads
const busStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/bus');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `bus-schedule-${unique}${ext}`);
  },
});

const uploadBusSchedule = multer({
  storage: busStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['csv']),
});

// Error handling wrapper
const handleUploadError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Max size is 10MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadResource: handleUploadError(uploadResource.single('file')),
  uploadRoutine: handleUploadError(uploadRoutine.single('routine')),
  uploadBusSchedule: handleUploadError(uploadBusSchedule.single('schedule')),
};
