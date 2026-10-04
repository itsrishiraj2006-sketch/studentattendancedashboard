const db = require('../config/db');
const { calculateStudentAttendanceStats, calculateAttendanceStatus } = require('../utils/attendanceCalculator');

async function getThresholds() {
  const { rows } = await db.query('SELECT * FROM settings');
  const high = rows.find(r => r.key === 'high_threshold')?.value || '75';
  const low = rows.find(r => r.key === 'low_threshold')?.value || '60';
  const lateWeight = rows.find(r => r.key === 'late_weight')?.value || '0.5';
  return { high: parseFloat(high), low: parseFloat(low), lateWeight: parseFloat(lateWeight) };
}

async function getStudentAnalytics(req, res) {
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

    const stats = calculateStudentAttendanceStats(attendance, subjects, thresholds, thresholds.lateWeight);

    // Build timeline data (Group by date, calculate cumulative percentage over time)
    const sortedAtt = [...attendance].sort((a, b) => new Date(a.date) - new Date(b.date));
    const timelineMap = {};
    let runningClasses = 0;
    let runningAttended = 0;

    sortedAtt.forEach(rec => {
      const d = rec.date;
      runningClasses += 1;
      if (rec.status === 'PRESENT') runningAttended += 1;
      else if (rec.status === 'LATE') runningAttended += thresholds.lateWeight;

      timelineMap[d] = Math.round(((runningAttended / runningClasses) * 100) * 100) / 100;
    });

    const timelineData = Object.keys(timelineMap).map(d => ({
      date: d,
      percentage: timelineMap[d]
    }));

    return res.json({
      student: {
        id: student.id,
        user_id: student.user_id,
        name: student.name || '',
        email: student.email || '',
        student_id: student.student_id,
        department: student.department,
        semester: student.semester,
        section: student.section || 'A'
      },
      stats,
      timelineData,
      thresholds
    });
  } catch (err) {
    console.error('Student Analytics Error:', err);
    return res.status(500).json({ message: 'Error fetching student analytics.' });
  }
}

async function getClassAnalytics(req, res) {
  try {
    const { rows: students } = await db.query('SELECT * FROM students');
    const { rows: subjects } = await db.query('SELECT * FROM subjects');
    const { rows: attendance } = await db.query('SELECT * FROM attendance');
    const thresholds = await getThresholds();

    let totalPercentageSum = 0;
    const studentBreakdown = students.map(st => {
      const stAtt = attendance.filter(a => a.student_id === st.id);
      const stats = calculateStudentAttendanceStats(stAtt, subjects, thresholds, thresholds.lateWeight);
      totalPercentageSum += stats.overallPercentage;

      return {
        id: st.id,
        student_id: st.student_id,
        name: st.name || '',
        email: st.email || '',
        department: st.department,
        semester: st.semester,
        overallPercentage: stats.overallPercentage,
        overallStatus: stats.overallStatus,
        totalClasses: stats.totalClasses,
        totalAttended: stats.totalAttended,
        totalMissed: stats.totalMissed
      };
    });

    const avgClassAttendance = students.length > 0
      ? Math.round((totalPercentageSum / students.length) * 100) / 100
      : 0;

    const lowAttendanceStudents = studentBreakdown.filter(s => s.overallStatus === 'LOW');
    const highAttendanceStudents = studentBreakdown.filter(s => s.overallStatus === 'HIGH');
    const averageAttendanceStudents = studentBreakdown.filter(s => s.overallStatus === 'AVERAGE');

    // Subject breakdown
    const subjectBreakdown = subjects.map(sub => {
      const subAtt = attendance.filter(a => a.subject_id === sub.id);
      const total = subAtt.length;
      const attended = subAtt.filter(a => a.status === 'PRESENT').length;
      const late = subAtt.filter(a => a.status === 'LATE').length;
      const missed = subAtt.filter(a => a.status === 'ABSENT').length;
      const percentage = total > 0 ? Math.round(((attended + late * thresholds.lateWeight) / total) * 100 * 100) / 100 : 0;
      const status = calculateAttendanceStatus(percentage, thresholds);

      return {
        id: sub.id,
        name: sub.name,
        code: sub.code,
        faculty_name: sub.faculty_name,
        totalClasses: total,
        attended,
        missed,
        late,
        percentage,
        status
      };
    });

    return res.json({
      summary: {
        totalStudents: students.length,
        totalSubjects: subjects.length,
        avgClassAttendance,
        lowAttendanceCount: lowAttendanceStudents.length,
        highAttendanceCount: highAttendanceStudents.length,
        averageAttendanceCount: averageAttendanceStudents.length
      },
      studentBreakdown,
      subjectBreakdown,
      lowAttendanceStudents,
      highAttendanceStudents,
      thresholds
    });
  } catch (err) {
    console.error('Class Analytics Error:', err);
    return res.status(500).json({ message: 'Error fetching class analytics.' });
  }
}

async function getLowAttendanceAlerts(req, res) {
  try {
    const { rows: students } = await db.query('SELECT * FROM students');
    const { rows: subjects } = await db.query('SELECT * FROM subjects');
    const { rows: attendance } = await db.query('SELECT * FROM attendance');
    const thresholds = await getThresholds();

    const alerts = [];

    students.forEach(st => {
      subjects.forEach(sub => {
        const subAtt = attendance.filter(a => a.student_id === st.id && a.subject_id === sub.id);
        if (subAtt.length === 0) return;

        const total = subAtt.length;
        const attended = subAtt.filter(a => a.status === 'PRESENT').length;
        const late = subAtt.filter(a => a.status === 'LATE').length;
        const percentage = Math.round(((attended + late * thresholds.lateWeight) / total) * 100 * 100) / 100;

        if (percentage < thresholds.low) {
          alerts.push({
            student_db_id: st.id,
            student_id: st.student_id,
            student_name: st.name || '',
            department: st.department,
            semester: st.semester,
            subject_id: sub.id,
            subject_name: sub.name,
            subject_code: sub.code,
            percentage,
            threshold: thresholds.low
          });
        }
      });
    });

    return res.json({ alerts });
  } catch (err) {
    console.error('Low Attendance Alerts Error:', err);
    return res.status(500).json({ message: 'Error fetching alerts.' });
  }
}

module.exports = {
  getStudentAnalytics,
  getClassAnalytics,
  getLowAttendanceAlerts
};
