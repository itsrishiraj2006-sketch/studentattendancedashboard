/* ========================================================
   Centralized API Client Module for Student Attendance Dashboard
   Supports Full-Stack Express REST API + Static GitHub Pages Dual-Mode
   ======================================================== */

const API_BASE_URL = '/api';

// Client-Side In-Memory Data Store & LocalStorage Persistence for Static Hosting (GitHub Pages)
let localStudents = JSON.parse(localStorage.getItem('student_dashboard_students')) || [
  { id: 1, roll_no: '2025CS101', name: 'Aarav Patel', email: 'aarav.patel@college.edu', class: '2A', division: 'D1', department: 'Computer Science' },
  { id: 2, roll_no: '2025CS102', name: 'Ananya Sharma', email: 'ananya.sharma@college.edu', class: '2A', division: 'D1', department: 'Computer Science' },
  { id: 3, roll_no: '2025CS103', name: 'Rohan Gupta', email: 'rohan.gupta@college.edu', class: '2A', division: 'D1', department: 'Computer Science' },
  { id: 4, roll_no: '2025CS104', name: 'Priya Iyer', email: 'priya.iyer@college.edu', class: '2A', division: 'D1', department: 'Computer Science' },
  { id: 5, roll_no: '2025CS105', name: 'Kabir Mehta', email: 'kabir.mehta@college.edu', class: '2A', division: 'D1', department: 'Computer Science' },
  { id: 6, roll_no: '2025CS106', name: 'Diya Joshi', email: 'diya.joshi@college.edu', class: '2A', division: 'D2', department: 'Computer Science' },
  { id: 7, roll_no: '2025CS107', name: 'Aditya Verma', email: 'aditya.verma@college.edu', class: '2A', division: 'D2', department: 'Computer Science' },
  { id: 8, roll_no: '2025CS108', name: 'Sneha Reddy', email: 'sneha.reddy@college.edu', class: '2A', division: 'D2', department: 'Computer Science' },
  { id: 9, roll_no: '2025CS109', name: 'Ishaan Malhotra', email: 'ishaan.malhotra@college.edu', class: '2A', division: 'D2', department: 'Computer Science' },
  { id: 10, roll_no: '2025CS110', name: 'Kavya Nair', email: 'kavya.nair@college.edu', class: '2A', division: 'D2', department: 'Computer Science' },
  { id: 11, roll_no: '2025CS111', name: 'Devansh Singh', email: 'devansh.singh@college.edu', class: '2B', division: 'D1', department: 'Information Tech' },
  { id: 12, roll_no: '2025CS112', name: 'Tanvi Deshmukh', email: 'tanvi.deshmukh@college.edu', class: '2B', division: 'D1', department: 'Information Tech' },
  { id: 13, roll_no: '2025CS113', name: 'Arjun Kapoor', email: 'arjun.kapoor@college.edu', class: '2B', division: 'D1', department: 'Information Tech' },
  { id: 14, roll_no: '2025CS114', name: 'Riya Bansal', email: 'riya.bansal@college.edu', class: '2B', division: 'D1', department: 'Information Tech' },
  { id: 15, roll_no: '2025CS115', name: 'Siddharth Rao', email: 'siddharth.rao@college.edu', class: '2B', division: 'D1', department: 'Information Tech' },
  { id: 16, roll_no: '2025CS116', name: 'Meera Kulkarni', email: 'meera.kulkarni@college.edu', class: '2B', division: 'D2', department: 'Information Tech' },
  { id: 17, roll_no: '2025CS117', name: 'Varun Agarwal', email: 'varun.agarwal@college.edu', class: '2B', division: 'D2', department: 'Information Tech' },
  { id: 18, roll_no: '2025CS118', name: 'Pooja Pandey', email: 'pooja.pandey@college.edu', class: '2B', division: 'D2', department: 'Information Tech' },
  { id: 19, roll_no: '2025CS119', name: 'Yash Choudhary', email: 'yash.choudhary@college.edu', class: '2B', division: 'D2', department: 'Information Tech' },
  { id: 20, roll_no: '2025CS120', name: 'Neha Bhat', email: 'neha.bhat@college.edu', class: '2B', division: 'D2', department: 'Information Tech' }
];

let localSubjects = [
  { id: 1, subject_code: 'CS201', subject_name: 'Data Structures & Algorithms', faculty_name: 'Dr. Rajesh Sharma' },
  { id: 2, subject_code: 'CS202', subject_name: 'Database Management Systems', faculty_name: 'Prof. Anita Verma' },
  { id: 3, subject_code: 'CS203', subject_name: 'Java Programming', faculty_name: 'Dr. Vikramaditya Rao' },
  { id: 4, subject_code: 'CS204', subject_name: 'Computer Architecture', faculty_name: 'Prof. Meenakshi Sundaram' },
  { id: 5, subject_code: 'CS205', subject_name: 'Mathematics III', faculty_name: 'Dr. Sanjay Kulkarni' }
];

let localAttendance = JSON.parse(localStorage.getItem('student_dashboard_attendance')) || [];

if (localAttendance.length === 0) {
  const dates = ['2026-08-01', '2026-08-05', '2026-08-10', '2026-08-15', '2026-08-20', '2026-08-25', '2026-08-30', '2026-09-01'];
  localStudents.forEach(s => {
    localSubjects.forEach(sub => {
      dates.forEach((d, idx) => {
        let isPresent = (idx + s.id + sub.id) % 4 !== 0;
        localAttendance.push({
          id: localAttendance.length + 1,
          student_id: s.id,
          subject_id: sub.id,
          attendance_date: d,
          status: isPresent ? 'Present' : 'Absent'
        });
      });
    });
  });
}

function saveLocalState() {
  localStorage.setItem('student_dashboard_students', JSON.stringify(localStudents));
  localStorage.setItem('student_dashboard_attendance', JSON.stringify(localAttendance));
}

// Fetch helper with robust fallback to local client state for static hosting (GitHub Pages)
async function apiFetch(url, options = {}) {
  try {
    const defaultHeaders = {
      'Bypass-Tunnel-Reminder': 'true',
      'localtunnel-skip-warning': 'true',
      'ngrok-skip-browser-warning': 'true'
    };
    const headers = { ...defaultHeaders, ...(options.headers || {}) };
    const response = await fetch(url, { ...options, headers });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
    }
  } catch (err) {
    // Network error -> fallback
  }

  // Fallback to client-side data store on static hosting (GitHub Pages)
  return handleLocalClientRequest(url, options);
}

// Local Client Request Handler for static hosting environments (e.g. GitHub Pages)
function handleLocalClientRequest(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const fullUrl = url.startsWith('http') ? url : origin + url;
  const urlObj = new URL(fullUrl);
  const path = urlObj.pathname;
  const params = urlObj.searchParams;

  // 1. DASHBOARD
  if (path.includes('/dashboard')) {
    let students = [...localStudents];
    const classVal = params.get('class');
    const divVal = params.get('division');
    const subVal = params.get('subject_id');

    if (classVal && classVal !== 'All') students = students.filter(s => s.class === classVal);
    if (divVal && divVal !== 'All') students = students.filter(s => s.division === divVal);

    const sIds = new Set(students.map(s => s.id));
    let att = localAttendance.filter(a => sIds.has(a.student_id));
    if (subVal && subVal !== 'All') att = att.filter(a => a.subject_id == subVal);

    const totalStudents = students.length;
    const presentToday = att.filter(a => a.status === 'Present').length;
    const absentToday = att.filter(a => a.status === 'Absent').length;
    const totalAtt = att.length;
    const totalPresent = att.filter(a => a.status === 'Present').length;
    const overallPct = totalAtt > 0 ? parseFloat(((totalPresent / totalAtt) * 100).toFixed(1)) : 0;

    const studentAttChart = students.map(s => {
      const recs = att.filter(a => a.student_id === s.id);
      const tot = recs.length;
      const pres = recs.filter(a => a.status === 'Present').length;
      const pct = tot > 0 ? parseFloat(((pres / tot) * 100).toFixed(1)) : 0;
      return { student_id: s.id, roll_no: s.roll_no, name: s.name, class: s.class, division: s.division, attendancePercentage: pct, isLowAttendance: pct < 75 };
    });

    const presentVsAbsentChart = [
      { label: 'Present', count: totalPresent, percentage: totalAtt > 0 ? parseFloat(((totalPresent / totalAtt) * 100).toFixed(1)) : 0, color: '#10b981' },
      { label: 'Absent', count: totalAtt - totalPresent, percentage: totalAtt > 0 ? parseFloat(((totalAtt - totalPresent) / totalAtt) * 100).toFixed(1) : 0, color: '#ef4444' }
    ];

    const subjectAttChart = localSubjects.map(sub => {
      const recs = att.filter(a => a.subject_id === sub.id);
      const tot = recs.length;
      const pres = recs.filter(a => a.status === 'Present').length;
      const pct = tot > 0 ? parseFloat(((pres / tot) * 100).toFixed(1)) : 0;
      return { subject_id: sub.id, subject_code: sub.subject_code, subject_name: sub.subject_name, faculty_name: sub.faculty_name, attendancePercentage: pct, totalClasses: tot, presentClasses: pres };
    });

    const dateMap = {};
    att.forEach(a => {
      const d = a.attendance_date;
      if (!dateMap[d]) dateMap[d] = { date: d, total: 0, present: 0 };
      dateMap[d].total += 1;
      if (a.status === 'Present') dateMap[d].present += 1;
    });

    const trendChart = Object.values(dateMap).map(item => ({
      date: item.date,
      presentCount: item.present,
      totalCount: item.total,
      percentage: item.total > 0 ? parseFloat(((item.present / item.total) * 100).toFixed(1)) : 0
    })).sort((a,b) => a.date.localeCompare(b.date));

    return {
      success: true,
      data: {
        kpis: { totalStudents, presentToday, absentToday, overallAttendancePercentage: overallPct, targetDate: '2026-09-01' },
        charts: { studentAttendance: studentAttChart, presentVsAbsent: presentVsAbsentChart, subjectAttendance: subjectAttChart, trendAttendance: trendChart }
      }
    };
  }

  // 2. STUDENTS CRUD
  if (path.includes('/students')) {
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const existing = localStudents.find(s => s.roll_no.toLowerCase() === body.roll_no.toLowerCase());
      if (existing) return { success: false, message: 'Student with this Roll Number already exists.' };
      const newId = localStudents.length ? Math.max(...localStudents.map(s => s.id)) + 1 : 1;
      const newStudent = { id: newId, ...body };
      localStudents.push(newStudent);
      saveLocalState();
      return { success: true, message: 'Student added successfully!', studentId: newId };
    }

    if (method === 'PUT') {
      const body = JSON.parse(options.body || '{}');
      const id = path.split('/').pop();
      const idx = localStudents.findIndex(s => s.id == id);
      if (idx !== -1) {
        localStudents[idx] = { ...localStudents[idx], ...body };
        saveLocalState();
      }
      return { success: true, message: 'Student updated successfully!' };
    }

    if (method === 'DELETE') {
      const id = path.split('/').pop();
      localStudents = localStudents.filter(s => s.id != id);
      localAttendance = localAttendance.filter(a => a.student_id != id);
      saveLocalState();
      return { success: true, message: 'Student deleted successfully!' };
    }

    // GET Student by ID
    const singleId = path.split('/').pop();
    if (!isNaN(singleId) && singleId !== 'students') {
      const student = localStudents.find(s => s.id == singleId);
      if (!student) return { success: false, message: 'Student not found.' };

      const recs = localAttendance.filter(a => a.student_id == singleId);
      const tot = recs.length;
      const pres = recs.filter(a => a.status === 'Present').length;
      const pct = tot > 0 ? parseFloat(((pres / tot) * 100).toFixed(1)) : 0;

      const subBreakdown = localSubjects.map(sub => {
        const sRecs = recs.filter(a => a.subject_id === sub.id);
        const sTot = sRecs.length;
        const sPres = sRecs.filter(a => a.status === 'Present').length;
        return { subject_id: sub.id, subject_code: sub.subject_code, subject_name: sub.subject_name, faculty_name: sub.faculty_name, totalClasses: sTot, presentClasses: sPres, absentClasses: sTot - sPres, attendancePercentage: sTot > 0 ? parseFloat(((sPres / sTot) * 100).toFixed(1)) : 0 };
      });

      return {
        success: true,
        data: {
          ...student,
          totalClasses: tot,
          presentClasses: pres,
          absentClasses: tot - pres,
          attendancePercentage: pct,
          status: pct >= 90 ? 'Excellent' : pct >= 80 ? 'Good' : pct >= 75 ? 'Satisfactory' : 'Low Attendance',
          lowAttendanceWarning: pct < 75,
          subjectBreakdown: subBreakdown,
          monthlyTrend: [{ month: '2026-08', percentage: pct }]
        }
      };
    }

    // GET All Students
    let result = [...localStudents];
    const searchVal = params.get('search');
    const classVal = params.get('class');
    const divVal = params.get('division');

    if (classVal && classVal !== 'All') result = result.filter(s => s.class === classVal);
    if (divVal && divVal !== 'All') result = result.filter(s => s.division === divVal);
    if (searchVal) {
      const q = searchVal.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.roll_no.toLowerCase().includes(q));
    }

    const calculated = result.map(s => {
      const recs = localAttendance.filter(a => a.student_id === s.id);
      const tot = recs.length;
      const pres = recs.filter(a => a.status === 'Present').length;
      const pct = tot > 0 ? parseFloat(((pres / tot) * 100).toFixed(1)) : 0;
      return {
        ...s,
        totalClasses: tot,
        presentClasses: pres,
        absentClasses: tot - pres,
        attendancePercentage: pct,
        status: pct >= 90 ? 'Excellent' : pct >= 80 ? 'Good' : pct >= 75 ? 'Satisfactory' : 'Low Attendance'
      };
    });

    return { success: true, count: calculated.length, data: calculated };
  }

  // 3. SUBJECTS
  if (path.includes('/subjects')) {
    return { success: true, count: localSubjects.length, data: localSubjects };
  }

  // 4. ATTENDANCE
  if (path.includes('/attendance')) {
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const items = body.items || [];
      items.forEach(item => {
        const idx = localAttendance.findIndex(a => a.student_id == item.student_id && a.subject_id == item.subject_id && a.attendance_date == item.attendance_date);
        if (idx !== -1) {
          localAttendance[idx].status = item.status;
        } else {
          localAttendance.push({ id: localAttendance.length + 1, ...item });
        }
      });
      saveLocalState();
      return { success: true, message: `Recorded attendance for ${items.length} student(s).`, savedCount: items.length };
    }

    let result = localAttendance.map(a => {
      const student = localStudents.find(s => s.id === a.student_id) || {};
      const subject = localSubjects.find(sub => sub.id === a.subject_id) || {};
      return {
        ...a,
        student_name: student.name,
        roll_no: student.roll_no,
        class: student.class,
        division: student.division,
        subject_name: subject.subject_name,
        subject_code: subject.subject_code
      };
    });

    return { success: true, count: result.length, data: result };
  }

  // 5. ANALYTICS
  if (path.includes('/analytics')) {
    const studentMetrics = localStudents.map(s => {
      const recs = localAttendance.filter(a => a.student_id === s.id);
      const tot = recs.length;
      const pres = recs.filter(a => a.status === 'Present').length;
      const pct = tot > 0 ? parseFloat(((pres / tot) * 100).toFixed(1)) : 0;
      return { ...s, totalClasses: tot, presentClasses: pres, absentClasses: tot - pres, attendancePercentage: pct };
    });

    const dist = [
      { range: '90-100%', count: studentMetrics.filter(s => s.attendancePercentage >= 90).length, percentage: 20 },
      { range: '80-89%', count: studentMetrics.filter(s => s.attendancePercentage >= 80 && s.attendancePercentage < 90).length, percentage: 60 },
      { range: '75-79%', count: studentMetrics.filter(s => s.attendancePercentage >= 75 && s.attendancePercentage < 80).length, percentage: 0 },
      { range: 'Below 75%', count: studentMetrics.filter(s => s.attendancePercentage < 75).length, percentage: 20 }
    ];

    const topS = [...studentMetrics].sort((a,b) => b.attendancePercentage - a.attendancePercentage).slice(0, 5);
    const lowS = studentMetrics.filter(s => s.attendancePercentage < 75).sort((a,b) => a.attendancePercentage - b.attendancePercentage);

    const subComp = localSubjects.map(sub => {
      const recs = localAttendance.filter(a => a.subject_id === sub.id);
      const tot = recs.length;
      const pres = recs.filter(a => a.status === 'Present').length;
      return { subject_id: sub.id, subject_code: sub.subject_code, subject_name: sub.subject_name, faculty_name: sub.faculty_name, totalClasses: tot, presentClasses: pres, absentClasses: tot - pres, attendancePercentage: tot > 0 ? parseFloat(((pres / tot) * 100).toFixed(1)) : 0 };
    });

    return { success: true, data: { distribution: dist, topStudents: topS, lowAttendanceStudents: lowS, subjectComparison: subComp, trends: [] } };
  }

  return { success: true, data: [] };
}

const API = {
  // 1. Dashboard API
  async getDashboardData(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await apiFetch(`${API_BASE_URL}/dashboard?${query}`);
  },

  // 2. Students API
  async getStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await apiFetch(`${API_BASE_URL}/students?${query}`);
  },

  async getStudentById(id) {
    return await apiFetch(`${API_BASE_URL}/students/${id}`);
  },

  async createStudent(studentData) {
    return await apiFetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
  },

  async updateStudent(id, studentData) {
    return await apiFetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
  },

  async deleteStudent(id) {
    return await apiFetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE'
    });
  },

  // 3. Subjects API
  async getSubjects() {
    return await apiFetch(`${API_BASE_URL}/subjects`);
  },

  // 4. Attendance API
  async getAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await apiFetch(`${API_BASE_URL}/attendance?${query}`);
  },

  async submitAttendance(items) {
    return await apiFetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
  },

  // 5. Analytics API
  async getAnalyticsData(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await apiFetch(`${API_BASE_URL}/analytics?${query}`);
  }
};

window.API = API;
