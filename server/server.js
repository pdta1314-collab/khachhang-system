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

// Middleware - CORS cho phép tất cả origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');

// Route cho video streaming - xử lý tất cả path trong uploads/ (đặt TRƯỚC static middleware)
// Dùng regex cho Express 5.x
app.get(/^\/uploads\/(.+)$/, (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.params[0]);
  
  // Chỉ xử lý nếu là file video
  const ext = path.extname(filePath).toLowerCase();
  const videoExts = ['.mp4', '.webm', '.mov', '.mkv', '.avi'];
  
  if (videoExts.includes(ext)) {
    // Kiểm tra file tồn tại
    if (!fs.existsSync(filePath)) {
      console.error('Video file not found:', filePath);
      return res.status(404).json({ error: 'Video không tồn tại: ' + req.params[0] });
    }
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Xác định content type
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo'
    };
    const contentType = mimeTypes[ext] || 'video/mp4';
    
    console.log('Serving video:', filePath, 'Size:', fileSize, 'Type:', contentType);
    
    if (range) {
      // Streaming với range request
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Gửi toàn bộ file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      };
      
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } else {
    // Không phải video, chuyển sang static middleware
    next();
  }
});

// Static files cho uploads (đặt SAU video route)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`RAILWAY_PUBLIC_DOMAIN: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'không có'}`);
  if (RAILWAY_URL) {
    console.log('✅ Phát hiện Railway deployment - URL cố định');
  }
});
