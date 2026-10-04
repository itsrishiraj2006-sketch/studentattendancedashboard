const db = require('../config/db');

// GET /api/dashboard
exports.getDashboardData = async (req, res) => {
  try {
    const { class: studentClass, division, subject_id, date, status, trendPeriod } = req.query;

    let students = await db.query('SELECT * FROM `students` ORDER BY `id` ASC');
    let attendance = await db.query('SELECT * FROM `attendance`');
    const subjects = await db.query('SELECT * FROM `subjects`');

    // 1. Filter students list based on Class & Division
    if (studentClass && studentClass !== 'All') {
      students = students.filter(s => s.class === studentClass);
    }
    if (division && division !== 'All') {
      students = students.filter(s => s.division === division);
    }

    const studentIds = new Set(students.map(s => s.id));

    // 2. Filter attendance records based on student filter, subject, date, status
    let filteredAttendance = attendance.filter(a => studentIds.has(a.student_id));

    if (subject_id && subject_id !== 'All') {
      filteredAttendance = filteredAttendance.filter(a => a.subject_id == subject_id);
    }
    if (date) {
      const targetDate = new Date(date).toISOString().split('T')[0];
      filteredAttendance = filteredAttendance.filter(a => a.attendance_date.toString().substring(0, 10) === targetDate);
    }
    if (status && status !== 'All') {
      filteredAttendance = filteredAttendance.filter(a => a.status === status);
    }

    // 3. Compute KPI Cards
    const totalStudents = students.length;
    
    // Determine target date for Present/Absent Today KPI
    const todayStr = date ? new Date(date).toISOString().split('T')[0] : '2026-09-01';
    const todayRecords = filteredAttendance.filter(a => a.attendance_date.toString().substring(0, 10) === todayStr);
    
    let presentToday = todayRecords.filter(a => a.status === 'Present').length;
    let absentToday = todayRecords.filter(a => a.status === 'Absent').length;

    // Fallback to overall counts if no records exist for target date
    if (todayRecords.length === 0) {
      presentToday = filteredAttendance.filter(a => a.status === 'Present').length;
      absentToday = filteredAttendance.filter(a => a.status === 'Absent').length;
    }

    const totalAttendanceRecords = filteredAttendance.length;
    const totalPresentRecords = filteredAttendance.filter(a => a.status === 'Present').length;
    const overallAttendancePercentage = totalAttendanceRecords > 0
      ? parseFloat(((totalPresentRecords / totalAttendanceRecords) * 100).toFixed(1))
      : 0;

    const kpis = {
      totalStudents,
      presentToday,
      absentToday,
      overallAttendancePercentage,
      targetDate: todayStr
    };

    // 4. Chart 1 — Student Attendance Percentage (D3 Bar Chart)
    const studentAttendanceChart = students.map(student => {
      const studentRecs = filteredAttendance.filter(a => a.student_id === student.id);
      const total = studentRecs.length;
      const present = studentRecs.filter(a => a.status === 'Present').length;
      const pct = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

      return {
        student_id: student.id,
        roll_no: student.roll_no,
        name: student.name,
        class: student.class,
        division: student.division,
        attendancePercentage: pct,
        isLowAttendance: pct < 75
      };
    });

    // 5. Chart 2 — Present vs Absent Donut Chart
    const presentCount = filteredAttendance.filter(a => a.status === 'Present').length;
    const absentCount = filteredAttendance.filter(a => a.status === 'Absent').length;
    const totalCount = presentCount + absentCount;

    const presentVsAbsentChart = [
      { label: 'Present', count: presentCount, percentage: totalCount > 0 ? parseFloat(((presentCount / totalCount) * 100).toFixed(1)) : 0, color: '#10b981' },
      { label: 'Absent', count: absentCount, percentage: totalCount > 0 ? parseFloat(((absentCount / totalCount) * 100).toFixed(1)) : 0, color: '#ef4444' }
    ];

    // 6. Chart 3 — Subject-wise Attendance Bar Chart
    const subjectAttendanceChart = subjects.map(sub => {
      const subRecs = filteredAttendance.filter(a => a.subject_id === sub.id);
      const total = subRecs.length;
      const present = subRecs.filter(a => a.status === 'Present').length;
      const pct = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

      return {
        subject_id: sub.id,
        subject_code: sub.subject_code,
        subject_name: sub.subject_name,
        faculty_name: sub.faculty_name,
        attendancePercentage: pct,
        totalClasses: total,
        presentClasses: present
      };
    });

    // 7. Chart 4 — Attendance Trend Line Chart (Daily / Weekly / Monthly)
    const periodMap = {};
    filteredAttendance.forEach(a => {
      let dateKey = a.attendance_date.toString().substring(0, 10);
      if (trendPeriod === 'monthly') {
        dateKey = dateKey.substring(0, 7); // YYYY-MM
      } else if (trendPeriod === 'weekly') {
        const d = new Date(dateKey);
        const dayNum = d.getDay() || 7;
        d.setDate(d.getDate() + 4 - dayNum);
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        dateKey = `W${weekNo}-${d.getFullYear()}`;
      }

      if (!periodMap[dateKey]) {
        periodMap[dateKey] = { date: dateKey, total: 0, present: 0 };
      }
      periodMap[dateKey].total += 1;
      if (a.status === 'Present') periodMap[dateKey].present += 1;
    });

    const trendAttendanceChart = Object.values(periodMap)
      .map(item => ({
        date: item.date,
        presentCount: item.present,
        totalCount: item.total,
        percentage: item.total > 0 ? parseFloat(((item.present / item.total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        kpis,
        charts: {
          studentAttendance: studentAttendanceChart,
          presentVsAbsent: presentVsAbsentChart,
          subjectAttendance: subjectAttendanceChart,
          trendAttendance: trendAttendanceChart
        },
        students: studentAttendanceChart
      }
    });
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    res.status(500).json({ success: false, message: 'Server error generating dashboard data.' });
  }
};
