const { Pool } = require('pg');

// Sử dụng DATABASE_URL từ Railway hoặc local fallback
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/khachhang';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

let isInitialized = false;

async function initializeDatabase() {
  if (isInitialized) return;
  
  try {
    // Tạo bảng customers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        outfit TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        video_path TEXT,
        unique_id TEXT UNIQUE NOT NULL
      )
    `);
    console.log('Bảng customers đã sẵn sàng');

    // Tạo bảng customer_images
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_images (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('Bảng customer_images đã sẵn sàng');

    // Tạo bảng admin_users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Bảng admin_users đã sẵn sàng');

    // Tạo admin mặc định nếu chưa có
    await createDefaultAdmin();
    isInitialized = true;
  } catch (err) {
    console.error('Lỗi khởi tạo database:', err.message);
  }
}

async function createDefaultAdmin() {
  try {
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    
    await pool.query(
      'INSERT INTO admin_users (username, password) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = $1)',
      ['admin', defaultPassword]
    );
    console.log('Admin mặc định đã sẵn sàng (username: admin, password: admin123)');
  } catch (err) {
    console.error('Lỗi tạo admin mặc định:', err.message);
  }
}

// Lazy initialization - chỉ khởi tạo khi có query đầu tiên
pool.on('connect', () => {
  console.log('Đã kết nối đến PostgreSQL database');
  if (!isInitialized) {
    initializeDatabase();
  }
});

pool.on('error', (err) => {
  console.error('Lỗi kết nối database:', err.message);
});

// Không kết nối ngay khi server start - lazy connection
// Database sẽ được khởi tạo khi có query đầu tiên

module.exports = pool;
