const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', verifyToken, me);
router.post('/logout', (req, res) => res.json({ message: 'Logged out successfully.' }));

module.exports = router;
