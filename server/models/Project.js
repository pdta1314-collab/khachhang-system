const pool = require('../config/database');

class Project {
  // Lấy tất cả dự án
  static async getAll() {
    const sql = 'SELECT * FROM projects ORDER BY created_at DESC';
    try {
      const result = await pool.query(sql);
      return result.rows;
    } catch (err) {
      throw err;
    }
  }

  // Lấy dự án theo ID
  static async getById(id) {
    const sql = 'SELECT * FROM projects WHERE id = $1';
    try {
      const result = await pool.query(sql, [id]);
      return result.rows[0] || null;
    } catch (err) {
      throw err;
    }
  }

  // Lấy dự án theo folder_id (Google Drive)
  static async getByFolderId(folderId) {
    const sql = 'SELECT * FROM projects WHERE folder_id = $1';
    try {
      const result = await pool.query(sql, [folderId]);
      return result.rows[0] || null;
    } catch (err) {
      throw err;
    }
  }

  // Tạo dự án mới
  static async create({ name, folder_id, folder_path, date_folder_name }) {
    const sql = `
      INSERT INTO projects (name, folder_id, folder_path, date_folder_name, created_at) 
      VALUES ($1, $2, $3, $4, NOW()) 
      RETURNING *
    `;
    try {
      const result = await pool.query(sql, [name, folder_id, folder_path, date_folder_name]);
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  // Xóa dự án
  static async delete(id) {
    const sql = 'DELETE FROM projects WHERE id = $1';
    try {
      await pool.query(sql, [id]);
      return { changes: 1 };
    } catch (err) {
      throw err;
    }
  }

  // Kiểm tra xem bảng projects có tồn tại không, nếu không thì tạo
  static async ensureTable() {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        folder_id VARCHAR(255) NOT NULL,
        folder_path VARCHAR(500) NOT NULL,
        date_folder_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    try {
      await pool.query(createTableSql);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Project;
