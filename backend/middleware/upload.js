const path = require('path');
const fs = require('fs');
const multer = require('multer');

const os = require('os');

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);

function createStorage(subfolder, prefix) {
  const dir = isServerless
    ? path.join(os.tmpdir(), 'uploads', subfolder)
    : path.join(__dirname, '../uploads', subfolder);

  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.warn(`[Upload] Notice: could not create upload dir ${dir}:`, err.message);
  }

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      if (prefix) {
        cb(null, `${prefix}-${Date.now()}${ext}`);
      } else {
        const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
        cb(null, `${base}-${unique}${ext}`);
      }
    },
  });
}

const fileFilter = (allowed) => (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowed.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} not allowed. Allowed: ${[...allowed].join(', ')}`), false);
  }
};

const wrapUpload = (mw) => (req, res, next) => {
  mw(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max size is 10MB.' : err.message;
      return res.status(400).json({ success: false, message });
    }
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

const uploadResource = multer({
  storage: createStorage('resources'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: fileFilter(new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip'])),
});

const uploadRoutine = multer({
  storage: createStorage('routines', 'routine'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(new Set(['csv', 'pdf', 'xlsx'])),
});

const uploadBusSchedule = multer({
  storage: createStorage('bus', 'bus-schedule'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(new Set(['csv'])),
});

const uploadAssignment = multer({
  storage: createStorage('assignments'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: fileFilter(new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'jpg', 'jpeg', 'png', 'gif'])),
});

module.exports = {
  uploadResource: wrapUpload(uploadResource.single('file')),
  uploadRoutine: wrapUpload(uploadRoutine.single('routine')),
  uploadBusSchedule: wrapUpload(uploadBusSchedule.single('schedule')),
  uploadAssignment: wrapUpload(uploadAssignment.single('file')),
};
