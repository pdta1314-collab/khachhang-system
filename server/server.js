const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./config/database');

// Migration: Thêm cột notes nếu chưa tồn tại
const runMigrations = async () => {
  try {
    await pool.query(`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);
    console.log('✅ Migration: Đã kiểm tra và thêm cột notes (nếu chưa có)');
  } catch (error) {
    console.log('⚠️ Migration warning:', error.message);
  }
};

const app = express();
const PORT = process.env.PORT || 3000;

// Tự động xác định BASE_URL (Railway cung cấp RAILWAY_PUBLIC_DOMAIN)
const RAILWAY_URL = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null;
const BASE_URL = process.env.BASE_URL || RAILWAY_URL || `http://localhost:${PORT}`;

// Cập nhật BASE_URL vào process.env để các module khác sử dụng
process.env.BASE_URL = BASE_URL;

// Middleware - CORS cho phép tất cả origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files cho uploads với MIME type đúng cho video
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.mp4') {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (ext === '.webm') {
      res.setHeader('Content-Type', 'video/webm');
    } else if (ext === '.mov') {
      res.setHeader('Content-Type', 'video/quicktime');
    }
  }
}));

// Import routes
const customerRoutes = require('./routes/customers');
const adminRoutes = require('./routes/admin');
const projectRoutes = require('./routes/projects');
const googleDriveRoutes = require('./routes/googleDrive');

// Use routes
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/google-drive', googleDriveRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server đang chạy' });
});

// Serve frontend - phục vụ static files trước
app.use(express.static(path.join(__dirname, '../client/build')));

// Fallback cho React Router - phải đặt sau tất cả API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, async () => {
  console.log(`Server đang chạy trên port ${PORT}`);
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`RAILWAY_PUBLIC_DOMAIN: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'không có'}`);
  if (RAILWAY_URL) {
    console.log('✅ Phát hiện Railway deployment - URL cố định');
  }

  // Run migrations on startup
  await runMigrations();
});
