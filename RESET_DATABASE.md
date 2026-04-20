# Hướng dẫn Reset Database PostgreSQL trên Railway

## Cách 1: Xóa và tạo lại database (nhanh nhất)

1. **Railway Dashboard** → service **web**
2. Tab **Variables** → tìm `DATABASE_URL`
3. Xóa service **PostgreSQL** hiện tại
4. Tạo mới service **PostgreSQL**
5. Cập nhật `DATABASE_URL` trong service **web** với connection string mới
6. Redeploy service **web**

## Cách 2: Xóa tất cả dữ liệu (giữ nguyên database)

### Via Railway Console (CLI)

1. **Railway Dashboard** → service **PostgreSQL**
2. Click **"New Console"**
3. Chọn **"psql"**
4. Chạy các lệnh sau:

```sql
-- Xóa tất cả dữ liệu trong bảng customers
DELETE FROM customers;

-- Reset sequence về 1
ALTER SEQUENCE customers_id_seq RESTART WITH 1;

-- Xác nhận
SELECT COUNT(*) FROM customers; -- Nên trả về 0
```

### Via Railway API

1. **Railway Dashboard** → service **PostgreSQL**
2. Tab **Variables**
3. Copy `DATABASE_URL`
4. Dùng psql từ máy local:

```bash
psql $DATABASE_URL -c "DELETE FROM customers; ALTER SEQUENCE customers_id_seq RESTART WITH 1;"
```

## Cách 3: Drop và tạo lại bảng (giữ nguyên database)

### Via Railway Console

1. **Railway Dashboard** → service **PostgreSQL**
2. Click **"New Console"** → chọn **"psql"**
3. Chạy:

```sql
-- Drop bảng customers
DROP TABLE IF EXISTS customers;

-- Tạo lại bảng (schema mới)
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  outfit TEXT,
  notes TEXT,
  unique_id TEXT UNIQUE NOT NULL,
  video_path TEXT,
  status TEXT DEFAULT 'Đang chờ',
  registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reset sequence
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
```

## Cách 4: Via Code (tạo endpoint reset)

Thêm endpoint vào backend (không khuyến nghị cho production):

```javascript
// server/routes/customers.js
router.delete('/reset-all', adminController.verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM customers');
    await pool.query('ALTER SEQUENCE customers_id_seq RESTART WITH 1');
    res.json({ success: true, message: 'Đã reset database' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi reset database' });
  }
});
```

Sau đó gọi: `DELETE /api/customers/reset-all`

---

## Lưu ý quan trọng

- ⚠️ **Cách 1 và 3 sẽ mất TẤT CẢ dữ liệu**
- ✅ **Cách 2 chỉ xóa dữ liệu, giữ nguyên cấu trúc**
- 🔒 **Cách 4 chỉ nên dùng trong development, KHÔNG dùng production**
- 📝 **Luôn backup trước khi reset** (nếu cần)
