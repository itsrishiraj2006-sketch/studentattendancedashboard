const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const { rows: users } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Verify role if specified
    if (role && user.role !== role) {
      // Allow ADMIN to login as TEACHER if needed
      if (!(role === 'TEACHER' && user.role === 'ADMIN')) {
        return res.status(403).json({ message: `Account is registered as ${user.role}, not ${role}.` });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Get role-specific details (student_id or teacher_id)
    let studentInfo = null;
    let teacherInfo = null;

    if (user.role === 'STUDENT') {
      const { rows: stRows } = await db.query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      if (stRows.length > 0) {
        studentInfo = stRows[0];
      }
    } else if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      const { rows: tRows } = await db.query('SELECT * FROM teachers WHERE user_id = $1', [user.id]);
      if (tRows.length > 0) {
        teacherInfo = tRows[0];
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        studentId: studentInfo ? studentInfo.id : null,
        studentCode: studentInfo ? studentInfo.student_id : null,
        teacherId: teacherInfo ? teacherInfo.id : null
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentDetails: studentInfo,
        teacherDetails: teacherInfo
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
}

async function me(req, res) {
  try {
    const { rows: users } = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = users[0];

    let studentDetails = null;
    let teacherDetails = null;

    if (user.role === 'STUDENT') {
      const { rows } = await db.query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      if (rows.length > 0) studentDetails = rows[0];
    } else if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      const { rows } = await db.query('SELECT * FROM teachers WHERE user_id = $1', [user.id]);
      if (rows.length > 0) teacherDetails = rows[0];
    }

    return res.json({
      user: {
        ...user,
        studentDetails,
        teacherDetails
      }
    });
  } catch (err) {
    console.error('Me Error:', err);
    return res.status(500).json({ message: 'Server error fetching user profile.' });
  }
}

module.exports = {
  login,
  me
};
