const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/request-password-reset', authController.requestPasswordReset);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authMiddleware.requireAuth, authController.me);
router.put('/auth/me', authMiddleware.requireAuth, authController.updateMe);

module.exports = router;
