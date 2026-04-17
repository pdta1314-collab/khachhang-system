const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi kết nối database:', err.message);
  } else {
    console.log('Đã kết nối thành công đến SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Tạo bảng customers
    db.run(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      outfit TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      video_path TEXT,
      unique_id TEXT UNIQUE NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Lỗi tạo bảng customers:', err.message);
      } else {
        console.log('Bảng customers đã sẵn sàng');
      }
    });

    // Tạo bảng customer_images để lưu nhiều ảnh cho mỗi khách hàng
    db.run(`CREATE TABLE IF NOT EXISTS customer_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('Lỗi tạo bảng customer_images:', err.message);
      } else {
        console.log('Bảng customer_images đã sẵn sàng');
      }
    });

    // Tạo bảng admin users
    db.run(`CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Lỗi tạo bảng admin_users:', err.message);
      } else {
        console.log('Bảng admin_users đã sẵn sàng');
        // Tạo admin mặc định nếu chưa có
        createDefaultAdmin();
      }
    });
  });
}

function createDefaultAdmin() {
  const bcrypt = require('bcryptjs');
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(`INSERT OR IGNORE INTO admin_users (username, password) VALUES (?, ?)`, 
    ['admin', defaultPassword], 
    (err) => {
      if (err) {
        console.error('Lỗi tạo admin mặc định:', err.message);
      } else {
        console.log('Admin mặc định đã sẵn sàng (username: admin, password: admin123)');
      }
    }
  );
}

module.exports = db;
