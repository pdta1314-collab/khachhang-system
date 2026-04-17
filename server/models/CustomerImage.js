const pool = require('../config/database');

class CustomerImage {
  static async create(customerId, imagePath) {
    const sql = 'INSERT INTO customer_images (customer_id, image_path) VALUES ($1, $2) RETURNING id';
    
    try {
      const result = await pool.query(sql, [customerId, imagePath]);
      return { id: result.rows[0].id };
    } catch (err) {
      throw err;
    }
  }

  static async getByCustomerId(customerId) {
    const sql = 'SELECT * FROM customer_images WHERE customer_id = $1 ORDER BY created_at ASC';
    
    try {
      const result = await pool.query(sql, [customerId]);
      return result.rows;
    } catch (err) {
      throw err;
    }
  }

  static async delete(id) {
    const sql = 'DELETE FROM customer_images WHERE id = $1';
    
    try {
      await pool.query(sql, [id]);
      return { changes: 1 };
    } catch (err) {
      throw err;
    }
  }

  static async deleteByCustomerId(customerId) {
    const sql = 'DELETE FROM customer_images WHERE customer_id = $1';
    
    try {
      await pool.query(sql, [customerId]);
      return { changes: 1 };
    } catch (err) {
      throw err;
    }
  }
}

module.exports = CustomerImage;
