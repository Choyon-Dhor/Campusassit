const fs = require('fs');
const csv = require('csv-parser');

const REQUIRED_FIELDS = ['day', 'time_slot', 'start_time', 'end_time', 'course_code', 'course_name', 'room_name'];
const VALID_DAYS = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

function cleanRow(row) {
  const cleaned = {};
  for (const [k, v] of Object.entries(row)) {
    cleaned[k.trim()] = typeof v === 'string' ? v.trim() : v;
  }

  if (cleaned.day) {
    cleaned.day = cleaned.day.charAt(0).toUpperCase() + cleaned.day.slice(1).toLowerCase();
  }

  if (cleaned.start_time && cleaned.start_time.length === 5) cleaned.start_time += ':00';
  if (cleaned.end_time && cleaned.end_time.length === 5) cleaned.end_time += ':00';

  return cleaned;
}

function validateRow(row, idx) {
  for (const f of REQUIRED_FIELDS) {
    if (!row[f]) return { valid: false, error: `Row ${idx}: Missing required field "${f}"` };
  }
  if (!VALID_DAYS.has(row.day)) return { valid: false, error: `Row ${idx}: Invalid day "${row.day}"` };
  if (!TIME_RE.test(row.start_time) || !TIME_RE.test(row.end_time)) {
    return { valid: false, error: `Row ${idx}: Invalid time format. Use HH:MM or HH:MM:SS` };
  }
  return { valid: true };
}

class RoutineParser {
  async parseCSV(filePath) {
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

    return new Promise((resolve, reject) => {
      const data = [];
      const errors = [];

      fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_') }))
        .on('data', (row) => {
          const cleaned = cleanRow(row);
          const val = validateRow(cleaned, data.length + 1);
          if (val.valid) data.push(cleaned);
          else errors.push(val.error);
        })
        .on('end', () => resolve({ data, errors, total: data.length }))
        .on('error', reject);
    });
  }

  parseTextRoutine(text) {
    const results = [];
    const lines = text.split('\n').filter((l) => l.trim());
    const pattern = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{2}:\d{2}-\d{2}:\d{2})\s+(\w+)\s+(.+?)\s+(\w+[-\w]*)\s+(.+)$/i;

    for (const line of lines) {
      const match = line.match(pattern);
      if (!match) continue;

      const [, day, timeSlot, courseCode, courseName, room, faculty] = match;
      const [start, end] = timeSlot.split('-');
      results.push(cleanRow({
        day,
        time_slot: timeSlot,
        start_time: `${start}:00`,
        end_time: `${end}:00`,
        course_code: courseCode,
        course_name: courseName.trim(),
        room_name: room,
        faculty_name: faculty?.trim() || '',
      }));
    }
    return results;
  }

  generateTemplate() {
    return [
      'day,time_slot,start_time,end_time,course_code,course_name,room_name,faculty_name,department,semester,batch',
      'Monday,08:00-09:30,08:00:00,09:30:00,CSE101,Introduction to Programming,101,Dr. Sarah Ahmed,CSE,1st,2024',
      'Tuesday,10:00-11:30,10:00:00,11:30:00,MATH201,Linear Algebra,201,Dr. Rahman Khan,Mathematics,3rd,2023\n',
    ].join('\n');
  }
}

module.exports = new RoutineParser();
