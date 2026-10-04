const express = require('express');
const router = express.Router();
const { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.post('/', requireRole('TEACHER', 'ADMIN'), createSubject);
router.put('/:id', requireRole('TEACHER', 'ADMIN'), updateSubject);
router.delete('/:id', requireRole('TEACHER', 'ADMIN'), deleteSubject);

module.exports = router;
