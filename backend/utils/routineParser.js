// ============================================================
// utils/routineParser.js — Parse CSV/PDF routine files
// ============================================================
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class RoutineParser {
  constructor() {
    this.requiredFields = ['day', 'time_slot', 'start_time', 'end_time', 'course_code', 'course_name', 'room_name'];
    this.validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  }

  // Parse CSV routine file
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];

      if (!fs.existsSync(filePath)) {
        return reject(new Error('File not found: ' + filePath));
      }

      fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_') }))
        .on('data', (row) => {
          const cleaned = this._cleanRow(row);
          const validation = this._validateRow(cleaned, results.length + 1);
          if (validation.valid) {
            results.push(cleaned);
          } else {
            errors.push(validation.error);
          }
        })
        .on('end', () => {
          resolve({ data: results, errors, total: results.length });
        })
        .on('error', (err) => reject(err));
    });
  }

  // Parse plain text routine (for PDF text extraction)
  parseTextRoutine(text) {
    const results = [];
    const lines = text.split('\n').filter(line => line.trim());

    // Try to detect structured pattern: Day | TimeSlot | Course | Room | Faculty
    const patterns = [
      // Pattern: Monday 08:00-09:30 CSE101 Introduction to Programming 101 Dr. Ahmed
      /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{2}:\d{2}-\d{2}:\d{2})\s+(\w+)\s+(.+?)\s+(\w+[-\w]*)\s+(.+)$/i,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, day, timeSlot, courseCode, courseName, room, faculty] = match;
          const [startTime, endTime] = timeSlot.split('-');
          results.push(this._cleanRow({
            day, time_slot: timeSlot, start_time: startTime + ':00',
            end_time: endTime + ':00', course_code: courseCode,
            course_name: courseName.trim(), room_name: room,
            faculty_name: faculty?.trim() || '',
          }));
          break;
        }
      }
    }
    return results;
  }

  _cleanRow(row) {
    const cleaned = {};
    for (const [key, value] of Object.entries(row)) {
      cleaned[key.trim()] = typeof value === 'string' ? value.trim() : value;
    }

    // Normalize day capitalization
    if (cleaned.day) {
      cleaned.day = cleaned.day.charAt(0).toUpperCase() + cleaned.day.slice(1).toLowerCase();
    }

    // Ensure time format HH:MM:SS
    if (cleaned.start_time && !cleaned.start_time.includes(':00', 4)) {
      if (cleaned.start_time.length === 5) cleaned.start_time += ':00';
    }
    if (cleaned.end_time && !cleaned.end_time.includes(':00', 4)) {
      if (cleaned.end_time.length === 5) cleaned.end_time += ':00';
    }

    return cleaned;
  }

  _validateRow(row, rowNumber) {
    for (const field of this.requiredFields) {
      if (!row[field]) {
        return { valid: false, error: `Row ${rowNumber}: Missing required field "${field}"` };
      }
    }

    if (!this.validDays.includes(row.day)) {
      return { valid: false, error: `Row ${rowNumber}: Invalid day "${row.day}"` };
    }

    const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timePattern.test(row.start_time) || !timePattern.test(row.end_time)) {
      return { valid: false, error: `Row ${rowNumber}: Invalid time format. Use HH:MM or HH:MM:SS` };
    }

    return { valid: true };
  }

  // Generate CSV template for download
  generateTemplate() {
    const header = 'day,time_slot,start_time,end_time,course_code,course_name,room_name,faculty_name,department,semester,batch\n';
    const example1 = 'Monday,08:00-09:30,08:00:00,09:30:00,CSE101,Introduction to Programming,101,Dr. Sarah Ahmed,CSE,1st,2024\n';
    const example2 = 'Tuesday,10:00-11:30,10:00:00,11:30:00,MATH201,Linear Algebra,201,Dr. Rahman Khan,Mathematics,3rd,2023\n';
    return header + example1 + example2;
  }
}

module.exports = new RoutineParser();
