const pool = require('../config/database');
const { randomUUID } = require('crypto');

class Customer {
  static async create(name, phone, email, outfit = null) {
    const uniqueId = randomUUID();
    const sql = 'INSERT INTO customers (name, phone, email, outfit, unique_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, unique_id';

    try {
      const result = await pool.query(sql, [name, phone, email, outfit, uniqueId]);
      return { id: result.rows[0].id, uniqueId: result.rows[0].unique_id };
    } catch (err) {
      throw err;
    }
  }

  static async getById(id) {
    const sql = 'SELECT * FROM customers WHERE id = $1';

    try {
      const result = await pool.query(sql, [id]);
      const row = result.rows[0];
      if (row) {
        return {
          id: row.id,
          uniqueId: row.unique_id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          outfit: row.outfit,
          notes: row.notes,
          status: row.status,
          registration_time: row.registration_time,
          created_at: row.created_at,
          video_path: row.video_path
        };
      }
      return null;
    } catch (err) {
      throw err;
    }
  }

  static async getByUniqueId(uniqueId) {
    const sql = 'SELECT * FROM customers WHERE unique_id = $1';

    try {
      const result = await pool.query(sql, [uniqueId]);
      const row = result.rows[0];
      if (row) {
        return {
          id: row.id,
          uniqueId: row.unique_id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          outfit: row.outfit,
          notes: row.notes,
          status: row.status,
          registration_time: row.registration_time,
          created_at: row.created_at,
          video_path: row.video_path
        };
      }
      return null;
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
      ORDER BY c.registration_time DESC
    `;

    try {
      const result = await pool.query(sql);
      return result.rows.map(row => ({
        id: row.id,
        uniqueId: row.unique_id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        outfit: row.outfit,
        notes: row.notes,
        status: row.status,
        registration_time: row.registration_time,
        created_at: row.created_at,
        video_path: row.video_path,
        image_count: row.image_count
      }));
    } catch (err) {
      throw err;
    }
  }

  static async updateStatus(id, status) {
    const sql = 'UPDATE customers SET status = $1 WHERE id = $2';

    try {
      await pool.query(sql, [status, id]);
      return { changes: 1 };
    } catch (err) {
      throw err;
    }
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.outfit !== undefined) {
      fields.push(`outfit = $${paramIndex++}`);
      values.push(updates.outfit);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return { changes: 0 };
    }

    values.push(id);
    const sql = `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

    try {
      await pool.query(sql, values);
      return { changes: 1 };
    } catch (err) {
      throw err;
    }
  }

  // Thêm video mới vào danh sách (hỗ trợ nhiều video)
  static async addVideo(id, videoUrl) {
    const customer = await this.getById(id);
    let videos = [];
    
    if (customer && customer.video_path) {
      try {
        videos = JSON.parse(customer.video_path);
        if (!Array.isArray(videos)) videos = [videos];
      } catch (e) {
        videos = [customer.video_path];
      }
    }
    
    // Thêm video mới nếu chưa có
    if (!videos.includes(videoUrl)) {
      videos.push(videoUrl);
    }
    
    const sql = 'UPDATE customers SET video_path = $1 WHERE id = $2';
    try {
      await pool.query(sql, [JSON.stringify(videos), id]);
      return { changes: 1, videoCount: videos.length };
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

  // Xóa 1 video cụ thể khỏi danh sách (hỗ trợ nhiều video)
  static async removeVideo(id, videoUrlToRemove) {
    const customer = await this.getById(id);
    if (!customer || !customer.video_path) return { changes: 0 };
    
    let videos = [];
    try {
      videos = JSON.parse(customer.video_path);
      if (!Array.isArray(videos)) videos = [videos];
    } catch (e) {
      videos = [customer.video_path];
    }
    
    // Lọc bỏ video cần xóa
    const newVideos = videos.filter(url => url !== videoUrlToRemove);
    
    if (newVideos.length === videos.length) return { changes: 0 };
    
    const sql = 'UPDATE customers SET video_path = $1 WHERE id = $2';
    try {
      await pool.query(sql, [newVideos.length > 0 ? JSON.stringify(newVideos) : null, id]);
      return { changes: 1, videoCount: newVideos.length };
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

  // Lấy khách hàng đang chụp (status = 'Đang chụp')
  static async getCurrentlyShooting() {
    const sql = 'SELECT * FROM customers WHERE status = $1 ORDER BY registration_time DESC LIMIT 1';
    
    try {
      const result = await pool.query(sql, ['Đang chụp']);
      return result.rows[0] || null;
    } catch (err) {
      throw err;
    }
  }

  // Lấy danh sách khách đang chờ (status = 'Đang chờ')
    static async getWaitingList() {
    const sql = 'SELECT * FROM customers WHERE status = $1 ORDER BY registration_time ASC';

    try {
      const result = await pool.query(sql, ['Đang chờ']);
      return result.rows.map(row => ({
        id: row.id,
        uniqueId: row.unique_id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        outfit: row.outfit,
        notes: row.notes,
        status: row.status,
        registration_time: row.registration_time
      }));
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Customer;
