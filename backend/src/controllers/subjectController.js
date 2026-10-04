const db = require('../config/db');

async function getAllSubjects(req, res) {
  try {
    const { department, semester, search } = req.query;
    const { rows: subjects } = await db.query('SELECT * FROM subjects');
    const { rows: attendance } = await db.query('SELECT * FROM attendance');

    let list = subjects.map(sub => {
      const subAttendance = attendance.filter(a => a.subject_id === sub.id);
      const totalClasses = subAttendance.length;
      const attended = subAttendance.filter(a => a.status === 'PRESENT').length;
      const missed = subAttendance.filter(a => a.status === 'ABSENT').length;
      const late = subAttendance.filter(a => a.status === 'LATE').length;
      
      const percentage = totalClasses > 0 ? Math.round(((attended + late * 0.5) / totalClasses) * 100 * 100) / 100 : 0;

      return {
        ...sub,
        totalClasses,
        attended,
        missed,
        late,
        percentage
      };
    });

    if (department) {
      list = list.filter(s => s.department.toLowerCase() === department.toLowerCase());
    }
    if (semester) {
      list = list.filter(s => String(s.semester) === String(semester));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }

    return res.json({ subjects: list });
  } catch (err) {
    console.error('Get Subjects Error:', err);
    return res.status(500).json({ message: 'Error fetching subjects.' });
  }
}

async function getSubjectById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await db.query('SELECT * FROM subjects WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    return res.json({ subject: rows[0] });
  } catch (err) {
    console.error('Get Subject Error:', err);
    return res.status(500).json({ message: 'Error fetching subject.' });
  }
}

async function createSubject(req, res) {
  try {
    const { name, code, faculty_name, faculty_id, department, semester, credits } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Subject name and code are required.' });
    }

    // Check duplicate code
    const { rows: existing } = await db.query('SELECT * FROM subjects WHERE code = $1', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ message: `Subject code "${code}" already exists.` });
    }

    const { rows } = await db.query(
      'INSERT INTO subjects (name, code, faculty_id, faculty_name, department, semester, credits) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, code, faculty_id || null, faculty_name || 'Faculty Member', department || 'Computer Science', semester || '4', parseInt(credits || '3', 10)]
    );

    return res.status(201).json({
      message: 'Subject added successfully.',
      subject: rows[0]
    });
  } catch (err) {
    console.error('Create Subject Error:', err);
    return res.status(500).json({ message: 'Failed to create subject.' });
  }
}

async function updateSubject(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, code, faculty_name, department, semester, credits } = req.body;

    const { rows: existing } = await db.query('SELECT * FROM subjects WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    const current = existing[0];

    const { rows } = await db.query(
      'UPDATE subjects SET name = $1, code = $2, faculty_name = $3, department = $4, semester = $5, credits = $6 WHERE id = $7 RETURNING *',
      [
        name || current.name,
        code || current.code,
        faculty_name || current.faculty_name,
        department || current.department,
        semester || current.semester,
        credits !== undefined ? parseInt(credits, 10) : current.credits,
        id
      ]
    );

    return res.json({
      message: 'Subject updated successfully.',
      subject: rows[0]
    });
  } catch (err) {
    console.error('Update Subject Error:', err);
    return res.status(500).json({ message: 'Failed to update subject.' });
  }
}

async function deleteSubject(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query('DELETE FROM subjects WHERE id = $1', [id]);
    return res.json({ message: 'Subject deleted successfully.' });
  } catch (err) {
    console.error('Delete Subject Error:', err);
    return res.status(500).json({ message: 'Failed to delete subject.' });
  }
}

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
