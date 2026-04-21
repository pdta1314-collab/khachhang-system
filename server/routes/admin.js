const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const pool = require('../config/database');

// Public routes
router.post('/login', adminController.login);

// Protected routes
router.post('/change-password', adminController.verifyToken, adminController.changePassword);

// TEMPORARY: Reset admin password with secret key (REMOVE AFTER USE)
router.post('/reset-password', async (req, res) => {
  const { secret, newPassword } = req.body;
  
  // Secret key bảo vệ - thay đổi thành secret của bạn
  const SECRET_KEY = 'lumi_secret_key_2024';
  
  if (secret !== SECRET_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid secret key' });
  }
  
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    const result = await pool.query(
      'UPDATE admin_users SET password = $1 WHERE username = $2 RETURNING *',
      [hashedPassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      res.json({ 
        success: true, 
        message: 'Password updated successfully',
        username: result.rows[0].username 
      });
    } else {
      res.status(404).json({ error: 'Admin user not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
