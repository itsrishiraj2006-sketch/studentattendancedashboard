const express = require('express');
const router = express.Router();
const { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.post('/', requireRole('TEACHER', 'ADMIN'), createStudent);
router.put('/:id', requireRole('TEACHER', 'ADMIN'), updateStudent);
router.delete('/:id', requireRole('TEACHER', 'ADMIN'), deleteStudent);

module.exports = router;
