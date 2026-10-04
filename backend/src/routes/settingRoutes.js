const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getSettings);
router.put('/', requireRole('TEACHER', 'ADMIN'), updateSettings);

module.exports = router;
