const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Customer {
  static create(name, outfit) {
    return new Promise((resolve, reject) => {
      const uniqueId = uuidv4();
      const sql = 'INSERT INTO customers (name, outfit, unique_id) VALUES (?, ?, ?)';
      
      db.run(sql, [name, outfit, uniqueId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, uniqueId });
        }
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM customers WHERE id = ?';
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static getByUniqueId(uniqueId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM customers WHERE unique_id = ?';
      
      db.get(sql, [uniqueId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*, COUNT(ci.id) as image_count 
        FROM customers c 
        LEFT JOIN customer_images ci ON c.id = ci.customer_id 
        GROUP BY c.id 
        ORDER BY c.created_at DESC
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static updateVideo(id, videoPath) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE customers SET video_path = ? WHERE id = ?';
      
      db.run(sql, [videoPath, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static deleteVideo(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE customers SET video_path = NULL WHERE id = ?';
      
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM customers WHERE id = ?';
      
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
}

module.exports = Customer;
