const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getClassAnalytics, getLowAttendanceAlerts } = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/student/:id', getStudentAnalytics);
router.get('/class', requireRole('TEACHER', 'ADMIN'), getClassAnalytics);
router.get('/alerts', requireRole('TEACHER', 'ADMIN'), getLowAttendanceAlerts);

module.exports = router;
