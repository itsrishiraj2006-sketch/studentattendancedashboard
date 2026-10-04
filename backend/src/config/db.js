const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const env = process.env;
let usePostgres = false;
let pool = null;

// Persistent JSON fallback DB file
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbFilePath = path.join(dataDir, 'attendance_db.json');

// Initial schema structure for JSON store
const defaultData = {
  users: [],
  students: [],
  teachers: [],
  subjects: [],
  attendance: [],
  settings: [
    { key: 'high_threshold', value: '75' },
    { key: 'low_threshold', value: '60' },
    { key: 'late_weight', value: '0.5' }
  ]
};

function loadJsonDb() {
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(dbFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return defaultData;
  }
}

function saveJsonDb(data) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
}

// Check PostgreSQL connection
if (env.PGHOST || env.DATABASE_URL || env.PGUSER) {
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    host: env.PGHOST || 'localhost',
    user: env.PGUSER || 'postgres',
    password: env.PGPASSWORD || 'postgres',
    database: env.PGDATABASE || 'attendance_db',
    port: parseInt(env.PGPORT || '5432', 10),
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 3000
  });
}

// Primary db export object
const db = {
  isPostgres: false,
  async init() {
    if (pool) {
      try {
        const client = await pool.connect();
        client.release();
        usePostgres = true;
        this.isPostgres = true;
        console.log('Connected to PostgreSQL Database.');
        await this.createPgTables();
        return;
      } catch (err) {
        console.warn('PostgreSQL connection failed or not running. Falling back to local file DB.', err.message);
        usePostgres = false;
        this.isPostgres = false;
      }
    } else {
      console.log('Using local embedded file DB (PostgreSQL config not set).');
      usePostgres = false;
      this.isPostgres = false;
    }
    loadJsonDb();
  },

  async createPgTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'TEACHER', 'ADMIN')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        student_id VARCHAR(50) UNIQUE NOT NULL,
        department VARCHAR(100) NOT NULL,
        semester VARCHAR(20) NOT NULL,
        section VARCHAR(20) DEFAULT 'A',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        department VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        faculty_id INT REFERENCES users(id) ON DELETE SET NULL,
        faculty_name VARCHAR(150),
        department VARCHAR(100) NOT NULL,
        semester VARCHAR(20) NOT NULL,
        credits INT DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, subject_id, date)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `;
    await pool.query(schema);

    await pool.query(`
      INSERT INTO settings (key, value) VALUES 
        ('high_threshold', '75'),
        ('low_threshold', '60'),
        ('late_weight', '0.5')
      ON CONFLICT (key) DO NOTHING;
    `);
  },

  async query(text, params = []) {
    if (usePostgres && pool) {
      try {
        const res = await pool.query(text, params);
        return { rows: res.rows, rowCount: res.rowCount };
      } catch (err) {
        console.error('Postgres Query Error:', err);
        throw err;
      }
    }

    const data = loadJsonDb();
    const cleanText = text.trim().replace(/\s+/g, ' ');
    const lower = cleanText.toLowerCase();

    // SELECT query handler
    if (lower.startsWith('select')) {
      if (lower.includes('from users')) {
        let rows = [...data.users];
        if (lower.includes('where email =')) {
          const targetEmail = params[0] || (cleanText.match(/email\s*=\s*'([^']+)'/i)?.[1]);
          if (targetEmail) rows = rows.filter(u => u.email.toLowerCase() === targetEmail.toLowerCase());
        } else if (lower.includes('where id =')) {
          const targetId = params[0] || (cleanText.match(/id\s*=\s*(\d+)/i)?.[1]);
          if (targetId) rows = rows.filter(u => u.id === parseInt(targetId, 10));
        } else if (lower.includes('where role =') || lower.includes('where role in')) {
          if (lower.includes('teacher') && lower.includes('admin')) {
            rows = rows.filter(u => u.role === 'TEACHER' || u.role === 'ADMIN');
          } else if (lower.includes('student')) {
            rows = rows.filter(u => u.role === 'STUDENT');
          } else if (params[0]) {
            rows = rows.filter(u => u.role === params[0]);
          }
        }
        return { rows, rowCount: rows.length };
      }

      if (lower.includes('from students')) {
        let rows = data.students.map(s => {
          const u = data.users.find(usr => usr.id === s.user_id) || {};
          return {
            ...s,
            name: u.name || '',
            email: u.email || '',
            role: u.role || 'STUDENT'
          };
        });

        if (lower.includes('where id =') || lower.includes('where s.id =')) {
          const targetId = params[0] || (cleanText.match(/id\s*=\s*(\d+)/i)?.[1]);
          if (targetId) rows = rows.filter(s => s.id === parseInt(targetId, 10));
        } else if (lower.includes('where user_id =') || lower.includes('where s.user_id =')) {
          const targetUserId = params[0] || (cleanText.match(/user_id\s*=\s*(\d+)/i)?.[1]);
          if (targetUserId) rows = rows.filter(s => s.user_id === parseInt(targetUserId, 10));
        } else if (lower.includes('where student_id =') || lower.includes('where s.student_id =')) {
          const targetCode = params[0] || (cleanText.match(/student_id\s*=\s*'([^']+)'/i)?.[1]);
          if (targetCode) rows = rows.filter(s => s.student_id === targetCode);
        }

        return { rows, rowCount: rows.length };
      }

      if (lower.includes('from subjects')) {
        let rows = [...data.subjects];
        if (lower.includes('where id =')) {
          const targetId = params[0] || (cleanText.match(/id\s*=\s*(\d+)/i)?.[1]);
          if (targetId) rows = rows.filter(s => s.id === parseInt(targetId, 10));
        } else if (lower.includes('where code =')) {
          const targetCode = params[0] || (cleanText.match(/code\s*=\s*'([^']+)'/i)?.[1]);
          if (targetCode) rows = rows.filter(s => s.code.toLowerCase() === targetCode.toLowerCase());
        } else if (lower.includes('where semester =')) {
          rows = rows.filter(s => String(s.semester) === String(params[0]));
        }
        return { rows, rowCount: rows.length };
      }

      if (lower.includes('from attendance')) {
        let rows = data.attendance.map(a => {
          const st = data.students.find(s => s.id === a.student_id) || {};
          const u = data.users.find(usr => usr.id === st.user_id) || {};
          const sub = data.subjects.find(s => s.id === a.subject_id) || {};
          return {
            ...a,
            student_name: u.name || '',
            student_code_id: st.student_id || '',
            department: st.department || '',
            semester: st.semester || '',
            subject_name: sub.name || '',
            subject_code: sub.code || ''
          };
        });

        if (params.length > 0) {
          if (lower.includes('student_id =') && lower.includes('subject_id =') && lower.includes('date =')) {
            rows = rows.filter(a => a.student_id === parseInt(params[0], 10) && a.subject_id === parseInt(params[1], 10) && a.date === params[2]);
          } else if (lower.includes('student_id =') && lower.includes('subject_id =')) {
            rows = rows.filter(a => a.student_id === parseInt(params[0], 10) && a.subject_id === parseInt(params[1], 10));
          } else if (lower.includes('student_id =')) {
            rows = rows.filter(a => a.student_id === parseInt(params[0], 10));
          } else if (lower.includes('subject_id =')) {
            rows = rows.filter(a => a.subject_id === parseInt(params[0], 10));
          } else if (lower.includes('date =')) {
            rows = rows.filter(a => a.date === params[0]);
          }
        }

        return { rows, rowCount: rows.length };
      }

      if (lower.includes('from settings')) {
        let rows = [...data.settings];
        if (lower.includes('where key =')) {
          const targetKey = params[0] || (cleanText.match(/key\s*=\s*'([^']+)'/i)?.[1]);
          if (targetKey) rows = rows.filter(s => s.key === targetKey);
        }
        return { rows, rowCount: rows.length };
      }
    }

    // INSERT query handler
    if (lower.startsWith('insert into users')) {
      const newId = (data.users.reduce((max, u) => Math.max(max, u.id), 0) || 0) + 1;
      const newUser = {
        id: newId,
        name: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3] || 'STUDENT',
        created_at: new Date().toISOString()
      };
      data.users.push(newUser);
      saveJsonDb(data);
      return { rows: [newUser], rowCount: 1 };
    }

    if (lower.startsWith('insert into students')) {
      const newId = (data.students.reduce((max, s) => Math.max(max, s.id), 0) || 0) + 1;
      const newStudent = {
        id: newId,
        user_id: parseInt(params[0], 10),
        student_id: params[1],
        department: params[2],
        semester: params[3],
        section: params[4] || 'A',
        created_at: new Date().toISOString()
      };
      data.students.push(newStudent);
      saveJsonDb(data);
      return { rows: [newStudent], rowCount: 1 };
    }

    if (lower.startsWith('insert into teachers')) {
      const newId = (data.teachers.reduce((max, t) => Math.max(max, t.id), 0) || 0) + 1;
      const newTeacher = {
        id: newId,
        user_id: parseInt(params[0], 10),
        department: params[1],
        created_at: new Date().toISOString()
      };
      data.teachers.push(newTeacher);
      saveJsonDb(data);
      return { rows: [newTeacher], rowCount: 1 };
    }

    if (lower.startsWith('insert into subjects')) {
      const newId = (data.subjects.reduce((max, s) => Math.max(max, s.id), 0) || 0) + 1;
      const newSubject = {
        id: newId,
        name: params[0],
        code: params[1],
        faculty_id: params[2] ? parseInt(params[2], 10) : null,
        faculty_name: params[3] || 'Faculty Member',
        department: params[4] || 'Computer Science',
        semester: params[5] || '4',
        credits: parseInt(params[6] || '3', 10),
        created_at: new Date().toISOString()
      };
      data.subjects.push(newSubject);
      saveJsonDb(data);
      return { rows: [newSubject], rowCount: 1 };
    }

    if (lower.startsWith('insert into attendance') || lower.includes('on conflict')) {
      const studentId = parseInt(params[0], 10);
      const subjectId = parseInt(params[1], 10);
      const date = params[2];
      const status = params[3];

      const idx = data.attendance.findIndex(a => a.student_id === studentId && a.subject_id === subjectId && a.date === date);
      let record;
      if (idx >= 0) {
        data.attendance[idx].status = status;
        data.attendance[idx].updated_at = new Date().toISOString();
        record = data.attendance[idx];
      } else {
        const newId = (data.attendance.reduce((max, a) => Math.max(max, a.id), 0) || 0) + 1;
        record = {
          id: newId,
          student_id: studentId,
          subject_id: subjectId,
          date,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        data.attendance.push(record);
      }
      saveJsonDb(data);
      return { rows: [record], rowCount: 1 };
    }

    if (lower.startsWith('insert into settings') || lower.includes('settings')) {
      const key = params[0];
      const value = String(params[1]);
      const idx = data.settings.findIndex(s => s.key === key);
      if (idx >= 0) {
        data.settings[idx].value = value;
      } else {
        data.settings.push({ key, value });
      }
      saveJsonDb(data);
      return { rows: [{ key, value }], rowCount: 1 };
    }

    // UPDATE query handler
    if (lower.startsWith('update users')) {
      const id = parseInt(params[params.length - 1], 10);
      const u = data.users.find(usr => usr.id === id);
      if (u) {
        if (params.length >= 3) {
          u.name = params[0];
          u.email = params[1];
        }
        saveJsonDb(data);
        return { rows: [u], rowCount: 1 };
      }
    }

    if (lower.startsWith('update students')) {
      const id = parseInt(params[params.length - 1], 10);
      const st = data.students.find(s => s.id === id);
      if (st) {
        st.student_id = params[0];
        st.department = params[1];
        st.semester = params[2];
        st.section = params[3] || st.section;
        saveJsonDb(data);
        return { rows: [st], rowCount: 1 };
      }
    }

    if (lower.startsWith('update subjects')) {
      const id = parseInt(params[params.length - 1], 10);
      const sub = data.subjects.find(s => s.id === id);
      if (sub) {
        sub.name = params[0];
        sub.code = params[1];
        sub.faculty_name = params[2];
        sub.department = params[3];
        sub.semester = params[4];
        sub.credits = parseInt(params[5] || '3', 10);
        saveJsonDb(data);
        return { rows: [sub], rowCount: 1 };
      }
    }

    if (lower.startsWith('update attendance')) {
      const id = parseInt(params[params.length - 1], 10);
      const att = data.attendance.find(a => a.id === id);
      if (att) {
        att.status = params[0];
        att.updated_at = new Date().toISOString();
        saveJsonDb(data);
        return { rows: [att], rowCount: 1 };
      }
    }

    // DELETE query handler
    if (lower.startsWith('delete from students')) {
      const id = parseInt(params[0], 10);
      const stIdx = data.students.findIndex(s => s.id === id);
      if (stIdx >= 0) {
        const userId = data.students[stIdx].user_id;
        data.students.splice(stIdx, 1);
        data.users = data.users.filter(u => u.id !== userId);
        data.attendance = data.attendance.filter(a => a.student_id !== id);
        saveJsonDb(data);
        return { rowCount: 1 };
      }
    }

    if (lower.startsWith('delete from subjects')) {
      const id = parseInt(params[0], 10);
      const subIdx = data.subjects.findIndex(s => s.id === id);
      if (subIdx >= 0) {
        data.subjects.splice(subIdx, 1);
        data.attendance = data.attendance.filter(a => a.subject_id !== id);
        saveJsonDb(data);
        return { rowCount: 1 };
      }
    }

    if (lower.startsWith('delete from attendance')) {
      const id = parseInt(params[0], 10);
      data.attendance = data.attendance.filter(a => a.id !== id);
      saveJsonDb(data);
      return { rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  }
};

module.exports = db;
