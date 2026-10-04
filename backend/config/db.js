const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let pool = null;
let useFallback = false;

// In-Memory Fallback Dataset for instant zero-config startup if MySQL server is not reachable
let fallbackStudents = [
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

let fallbackSubjects = [
  { id: 1, subject_code: 'CS201', subject_name: 'Data Structures & Algorithms', faculty_name: 'Dr. Rajesh Sharma' },
  { id: 2, subject_code: 'CS202', subject_name: 'Database Management Systems', faculty_name: 'Prof. Anita Verma' },
  { id: 3, subject_code: 'CS203', subject_name: 'Java Programming', faculty_name: 'Dr. Vikramaditya Rao' },
  { id: 4, subject_code: 'CS204', subject_name: 'Computer Architecture', faculty_name: 'Prof. Meenakshi Sundaram' },
  { id: 5, subject_code: 'CS205', subject_name: 'Mathematics III', faculty_name: 'Dr. Sanjay Kulkarni' }
];

// Generate synthetic historical attendance records for fallback mode
let fallbackAttendance = [];
let attendanceIdCounter = 1;
const dates = [
  '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
  '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12',
  '2026-08-15', '2026-08-16', '2026-08-18', '2026-08-19', '2026-08-22',
  '2026-08-23', '2026-08-25', '2026-08-26', '2026-08-29', '2026-08-30',
  '2026-09-01'
];

fallbackStudents.forEach((student) => {
  fallbackSubjects.forEach((subject) => {
    dates.forEach((date, dateIdx) => {
      // Create distinct attendance patterns per student
      let isPresent = true;
      if ([3, 8, 14, 18].includes(student.id)) {
        // Low attendance students (<75%)
        isPresent = (dateIdx + student.id + subject.id) % 3 === 0;
      } else if ([1, 7, 12, 19].includes(student.id)) {
        // High attendance students (>95%)
        isPresent = (dateIdx + student.id + subject.id) % 15 !== 0;
      } else {
        // Average attendance (~85%)
        isPresent = (dateIdx + student.id + subject.id) % 6 !== 0;
      }

      fallbackAttendance.push({
        id: attendanceIdCounter++,
        student_id: student.id,
        subject_id: subject.id,
        attendance_date: date,
        status: isPresent ? 'Present' : 'Absent',
        created_at: new Date().toISOString()
      });
    });
  });
});

async function initDb() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'student_attendance_db',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test MySQL connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database successfully.');
    connection.release();
  } catch (err) {
    console.warn('⚠️  MySQL Connection Failed:', err.message);
    console.warn('🔄 Falling back to built-in dataset mode so backend & D3 dashboard remain 100% functional!');
    useFallback = true;
  }
}

initDb();

async function query(sql, params = []) {
  if (!useFallback && pool) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('MySQL Query Error:', err.message);
      throw err;
    }
  }

  // Fallback Mock Query Engine for SQLite/In-memory compatibility
  return handleFallbackQuery(sql, params);
}

function handleFallbackQuery(sql, params) {
  const normalizedSql = sql.replace(/`/g, '').trim().toLowerCase();

  // SELECT STUDENTS
  if (normalizedSql.includes('from students')) {
    let result = [...fallbackStudents];

    // Filter by roll_no
    if (normalizedSql.includes('roll_no =')) {
      const rollVal = params[0];
      if (rollVal) {
        return fallbackStudents.filter(s => s.roll_no.toLowerCase() === rollVal.toString().toLowerCase());
      }
    }
    // Filter by id
    if (normalizedSql.includes('id =')) {
      const idVal = params[0];
      if (idVal) {
        return fallbackStudents.filter(s => s.id == idVal);
      }
    }
    // Filter by class
    if (normalizedSql.includes('class =')) {
      const classVal = params[0];
      if (classVal) result = result.filter(s => s.class === classVal);
    }
    // Filter by search
    if (normalizedSql.includes('name like') || normalizedSql.includes('roll_no like')) {
      const searchTerm = params[params.length - 1]?.toString().replace(/%/g, '').toLowerCase();
      if (searchTerm) {
        result = result.filter(s => s.name.toLowerCase().includes(searchTerm) || s.roll_no.toLowerCase().includes(searchTerm));
      }
    }
    return result;
  }

  // SELECT SUBJECTS
  if (normalizedSql.includes('from `subjects`') || normalizedSql.includes('from subjects')) {
    return [...fallbackSubjects];
  }

  // SELECT ATTENDANCE / DASHBOARD STATS
  if (normalizedSql.includes('from `attendance`') || normalizedSql.includes('from attendance')) {
    let result = [...fallbackAttendance];
    return result;
  }

  // INSERT STUDENT
  if (normalizedSql.startsWith('insert into `students`') || normalizedSql.startsWith('insert into students')) {
    const newId = fallbackStudents.length ? Math.max(...fallbackStudents.map(s => s.id)) + 1 : 1;
    const newStudent = {
      id: newId,
      roll_no: params[0],
      name: params[1],
      email: params[2],
      class: params[3],
      division: params[4],
      department: params[5] || 'Computer Science'
    };
    fallbackStudents.push(newStudent);
    return { insertId: newId, affectedRows: 1 };
  }

  // UPDATE STUDENT
  if (normalizedSql.startsWith('update `students`') || normalizedSql.startsWith('update students')) {
    const id = params[params.length - 1];
    const idx = fallbackStudents.findIndex(s => s.id == id);
    if (idx !== -1) {
      fallbackStudents[idx] = {
        ...fallbackStudents[idx],
        roll_no: params[0],
        name: params[1],
        email: params[2],
        class: params[3],
        division: params[4],
        department: params[5]
      };
    }
    return { affectedRows: 1 };
  }

  // DELETE STUDENT
  if (normalizedSql.startsWith('delete from `students`') || normalizedSql.startsWith('delete from students')) {
    const id = params[0];
    fallbackStudents = fallbackStudents.filter(s => s.id != id);
    fallbackAttendance = fallbackAttendance.filter(a => a.student_id != id);
    return { affectedRows: 1 };
  }

  // INSERT/REPLACE ATTENDANCE
  if (normalizedSql.startsWith('insert into `attendance`') || normalizedSql.startsWith('insert into attendance')) {
    const [student_id, subject_id, attendance_date, status] = params;
    const existingIdx = fallbackAttendance.findIndex(
      a => a.student_id == student_id && a.subject_id == subject_id && a.attendance_date == attendance_date
    );

    if (existingIdx !== -1) {
      fallbackAttendance[existingIdx].status = status;
    } else {
      fallbackAttendance.push({
        id: attendanceIdCounter++,
        student_id: Number(student_id),
        subject_id: Number(subject_id),
        attendance_date,
        status,
        created_at: new Date().toISOString()
      });
    }
    return { affectedRows: 1 };
  }

  return [];
}

module.exports = {
  query,
  getFallbackData: () => ({ fallbackStudents, fallbackSubjects, fallbackAttendance })
};
