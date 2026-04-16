const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public routes
router.post('/login', adminController.login);

// Protected routes
router.post('/change-password', adminController.verifyToken, adminController.changePassword);

module.exports = router;
