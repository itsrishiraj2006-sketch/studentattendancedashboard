const db = require('../config/db');

exports.getAnalyticsData = async (req, res) => {
  try {
    const { class: studentClass, division, subject_id } = req.query;

    let students = await db.query('SELECT * FROM `students` ORDER BY `id` ASC');
    let attendance = await db.query('SELECT * FROM `attendance`');
    const subjects = await db.query('SELECT * FROM `subjects`');

    if (studentClass && studentClass !== 'All') {
      students = students.filter(s => s.class === studentClass);
    }
    if (division && division !== 'All') {
      students = students.filter(s => s.division === division);
    }

    const studentIds = new Set(students.map(s => s.id));
    let filteredAttendance = attendance.filter(a => studentIds.has(a.student_id));

    if (subject_id && subject_id !== 'All') {
      filteredAttendance = filteredAttendance.filter(a => a.subject_id == subject_id);
    }

    // 1. Calculate Attendance % for each student
    const studentMetrics = students.map(student => {
      const records = filteredAttendance.filter(a => a.student_id === student.id);
      const total = records.length;
      const present = records.filter(a => a.status === 'Present').length;
      const pct = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

      return {
        ...student,
        totalClasses: total,
        presentClasses: present,
        absentClasses: total - present,
        attendancePercentage: pct
      };
    });

    // 2. Attendance Distribution Buckets
    const distribution = {
      '90-100%': studentMetrics.filter(s => s.attendancePercentage >= 90).length,
      '80-89%': studentMetrics.filter(s => s.attendancePercentage >= 80 && s.attendancePercentage < 90).length,
      '75-79%': studentMetrics.filter(s => s.attendancePercentage >= 75 && s.attendancePercentage < 80).length,
      'Below 75%': studentMetrics.filter(s => s.attendancePercentage < 75).length
    };

    const distributionArray = Object.keys(distribution).map(range => ({
      range,
      count: distribution[range],
      percentage: studentMetrics.length > 0 ? parseFloat(((distribution[range] / studentMetrics.length) * 100).toFixed(1)) : 0
    }));

    // 3. Top 5 Students
    const topStudents = [...studentMetrics]
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
      .slice(0, 5);

    // 4. Low Attendance Students (< 75%)
    const lowAttendanceStudents = studentMetrics
      .filter(s => s.attendancePercentage < 75)
      .sort((a, b) => a.attendancePercentage - b.attendancePercentage);

    // 5. Subject Comparison Data
    const subjectComparison = subjects.map(sub => {
      const subRecs = filteredAttendance.filter(a => a.subject_id === sub.id);
      const total = subRecs.length;
      const present = subRecs.filter(a => a.status === 'Present').length;
      const pct = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

      return {
        subject_id: sub.id,
        subject_code: sub.subject_code,
        subject_name: sub.subject_name,
        faculty_name: sub.faculty_name,
        totalClasses: total,
        presentClasses: present,
        absentClasses: total - present,
        attendancePercentage: pct
      };
    });

    // 6. Trend Timeline
    const dateMap = {};
    filteredAttendance.forEach(a => {
      const dStr = a.attendance_date.toString().substring(0, 10);
      if (!dateMap[dStr]) {
        dateMap[dStr] = { date: dStr, total: 0, present: 0 };
      }
      dateMap[dStr].total += 1;
      if (a.status === 'Present') dateMap[dStr].present += 1;
    });

    const trends = Object.values(dateMap)
      .map(item => ({
        date: item.date,
        percentage: item.total > 0 ? parseFloat(((item.present / item.total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        distribution: distributionArray,
        topStudents,
        lowAttendanceStudents,
        subjectComparison,
        trends
      }
    });
  } catch (error) {
    console.error('Error in getAnalyticsData:', error);
    res.status(500).json({ success: false, message: 'Server error generating analytics data.' });
  }
};
