const db = require('../config/db');

// GET /api/attendance
exports.getAttendanceRecords = async (req, res) => {
  try {
    const { class: studentClass, division, subject_id, date, student_id } = req.query;

    let sql = `
      SELECT a.id, a.student_id, a.subject_id, a.attendance_date, a.status, a.created_at,
             s.name AS student_name, s.roll_no, s.class, s.division,
             sub.subject_name, sub.subject_code
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE 1=1
    `;

    const records = await db.query(sql);

    let filtered = records;
    if (studentClass && studentClass !== 'All') {
      filtered = filtered.filter(r => r.class === studentClass);
    }
    if (division && division !== 'All') {
      filtered = filtered.filter(r => r.division === division);
    }
    if (subject_id && subject_id !== 'All') {
      filtered = filtered.filter(r => r.subject_id == subject_id);
    }
    if (date) {
      const formattedDate = new Date(date).toISOString().split('T')[0];
      filtered = filtered.filter(r => r.attendance_date.toString().substring(0, 10) === formattedDate);
    }
    if (student_id) {
      filtered = filtered.filter(r => r.student_id == student_id);
    }

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ success: false, message: 'Server error fetching attendance records.' });
  }
};

// GET /api/attendance/student/:id
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const sql = `
      SELECT a.id, a.student_id, a.subject_id, a.attendance_date, a.status,
             sub.subject_name, sub.subject_code, sub.faculty_name
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = ?
      ORDER BY a.attendance_date DESC
    `;
    const records = await db.query(sql, [studentId]);
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ success: false, message: 'Server error fetching student attendance.' });
  }
};

// POST /api/attendance (Batch or Single Submission)
exports.saveAttendance = async (req, res) => {
  try {
    const { items } = req.body; // Array of { student_id, subject_id, attendance_date, status }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload. An array of attendance items is required.' });
    }

    let savedCount = 0;
    for (const item of items) {
      const { student_id, subject_id, attendance_date, status } = item;
      if (!student_id || !subject_id || !attendance_date || !status) continue;

      // Duplicate prevention query with update if exists
      const sql = `
        INSERT INTO attendance (student_id, subject_id, attendance_date, status)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `;

      await db.query(sql, [student_id, subject_id, attendance_date, status]);
      savedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully recorded attendance for ${savedCount} student(s).`,
      savedCount
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ success: false, message: 'Server error while saving attendance records.' });
  }
};

// PUT /api/attendance/:id
exports.updateAttendance = async (req, res) => {
  try {
    const attendanceId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either Present or Absent.' });
    }

    await db.query('UPDATE attendance SET status = ? WHERE id = ?', [status, attendanceId]);
    res.json({ success: true, message: 'Attendance status updated successfully.' });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ success: false, message: 'Server error updating attendance record.' });
  }
};

// DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res) => {
  try {
    const attendanceId = parseInt(req.params.id);
    await db.query('DELETE FROM attendance WHERE id = ?', [attendanceId]);
    res.json({ success: true, message: 'Attendance record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ success: false, message: 'Server error deleting attendance record.' });
  }
};
