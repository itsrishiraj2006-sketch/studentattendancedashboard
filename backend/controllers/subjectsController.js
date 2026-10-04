const db = require('../config/db');

// GET /api/subjects
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await db.query('SELECT * FROM `subjects` ORDER BY `id` ASC');
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Server error fetching subjects.' });
  }
};

// POST /api/subjects
exports.createSubject = async (req, res) => {
  try {
    const { subject_code, subject_name, faculty_name } = req.body;
    if (!subject_code || !subject_name || !faculty_name) {
      return res.status(400).json({ success: false, message: 'All subject fields are required.' });
    }

    const result = await db.query(
      'INSERT INTO `subjects` (`subject_code`, `subject_name`, `faculty_name`) VALUES (?, ?, ?)',
      [subject_code, subject_name, faculty_name]
    );

    res.status(201).json({ success: true, message: 'Subject created successfully!', subjectId: result.insertId });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ success: false, message: 'Server error creating subject.' });
  }
};
