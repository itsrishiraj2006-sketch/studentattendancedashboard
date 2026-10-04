/**
 * Reusable attendance status calculator
 * @param {number} percentage 
 * @param {object} thresholds { high: 75, low: 60 }
 * @returns {string} 'HIGH' | 'AVERAGE' | 'LOW'
 */
function calculateAttendanceStatus(percentage, thresholds = { high: 75, low: 60 }) {
  const p = parseFloat(percentage) || 0;
  const high = parseFloat(thresholds.high ?? 75);
  const low = parseFloat(thresholds.low ?? 60);

  if (p >= high) {
    return 'HIGH';
  } else if (p >= low) {
    return 'AVERAGE';
  } else {
    return 'LOW';
  }
}

/**
 * Calculates subject-wise and overall attendance stats for a student's attendance records
 */
function calculateStudentAttendanceStats(attendanceRecords, subjects, thresholds = { high: 75, low: 60 }, lateWeight = 0.5) {
  const subjectMap = {};

  // Initialize for all active subjects
  subjects.forEach(sub => {
    subjectMap[sub.id] = {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      faculty_name: sub.faculty_name || sub.faculty || 'Faculty Member',
      department: sub.department,
      semester: sub.semester,
      credits: sub.credits || 3,
      total_classes: 0,
      attended_classes: 0,
      missed_classes: 0,
      late_classes: 0,
      percentage: 0,
      status: 'HIGH'
    };
  });

  // Aggregate attendance
  attendanceRecords.forEach(rec => {
    const sub = subjectMap[rec.subject_id];
    if (sub) {
      sub.total_classes += 1;
      if (rec.status === 'PRESENT') {
        sub.attended_classes += 1;
      } else if (rec.status === 'LATE') {
        sub.late_classes += 1;
        // Count late class according to late weight
        sub.attended_classes += lateWeight;
      } else {
        sub.missed_classes += 1;
      }
    }
  });

  // Calculate percentages and statuses per subject
  let totalAttended = 0;
  let totalClasses = 0;
  let totalMissed = 0;

  const subjectStats = Object.values(subjectMap).map(sub => {
    totalClasses += sub.total_classes;
    totalAttended += sub.attended_classes;
    totalMissed += sub.missed_classes;

    const percentage = sub.total_classes > 0
      ? Math.round(((sub.attended_classes / sub.total_classes) * 100) * 100) / 100
      : 0;
    
    const status = calculateAttendanceStatus(percentage, thresholds);

    return {
      ...sub,
      percentage,
      status
    };
  });

  const overallPercentage = totalClasses > 0
    ? Math.round(((totalAttended / totalClasses) * 100) * 100) / 100
    : 0;

  const overallStatus = calculateAttendanceStatus(overallPercentage, thresholds);

  // Category counts
  const categoryCounts = {
    HIGH: subjectStats.filter(s => s.status === 'HIGH').length,
    AVERAGE: subjectStats.filter(s => s.status === 'AVERAGE').length,
    LOW: subjectStats.filter(s => s.status === 'LOW').length
  };

  return {
    overallPercentage,
    overallStatus,
    totalClasses,
    totalAttended: Math.round(totalAttended * 10) / 10,
    totalMissed,
    subjectStats,
    categoryCounts
  };
}

module.exports = {
  calculateAttendanceStatus,
  calculateStudentAttendanceStats
};
