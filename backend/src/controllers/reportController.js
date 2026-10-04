const db = require('../config/db');
const { calculateStudentAttendanceStats } = require('../utils/attendanceCalculator');

async function getReportData(req, res) {
  try {
    const { type, department, semester } = req.query; // 'student', 'subject', 'class', 'low'

    const { rows: students } = await db.query('SELECT * FROM students');
    const { rows: subjects } = await db.query('SELECT * FROM subjects');
    const { rows: attendance } = await db.query('SELECT * FROM attendance');
    const { rows: settings } = await db.query('SELECT * FROM settings');

    const highT = parseFloat(settings.find(s => s.key === 'high_threshold')?.value || '75');
    const lowT = parseFloat(settings.find(s => s.key === 'low_threshold')?.value || '60');
    const lateW = parseFloat(settings.find(s => s.key === 'late_weight')?.value || '0.5');

    let filteredStudents = students;
    if (department) filteredStudents = filteredStudents.filter(s => s.department === department);
    if (semester) filteredStudents = filteredStudents.filter(s => String(s.semester) === String(semester));

    const rowsData = [];

    filteredStudents.forEach(st => {
      const stAtt = attendance.filter(a => a.student_id === st.id);
      const stats = calculateStudentAttendanceStats(stAtt, subjects, { high: highT, low: lowT }, lateW);

      if (type === 'low' && stats.overallStatus !== 'LOW') {
        return;
      }

      stats.subjectStats.forEach(sub => {
        rowsData.push({
          student_id: st.student_id,
          student_name: st.name || '',
          department: st.department,
          semester: st.semester,
          subject_code: sub.code,
          subject_name: sub.name,
          total_classes: sub.total_classes,
          attended_classes: sub.attended_classes,
          missed_classes: sub.missed_classes,
          attendance_percentage: sub.percentage,
          status: sub.status,
          overall_student_percentage: stats.overallPercentage,
          overall_student_status: stats.overallStatus
        });
      });
    });

    return res.json({
      reportType: type || 'all',
      generatedAt: new Date().toISOString(),
      data: rowsData
    });
  } catch (err) {
    console.error('Report Error:', err);
    return res.status(500).json({ message: 'Error generating report data.' });
  }
}

module.exports = {
  getReportData
};
