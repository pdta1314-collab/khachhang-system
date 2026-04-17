const { Pool } = require('pg');

// Sử dụng DATABASE_URL từ Railway hoặc local fallback
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/khachhang';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

// Retry logic cho database connection
let isInitialized = false;
let initRetries = 0;
const MAX_RETRIES = 5;

async function initializeDatabase() {
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
    if (initRetries < MAX_RETRIES) {
      initRetries++;
      console.log(`Retry ${initRetries}/${MAX_RETRIES} trong 5 giây...`);
      setTimeout(initializeDatabase, 5000);
    } else {
      console.error('Không thể khởi tạo database sau nhiều lần thử');
    }
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
    if (!isInitialized) {
      initializeDatabase();
    }
  } catch (err) {
    console.error('Lỗi kết nối database:', err.message);
    if (initRetries < MAX_RETRIES) {
      initRetries++;
      console.log(`Retry ${initRetries}/${MAX_RETRIES} trong 5 giây...`);
      setTimeout(testConnection, 5000);
    } else {
      console.error('Không thể kết nối database sau nhiều lần thử');
    }
  }
}

pool.on('error', (err) => {
  console.error('Lỗi kết nối database:', err.message);
});

// Bắt đầu test connection
testConnection();

module.exports = pool;
