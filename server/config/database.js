const { Pool } = require('pg');

// Sử dụng DATABASE_URL từ Railway hoặc local fallback
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/khachhang';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20
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
        phone TEXT NOT NULL,
        email TEXT,
        status TEXT DEFAULT 'Đang chờ',
        registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        video_path TEXT,
        unique_id TEXT UNIQUE NOT NULL
      )
    `);
    console.log('Bảng customers đã sẵn sàng');

    // Migration: thêm cột mới và sửa constraint nếu bảng cũ tồn tại
    try {
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT`);
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT`);
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Đang chờ'`);
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      
      // Bỏ NOT NULL constraint từ cột outfit (cho phép null vì đã chuyển sang phone/email)
      await pool.query(`ALTER TABLE customers ALTER COLUMN outfit DROP NOT NULL`);
      
      console.log('Migration: Đã thêm cột mới và sửa constraints');
    } catch (err) {
      console.log('Migration info:', err.message);
    }

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
    console.log('Database initialization completed successfully');
  } catch (err) {
    console.error('Lỗi khởi tạo database:', err.message);
    throw err;
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

// Test connection và khởi tạo database
async function testConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Đã kết nối thành công đến PostgreSQL database');
    console.log('DATABASE_URL:', DATABASE_URL ? 'Đã cấu hình' : 'Chưa cấu hình');
    if (!isInitialized) {
      await initializeDatabase();
    }
  } catch (err) {
    console.error('Lỗi kết nối database:', err.message);
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Đã cấu hình' : 'CHƯA CẤU HÌNH - Cần thêm DATABASE_URL trong Railway Variables');
    throw err;
  }
}

pool.on('error', (err) => {
  console.error('Lỗi kết nối database:', err.message);
});

// Bắt đầu test connection
testConnection().catch(err => {
  console.error('Không thể kết nối database:', err.message);
});

module.exports = pool;
