const pool = require('../config/database');
const { randomUUID } = require('crypto');

class Customer {
  static async create(name, outfit) {
    const uniqueId = randomUUID();
    const sql = 'INSERT INTO customers (name, outfit, unique_id) VALUES ($1, $2, $3) RETURNING id, unique_id';
    
    try {
      const result = await pool.query(sql, [name, outfit, uniqueId]);
      return { id: result.rows[0].id, uniqueId: result.rows[0].unique_id };
    } catch (err) {
      throw err;
    }
  }

  static async getById(id) {
    const sql = 'SELECT * FROM customers WHERE id = $1';
    
    try {
      const result = await pool.query(sql, [id]);
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  static async getByUniqueId(uniqueId) {
    const sql = 'SELECT * FROM customers WHERE unique_id = $1';
    
    try {
      const result = await pool.query(sql, [uniqueId]);
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  static async getAll() {
    const sql = `
      SELECT c.*, COUNT(ci.id) as image_count 
      FROM customers c 
      LEFT JOIN customer_images ci ON c.id = ci.customer_id 
      GROUP BY c.id 
      ORDER BY c.created_at DESC
    `;
    
    try {
      const result = await pool.query(sql);
      return result.rows;
    } catch (err) {
      throw err;
    }
  }

  static async updateVideo(id, videoPath) {
    const sql = 'UPDATE customers SET video_path = $1 WHERE id = $2';
    
    try {
      await pool.query(sql, [videoPath, id]);
      return { changes: 1 };
    } catch (err) {
      throw err;
    }
  }

  static async deleteVideo(id) {
    const sql = 'UPDATE customers SET video_path = NULL WHERE id = $1';
    
    try {
      await pool.query(sql, [id]);
      return { changes: 1 };
    } catch (err) {
      throw err;
    }
  }

  static async delete(id) {
    const sql = 'DELETE FROM customers WHERE id = $1';
    
    try {
      await pool.query(sql, [id]);
      return { changes: 1 };
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Customer;
