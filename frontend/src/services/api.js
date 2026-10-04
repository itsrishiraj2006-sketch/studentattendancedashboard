import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
});

// Demo Seed Dataset for offline / GitHub Pages deployment
const demoUserStudent = {
  id: 3,
  name: 'Rahul Kumar',
  email: 'student@example.com',
  role: 'STUDENT',
  studentDetails: { id: 1, student_id: 'ST001', department: 'Computer Science', semester: '4', section: 'A' }
};

const demoUserTeacher = {
  id: 1,
  name: 'Dr. Ramesh Kumar',
  email: 'teacher@example.com',
  role: 'TEACHER',
  teacherDetails: { id: 1, department: 'Computer Science' }
};

const demoSubjects = [
  { id: 1, name: 'Data Structures', code: 'CS201', faculty_name: 'Dr. Ramesh Kumar', department: 'Computer Science', semester: '4', credits: 4, totalClasses: 30, total_classes: 30, attended: 25, attended_classes: 25, missed: 5, missed_classes: 5, percentage: 83.33, status: 'HIGH' },
  { id: 2, name: 'Database Management Systems', code: 'CS202', faculty_name: 'Prof. Sunita Sharma', department: 'Computer Science', semester: '4', credits: 4, totalClasses: 28, total_classes: 28, attended: 22, attended_classes: 22, missed: 6, missed_classes: 6, percentage: 78.57, status: 'HIGH' },
  { id: 3, name: 'Computer Networks', code: 'CS203', faculty_name: 'Dr. Amit Verma', department: 'Computer Science', semester: '4', credits: 3, totalClasses: 25, total_classes: 25, attended: 17, attended_classes: 17, missed: 8, missed_classes: 8, percentage: 68.0, status: 'AVERAGE' },
  { id: 4, name: 'Operating Systems', code: 'CS204', faculty_name: 'Prof. Rajesh Gupta', department: 'Computer Science', semester: '4', credits: 4, totalClasses: 32, total_classes: 32, attended: 29, attended_classes: 29, missed: 3, missed_classes: 3, percentage: 90.63, status: 'HIGH' },
  { id: 5, name: 'Artificial Intelligence', code: 'CS205', faculty_name: 'Dr. Neha Kapoor', department: 'Computer Science', semester: '4', credits: 3, totalClasses: 26, total_classes: 26, attended: 19, attended_classes: 19, missed: 7, missed_classes: 7, percentage: 73.08, status: 'AVERAGE' }
];

const demoStudentStats = {
  overallPercentage: 80.85,
  overallStatus: 'HIGH',
  totalClasses: 141,
  totalAttended: 112,
  totalMissed: 29,
  subjectStats: demoSubjects,
  categoryCounts: { HIGH: 3, AVERAGE: 2, LOW: 0 }
};

const demoTimeline = [
  { date: '2026-09-01', percentage: 75 },
  { date: '2026-09-08', percentage: 78 },
  { date: '2026-09-15', percentage: 76 },
  { date: '2026-09-22', percentage: 82 },
  { date: '2026-09-29', percentage: 80.85 }
];

const demoAlerts = [
  { student_db_id: 3, student_id: 'ST003', student_name: 'Priya Sharma', department: 'Computer Science', semester: '4', subject_id: 3, subject_name: 'Computer Networks', subject_code: 'CS203', percentage: 52.0, threshold: 60 }
];

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor with Complete Offline / Live Demo Fallbacks
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';

    // Handle any network error, status 0, 404, or 500 when offline / on static deployment
    if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.response?.status >= 400) {
      if (url.includes('/auth/login')) {
        const body = JSON.parse(error.config?.data || '{}');
        const user = (body.role === 'TEACHER' || body.email === 'teacher@example.com') ? demoUserTeacher : demoUserStudent;
        return Promise.resolve({
          data: {
            message: 'Login successful (Demo Mode)',
            token: 'demo_jwt_token_2026',
            user
          }
        });
      }

      if (url.includes('/auth/me')) {
        const savedUser = localStorage.getItem('user');
        const user = savedUser ? JSON.parse(savedUser) : demoUserTeacher;
        return Promise.resolve({ data: { user } });
      }

      if (url.includes('/analytics/alerts')) {
        return Promise.resolve({ data: { alerts: demoAlerts } });
      }

      if (url.includes('/analytics/student/')) {
        return Promise.resolve({
          data: {
            student: demoUserStudent.studentDetails,
            stats: demoStudentStats,
            timelineData: demoTimeline,
            thresholds: { high: 75, low: 60 }
          }
        });
      }

      if (url.includes('/analytics/class')) {
        return Promise.resolve({
          data: {
            summary: { totalStudents: 10, totalSubjects: 5, avgClassAttendance: 78.5, lowAttendanceCount: 1, highAttendanceCount: 3, averageAttendanceCount: 1 },
            studentBreakdown: [
              { id: 1, student_id: 'ST001', name: 'Rahul Kumar', department: 'Computer Science', semester: '4', overallPercentage: 83.5, overallStatus: 'HIGH' },
              { id: 2, student_id: 'ST002', name: 'Aman Verma', department: 'Computer Science', semester: '4', overallPercentage: 68.0, overallStatus: 'AVERAGE' },
              { id: 3, student_id: 'ST003', name: 'Priya Sharma', department: 'Computer Science', semester: '4', overallPercentage: 52.0, overallStatus: 'LOW' }
            ],
            subjectBreakdown: demoSubjects,
            lowAttendanceStudents: [{ id: 3, student_id: 'ST003', name: 'Priya Sharma', overallPercentage: 52.0, overallStatus: 'LOW' }],
            highAttendanceStudents: [{ id: 1, student_id: 'ST001', name: 'Rahul Kumar', overallPercentage: 83.5, overallStatus: 'HIGH' }]
          }
        });
      }

      if (url.includes('/subjects')) {
        return Promise.resolve({ data: { subjects: demoSubjects } });
      }

      if (url.includes('/students')) {
        return Promise.resolve({
          data: {
            students: [
              { id: 1, student_id: 'ST001', name: 'Rahul Kumar', email: 'student@example.com', department: 'Computer Science', semester: '4', section: 'A', overallPercentage: 83.5, overallStatus: 'HIGH' },
              { id: 2, student_id: 'ST002', name: 'Aman Verma', email: 'aman@example.com', department: 'Computer Science', semester: '4', section: 'A', overallPercentage: 68.0, overallStatus: 'AVERAGE' },
              { id: 3, student_id: 'ST003', name: 'Priya Sharma', email: 'priya@example.com', department: 'Computer Science', semester: '4', section: 'A', overallPercentage: 52.0, overallStatus: 'LOW' }
            ]
          }
        });
      }

      if (url.includes('/reports')) {
        return Promise.resolve({
          data: {
            reportType: 'all',
            generatedAt: new Date().toISOString(),
            data: [
              { student_id: 'ST001', student_name: 'Rahul Kumar', department: 'Computer Science', semester: '4', subject_code: 'CS201', subject_name: 'Data Structures', total_classes: 30, attended_classes: 25, missed_classes: 5, attendance_percentage: 83.33, status: 'HIGH' },
              { student_id: 'ST002', student_name: 'Aman Verma', department: 'Computer Science', semester: '4', subject_code: 'CS202', subject_name: 'DBMS', total_classes: 28, attended_classes: 22, missed_classes: 6, attendance_percentage: 78.57, status: 'HIGH' }
            ]
          }
        });
      }

      if (url.includes('/settings')) {
        return Promise.resolve({ data: { settings: { high_threshold: 75, low_threshold: 60, late_weight: 0.5 } } });
      }

      if (url.includes('/attendance')) {
        return Promise.resolve({ data: { attendance: [] } });
      }
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
