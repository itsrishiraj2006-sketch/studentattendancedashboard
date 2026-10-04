const express = require('express');
const router = express.Router();
const { getAttendance, markBatchAttendance, updateAttendance, deleteAttendance } = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAttendance);
router.post('/', requireRole('TEACHER', 'ADMIN'), markBatchAttendance);
router.put('/:id', requireRole('TEACHER', 'ADMIN'), updateAttendance);
router.delete('/:id', requireRole('TEACHER', 'ADMIN'), deleteAttendance);

module.exports = router;
