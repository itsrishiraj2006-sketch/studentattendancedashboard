const db = require('../config/db');

// Helper to determine status badge text
function getAttendanceStatus(percentage) {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Good';
  if (percentage >= 75) return 'Satisfactory';
  return 'Low Attendance';
}

// GET /api/students
exports.getAllStudents = async (req, res) => {
  try {
    const { class: studentClass, division, search } = req.query;

    let students = await db.query('SELECT * FROM `students` ORDER BY `id` ASC');
    const attendanceRecords = await db.query('SELECT * FROM `attendance`');

    // Apply filtering
    if (studentClass && studentClass !== 'All') {
      students = students.filter(s => s.class === studentClass);
    }
    if (division && division !== 'All') {
      students = students.filter(s => s.division === division);
    }
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.roll_no.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    // Calculate attendance metrics per student
    const result = students.map(student => {
      const records = attendanceRecords.filter(a => a.student_id === student.id);
      const totalClasses = records.length;
      const presentClasses = records.filter(a => a.status === 'Present').length;
      const absentClasses = totalClasses - presentClasses;
      const attendancePercentage = totalClasses > 0 ? parseFloat(((presentClasses / totalClasses) * 100).toFixed(1)) : 0;
      const status = getAttendanceStatus(attendancePercentage);

      return {
        ...student,
        totalClasses,
        presentClasses,
        absentClasses,
        attendancePercentage,
        status
      };
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching students.' });
  }
};

// GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const students = await db.query('SELECT * FROM `students` WHERE `id` = ?', [studentId]);

    if (!students || students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = students[0];
    const attendanceRecords = await db.query('SELECT * FROM `attendance` WHERE `student_id` = ?', [studentId]);
    const subjects = await db.query('SELECT * FROM `subjects`');

    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(a => a.status === 'Present').length;
    const absentClasses = totalClasses - presentClasses;
    const attendancePercentage = totalClasses > 0 ? parseFloat(((presentClasses / totalClasses) * 100).toFixed(1)) : 0;
    const status = getAttendanceStatus(attendancePercentage);

    // Subject-wise breakdown
    const subjectBreakdown = subjects.map(sub => {
      const subRecords = attendanceRecords.filter(a => a.subject_id === sub.id);
      const subTotal = subRecords.length;
      const subPresent = subRecords.filter(a => a.status === 'Present').length;
      const subPercentage = subTotal > 0 ? parseFloat(((subPresent / subTotal) * 100).toFixed(1)) : 0;

      return {
        subject_id: sub.id,
        subject_name: sub.subject_name,
        subject_code: sub.subject_code,
        faculty_name: sub.faculty_name,
        totalClasses: subTotal,
        presentClasses: subPresent,
        absentClasses: subTotal - subPresent,
        attendancePercentage: subPercentage
      };
    });

    // Monthly attendance trend
    const monthlyMap = {};
    attendanceRecords.forEach(rec => {
      const monthKey = rec.attendance_date.toString().substring(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, total: 0, present: 0 };
      }
      monthlyMap[monthKey].total += 1;
      if (rec.status === 'Present') monthlyMap[monthKey].present += 1;
    });

    const monthlyTrend = Object.values(monthlyMap).map(m => ({
      month: m.month,
      percentage: m.total > 0 ? parseFloat(((m.present / m.total) * 100).toFixed(1)) : 0
    })).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        ...student,
        totalClasses,
        presentClasses,
        absentClasses,
        attendancePercentage,
        status,
        lowAttendanceWarning: attendancePercentage < 75,
        subjectBreakdown,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching student profile.' });
  }
};

// POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const { roll_no, name, email, class: studentClass, division, department } = req.body;

    if (!roll_no || !name || !email || !studentClass || !division) {
      return res.status(400).json({ success: false, message: 'All required fields (roll_no, name, email, class, division) must be provided.' });
    }

    const existing = await db.query('SELECT * FROM `students` WHERE `roll_no` = ?', [roll_no]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Student with this Roll Number already exists.' });
    }

    const dept = department || 'Computer Science';
    const result = await db.query(
      'INSERT INTO `students` (`roll_no`, `name`, `email`, `class`, `division`, `department`) VALUES (?, ?, ?, ?, ?, ?)',
      [roll_no, name, email, studentClass, division, dept]
    );

    res.status(201).json({
      success: true,
      message: 'Student added successfully!',
      studentId: result.insertId
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'Server error while creating student.' });
  }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const { roll_no, name, email, class: studentClass, division, department } = req.body;

    if (!roll_no || !name || !email || !studentClass || !division) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    await db.query(
      'UPDATE `students` SET `roll_no` = ?, `name` = ?, `email` = ?, `class` = ?, `division` = ?, `department` = ? WHERE `id` = ?',
      [roll_no, name, email, studentClass, division, department || 'Computer Science', studentId]
    );

    res.json({ success: true, message: 'Student details updated successfully!' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Server error while updating student.' });
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    await db.query('DELETE FROM `students` WHERE `id` = ?', [studentId]);
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting student.' });
  }
};
