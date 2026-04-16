const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Tự động xác định BASE_URL (Railway cung cấp RAILWAY_PUBLIC_DOMAIN)
const RAILWAY_URL = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null;
const BASE_URL = process.env.BASE_URL || RAILWAY_URL || `http://localhost:${PORT}`;

// Cập nhật BASE_URL vào process.env để các module khác sử dụng
process.env.BASE_URL = BASE_URL;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files cho uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// Import routes
const customerRoutes = require('./routes/customers');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);

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

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
  console.log(`URL: ${BASE_URL}`);
  if (RAILWAY_URL) {
    console.log('✅ Phát hiện Railway deployment - URL cố định');
  }
});
