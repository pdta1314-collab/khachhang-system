const db = require('../config/database');

class CustomerImage {
  static create(customerId, imagePath) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO customer_images (customer_id, image_path) VALUES (?, ?)';
      
      db.run(sql, [customerId, imagePath], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  static getByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM customer_images WHERE customer_id = ? ORDER BY created_at ASC';
      
      db.all(sql, [customerId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM customer_images WHERE id = ?';
      
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static deleteByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM customer_images WHERE customer_id = ?';
      
      db.run(sql, [customerId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
}

module.exports = CustomerImage;
