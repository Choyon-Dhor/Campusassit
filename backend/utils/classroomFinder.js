// ============================================================
// utils/classroomFinder.js — Free Classroom Detection (pg)
// ============================================================
const db = require('../config/database');
const moment = require('moment');

class ClassroomFinder {
  constructor() {
    this.timeSlots = [
      { slot: '08:00-09:30', start: '08:00:00', end: '09:30:00', label: '8:00 AM – 9:30 AM'  },
      { slot: '09:45-11:15', start: '09:45:00', end: '11:15:00', label: '9:45 AM – 11:15 AM' },
      { slot: '10:00-11:30', start: '10:00:00', end: '11:30:00', label: '10:00 AM – 11:30 AM' },
      { slot: '11:30-13:00', start: '11:30:00', end: '13:00:00', label: '11:30 AM – 1:00 PM'  },
      { slot: '12:00-13:30', start: '12:00:00', end: '13:30:00', label: '12:00 PM – 1:30 PM'  },
      { slot: '14:00-15:30', start: '14:00:00', end: '15:30:00', label: '2:00 PM – 3:30 PM'   },
      { slot: '15:45-17:15', start: '15:45:00', end: '17:15:00', label: '3:45 PM – 5:15 PM'   },
      { slot: '17:30-19:00', start: '17:30:00', end: '19:00:00', label: '5:30 PM – 7:00 PM'   },
    ];
  }

  getCurrentDay()  { return moment().format('dddd'); }
  getCurrentTime() { return moment().format('HH:mm:ss'); }

  getCurrentSlot() {
    const now = this.getCurrentTime();
    return this.timeSlots.find(s => now >= s.start && now <= s.end) || null;
  }

  /**
   * Core algorithm:
   *   occupiedRooms = SELECT room_name FROM routine
   *                   WHERE day = $day AND start_time <= $time AND end_time > $time
   *   freeRooms = allRooms − occupiedRooms
   */
  async getFreeRooms(day = null, time = null) {
    const targetDay  = day  || this.getCurrentDay();
    const targetTime = time || this.getCurrentTime();

    const allRooms = await db.query(`SELECT * FROM rooms ORDER BY room_name`);

    // PostgreSQL: cast the text param to TIME for comparison
    const occupiedRows = await db.query(
      `SELECT DISTINCT room_name, course_code, course_name,
              faculty_name, time_slot, start_time, end_time,
              department, semester, batch
       FROM routine
       WHERE day = $1
         AND start_time <= $2::time
         AND end_time   >  $2::time`,
      [targetDay, targetTime]
    );

    const occupiedSet = new Set(occupiedRows.map(r => r.room_name));

    const freeRooms     = allRooms.filter(r => !occupiedSet.has(r.room_name));
    const occupiedRooms = allRooms
      .filter(r => occupiedSet.has(r.room_name))
      .map(r => ({
        ...r,
        schedule: occupiedRows.find(o => o.room_name === r.room_name),
      }));

    return {
      day:           targetDay,
      time:          targetTime,
      currentSlot:   this.getCurrentSlot(),
      freeRooms,
      occupiedRooms,
      totalRooms:    allRooms.length,
      freeCount:     freeRooms.length,
      occupiedCount: occupiedRooms.length,
    };
  }

  async getRoomDaySchedule(roomName, day = null) {
    const targetDay = day || this.getCurrentDay();

    const schedule = await db.query(
      `SELECT * FROM routine
       WHERE room_name = $1 AND day = $2
       ORDER BY start_time`,
      [roomName, targetDay]
    );

    const freeSlots = this.timeSlots.filter(slot => {
      return !schedule.some(
        s => s.start_time <= slot.start && s.end_time > slot.start
      );
    });

    return { room: roomName, day: targetDay, schedule, freeSlots };
  }

  async getRoomWeeklySchedule(roomName) {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const weekly = {};
    for (const day of days) {
      weekly[day] = await db.query(
        `SELECT * FROM routine WHERE room_name = $1 AND day = $2 ORDER BY start_time`,
        [roomName, day]
      );
    }
    return weekly;
  }

  async getFreeRoomsForSlot(day, timeSlot) {
    const slot = this.timeSlots.find(s => s.slot === timeSlot);
    if (!slot) return { error: 'Invalid time slot' };
    return this.getFreeRooms(day, slot.start);
  }

  getTimeSlots() { return this.timeSlots; }
}

module.exports = new ClassroomFinder();
