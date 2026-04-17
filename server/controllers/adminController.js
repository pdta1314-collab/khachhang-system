const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'khachhang-secret-key-2024';

// Đăng nhập admin
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập username và password' });
    }

    const sql = 'SELECT * FROM admin_users WHERE username = $1';
    const result = await pool.query(sql, [username]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Username hoặc password không đúng' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Username hoặc password không đúng' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Verify token middleware
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Không có token xác thực' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Thay đổi password admin
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ password cũ và mới' });
    }

    const sql = 'SELECT * FROM admin_users WHERE id = $1';
    const result = await pool.query(sql, [adminId]);
    const admin = result.rows[0];

    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Password cũ không đúng' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = 'UPDATE admin_users SET password = $1 WHERE id = $2';
    
    await pool.query(updateSql, [hashedNewPassword, adminId]);

    res.json({
      success: true,
      message: 'Đổi password thành công'
    });
  } catch (error) {
    console.error('Lỗi đổi password:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
