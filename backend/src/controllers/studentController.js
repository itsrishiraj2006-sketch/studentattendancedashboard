const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { calculateStudentAttendanceStats } = require('../utils/attendanceCalculator');

async function getThresholds() {
  const { rows } = await db.query('SELECT * FROM settings');
  const high = rows.find(r => r.key === 'high_threshold')?.value || '75';
  const low = rows.find(r => r.key === 'low_threshold')?.value || '60';
  return { high: parseFloat(high), low: parseFloat(low) };
}

async function getAllStudents(req, res) {
  try {
    const { department, semester, search } = req.query;
    const { rows: students } = await db.query('SELECT * FROM students');
    const { rows: subjects } = await db.query('SELECT * FROM subjects');
    const { rows: attendance } = await db.query('SELECT * FROM attendance');
    const thresholds = await getThresholds();

    let list = students.map(st => {
      const stAttendance = attendance.filter(a => a.student_id === st.id);
      const stats = calculateStudentAttendanceStats(stAttendance, subjects, thresholds);

      return {
        id: st.id,
        user_id: st.user_id,
        name: st.name || '',
        email: st.email || '',
        student_id: st.student_id,
        department: st.department,
        semester: st.semester,
        section: st.section || 'A',
        overallPercentage: stats.overallPercentage,
        overallStatus: stats.overallStatus,
        totalClasses: stats.totalClasses,
        totalAttended: stats.totalAttended,
        totalMissed: stats.totalMissed
      };
    });

    if (department) {
      list = list.filter(s => s.department.toLowerCase() === department.toLowerCase());
    }
    if (semester) {
      list = list.filter(s => String(s.semester) === String(semester));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    return res.json({ students: list });
  } catch (err) {
    console.error('Get All Students Error:', err);
    return res.status(500).json({ message: 'Error fetching students.' });
  }
}

async function getStudentById(req, res) {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { rows: students } = await db.query('SELECT * FROM students WHERE id = $1', [studentId]);
    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const student = students[0];
    const { rows: subjects } = await db.query('SELECT * FROM subjects');
    const { rows: attendance } = await db.query('SELECT * FROM attendance WHERE student_id = $1', [studentId]);
    const thresholds = await getThresholds();

    const stats = calculateStudentAttendanceStats(attendance, subjects, thresholds);

    return res.json({
      student: {
        id: student.id,
        user_id: student.user_id,
        name: student.name || '',
        email: student.email || '',
        student_id: student.student_id,
        department: student.department,
        semester: student.semester,
        section: student.section || 'A',
        ...stats,
        attendanceHistory: attendance
      }
    });
  } catch (err) {
    console.error('Get Student Error:', err);
    return res.status(500).json({ message: 'Error fetching student details.' });
  }
}

async function createStudent(req, res) {
  try {
    const { name, student_id, email, department, semester, section, password } = req.body;

    if (!name || !student_id || !email || !password) {
      return res.status(400).json({ message: 'Name, Student ID, Email, and Password are required.' });
    }

    // Check duplicate email
    const { rows: existingEmail } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Check duplicate student_id
    const { rows: existingCode } = await db.query('SELECT * FROM students WHERE student_id = $1', [student_id]);
    if (existingCode.length > 0) {
      return res.status(400).json({ message: 'Student ID already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user
    const { rows: userRows } = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hash, 'STUDENT']
    );
    const user = userRows[0];

    // Create student record
    const { rows: stRows } = await db.query(
      'INSERT INTO students (user_id, student_id, department, semester, section) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, student_id, department || 'Computer Science', semester || '4', section || 'A']
    );

    return res.status(201).json({
      message: 'Student added successfully.',
      student: {
        ...stRows[0],
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Create Student Error:', err);
    return res.status(500).json({ message: 'Failed to create student.' });
  }
}

async function updateStudent(req, res) {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { name, email, student_id, department, semester, section } = req.body;

    const { rows: students } = await db.query('SELECT * FROM students WHERE id = $1', [studentId]);
    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    const student = students[0];

    // Update user info
    if (name || email) {
      await db.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [
        name || student.name,
        email || student.email,
        student.user_id
      ]);
    }

    // Update student info
    const { rows: updated } = await db.query(
      'UPDATE students SET student_id = $1, department = $2, semester = $3, section = $4 WHERE id = $5 RETURNING *',
      [student_id || student.student_id, department || student.department, semester || student.semester, section || student.section, studentId]
    );

    return res.json({
      message: 'Student updated successfully.',
      student: updated[0]
    });
  } catch (err) {
    console.error('Update Student Error:', err);
    return res.status(500).json({ message: 'Failed to update student.' });
  }
}

async function deleteStudent(req, res) {
  try {
    const studentId = parseInt(req.params.id, 10);
    await db.query('DELETE FROM students WHERE id = $1', [studentId]);
    return res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    console.error('Delete Student Error:', err);
    return res.status(500).json({ message: 'Failed to delete student.' });
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
