const express = require('express');
const router = express.Router();
const { getReportData } = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/', requireRole('TEACHER', 'ADMIN'), getReportData);

module.exports = router;
