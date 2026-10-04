const db = require('../config/db');

async function getAttendance(req, res) {
  try {
    const { student_id, subject_id, date, status } = req.query;

    const params = [];
    if (student_id) params.push(parseInt(student_id, 10));
    if (subject_id) params.push(parseInt(subject_id, 10));
    if (date) params.push(date);

    const { rows: records } = await db.query('SELECT * FROM attendance', params);

    let filtered = records;
    if (student_id) filtered = filtered.filter(a => a.student_id === parseInt(student_id, 10));
    if (subject_id) filtered = filtered.filter(a => a.subject_id === parseInt(subject_id, 10));
    if (date) filtered = filtered.filter(a => a.date === date);
    if (status) filtered = filtered.filter(a => a.status.toUpperCase() === status.toUpperCase());

    return res.json({ attendance: filtered });
  } catch (err) {
    console.error('Get Attendance Error:', err);
    return res.status(500).json({ message: 'Error fetching attendance records.' });
  }
}

async function markBatchAttendance(req, res) {
  try {
    const { subject_id, date, records } = req.body;

    if (!subject_id || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Subject ID, Date, and Attendance Records array are required.' });
    }

    const saved = [];
    for (const item of records) {
      const { student_id, status } = item;
      if (!student_id || !status) continue;

      const { rows } = await db.query(
        `INSERT INTO attendance (student_id, subject_id, date, status) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (student_id, subject_id, date) 
         DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP 
         RETURNING *`,
        [student_id, subject_id, date, status.toUpperCase()]
      );
      if (rows.length > 0) saved.push(rows[0]);
    }

    return res.json({
      message: `Attendance recorded successfully for ${saved.length} students.`,
      records: saved
    });
  } catch (err) {
    console.error('Mark Attendance Error:', err);
    return res.status(500).json({ message: 'Failed to record attendance.' });
  }
}

async function updateAttendance(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['PRESENT', 'ABSENT', 'LATE'].includes(status?.toUpperCase())) {
      return res.status(400).json({ message: 'Status must be PRESENT, ABSENT, or LATE.' });
    }

    const { rows } = await db.query(
      'UPDATE attendance SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status.toUpperCase(), id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    return res.json({
      message: 'Attendance updated successfully.',
      record: rows[0]
    });
  } catch (err) {
    console.error('Update Attendance Error:', err);
    return res.status(500).json({ message: 'Failed to update attendance.' });
  }
}

async function deleteAttendance(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query('DELETE FROM attendance WHERE id = $1', [id]);
    return res.json({ message: 'Attendance record deleted successfully.' });
  } catch (err) {
    console.error('Delete Attendance Error:', err);
    return res.status(500).json({ message: 'Failed to delete attendance record.' });
  }
}

module.exports = {
  getAttendance,
  markBatchAttendance,
  updateAttendance,
  deleteAttendance
};
