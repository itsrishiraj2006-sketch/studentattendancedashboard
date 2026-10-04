const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('Starting seed process...');
  await db.init();

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Users
  const userSeeds = [
    { name: 'Dr. Ramesh Kumar', email: 'teacher@example.com', role: 'TEACHER' },
    { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' },
    { name: 'Rahul Kumar', email: 'student@example.com', role: 'STUDENT' }, // ST001
    { name: 'Aman Verma', email: 'aman@example.com', role: 'STUDENT' }, // ST002
    { name: 'Priya Sharma', email: 'priya@example.com', role: 'STUDENT' }, // ST003
    { name: 'Sneha Patel', email: 'sneha@example.com', role: 'STUDENT' }, // ST004
    { name: 'Vikram Singh', email: 'vikram@example.com', role: 'STUDENT' }, // ST005
    { name: 'Ananya Roy', email: 'ananya@example.com', role: 'STUDENT' }, // ST006
    { name: 'Devraj Gupta', email: 'devraj@example.com', role: 'STUDENT' }, // ST007
    { name: 'Meera Nair', email: 'meera@example.com', role: 'STUDENT' }, // ST008
    { name: 'Rohan Mehta', email: 'rohan@example.com', role: 'STUDENT' }, // ST009
    { name: 'Tanvi Joshi', email: 'tanvi@example.com', role: 'STUDENT' } // ST010
  ];

  for (const u of userSeeds) {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [u.email]);
    if (rows.length === 0) {
      await db.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)', [
        u.name,
        u.email,
        defaultPasswordHash,
        u.role
      ]);
    }
  }

  // 2. Seed Teachers
  const { rows: teacherUsers } = await db.query('SELECT * FROM users WHERE role IN (\'TEACHER\', \'ADMIN\')');
  for (const tu of teacherUsers) {
    const { rows } = await db.query('SELECT * FROM teachers WHERE user_id = $1', [tu.id]);
    if (rows.length === 0) {
      await db.query('INSERT INTO teachers (user_id, department) VALUES ($1, $2)', [tu.id, 'Computer Science']);
    }
  }

  // 3. Seed Students
  const { rows: studentUsers } = await db.query('SELECT * FROM users WHERE role = \'STUDENT\'');
  const studentMeta = [
    { code: 'ST001', dept: 'Computer Science', sem: '4', sec: 'A' },
    { code: 'ST002', dept: 'Computer Science', sem: '4', sec: 'A' },
    { code: 'ST003', dept: 'Computer Science', sem: '4', sec: 'A' },
    { code: 'ST004', dept: 'Computer Science', sem: '4', sec: 'B' },
    { code: 'ST005', dept: 'Information Tech', sem: '4', sec: 'A' },
    { code: 'ST006', dept: 'Information Tech', sem: '4', sec: 'B' },
    { code: 'ST007', dept: 'Computer Science', sem: '6', sec: 'A' },
    { code: 'ST008', dept: 'Computer Science', sem: '6', sec: 'A' },
    { code: 'ST009', dept: 'Cyber Security', sem: '4', sec: 'A' },
    { code: 'ST010', dept: 'Cyber Security', sem: '4', sec: 'A' }
  ];

  for (let i = 0; i < studentUsers.length; i++) {
    const su = studentUsers[i];
    const meta = studentMeta[i] || { code: `ST${100 + i}`, dept: 'Computer Science', sem: '4', sec: 'A' };
    const { rows } = await db.query('SELECT * FROM students WHERE user_id = $1', [su.id]);
    if (rows.length === 0) {
      await db.query('INSERT INTO students (user_id, student_id, department, semester, section) VALUES ($1, $2, $3, $4, $5)', [
        su.id,
        meta.code,
        meta.dept,
        meta.sem,
        meta.sec
      ]);
    }
  }

  // 4. Seed 5 Initial Core Subjects
  const subjectSeeds = [
    { name: 'Data Structures', code: 'CS201', faculty: 'Dr. Ramesh Kumar', dept: 'Computer Science', sem: '4', credits: 4 },
    { name: 'Database Management Systems', code: 'CS202', faculty: 'Prof. Sunita Sharma', dept: 'Computer Science', sem: '4', credits: 4 },
    { name: 'Computer Networks', code: 'CS203', faculty: 'Dr. Amit Verma', dept: 'Computer Science', sem: '4', credits: 3 },
    { name: 'Operating Systems', code: 'CS204', faculty: 'Prof. Rajesh Gupta', dept: 'Computer Science', sem: '4', credits: 4 },
    { name: 'Artificial Intelligence', code: 'CS205', faculty: 'Dr. Neha Kapoor', dept: 'Computer Science', sem: '4', credits: 3 }
  ];

  const teacherUser = teacherUsers[0];

  for (const s of subjectSeeds) {
    const { rows } = await db.query('SELECT * FROM subjects WHERE code = $1', [s.code]);
    if (rows.length === 0) {
      await db.query('INSERT INTO subjects (name, code, faculty_id, faculty_name, department, semester, credits) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
        s.name,
        s.code,
        teacherUser ? teacherUser.id : null,
        s.faculty,
        s.dept,
        s.sem,
        s.credits
      ]);
    }
  }

  // 5. Seed Realistic Attendance Records over multiple dates
  const { rows: allStudents } = await db.query('SELECT * FROM students');
  const { rows: allSubjects } = await db.query('SELECT * FROM subjects');

  const dates = [
    '2026-09-01', '2026-09-03', '2026-09-05', '2026-09-08', '2026-09-10',
    '2026-09-12', '2026-09-15', '2026-09-18', '2026-09-20', '2026-09-22',
    '2026-09-25', '2026-09-28', '2026-10-01', '2026-10-02'
  ];

  for (const st of allStudents) {
    for (const sub of allSubjects) {
      // Create varied attendance ratios for demo (High, Average, Low)
      let presentProb = 0.85; // Default high
      if (st.student_id === 'ST002') presentProb = 0.68; // Average attendance student (~68%)
      if (st.student_id === 'ST003') presentProb = 0.52; // Low attendance student (~52%)
      if (sub.code === 'CS203' && st.student_id === 'ST001') presentProb = 0.65; // High in others, lower in Computer Networks

      for (let idx = 0; idx < dates.length; idx++) {
        const d = dates[idx];
        const { rows: attRows } = await db.query(
          'SELECT * FROM attendance WHERE student_id = $1 AND subject_id = $2 AND date = $3',
          [st.id, sub.id, d]
        );

        if (attRows.length === 0) {
          // Deterministic seed pattern based on student id, subject id, and date index
          const hashVal = (st.id * 7 + sub.id * 13 + idx * 17) % 100;
          let status = 'PRESENT';
          if (hashVal > presentProb * 100) {
            status = (hashVal % 5 === 0) ? 'LATE' : 'ABSENT';
          }

          await db.query(
            'INSERT INTO attendance (student_id, subject_id, date, status) VALUES ($1, $2, $3, $4)',
            [st.id, sub.id, d, status]
          );
        }
      }
    }
  }

  console.log('Seed completed successfully!');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}

module.exports = seed;
