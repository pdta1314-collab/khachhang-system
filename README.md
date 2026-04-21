# Hệ thống Thu thập Thông tin Khách hàng tại Sự kiện

Hệ thống web giúp thu thập thông tin khách hàng tại sự kiện, tự động tạo QR code để khách hàng có thể tải video sau sự kiện.

## Tính năng

- ✅ Khách hàng tự nhập thông tin (họ tên, số điện thoại, email)
- ✅ Tự động tạo QR code sau khi đăng ký
- ✅ Quét QR code để truy cập trang tải video
- ✅ Giao diện admin để quản lý khách hàng
- ✅ Upload video từ Google Drive hoặc local
- ✅ Tương thích iOS và Android (Zalo in-app browser)
- ✅ Responsive design với video background
- ✅ Neon glow effect cho headings
- ✅ Hướng dẫn chi tiết tải video cho Android/iOS

## Công nghệ

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Frontend**: React
- **QR Code**: qrcode library
- **File Upload**: multer
- **Authentication**: JWT + bcryptjs
- **Google Drive Integration**: Google Drive API

## Yêu cầu hệ thống

### Bắt buộc:
- **Node.js**: v16.x trở lên ([Tải về](https://nodejs.org/))
- **npm**: v8.x trở lên (đi kèm với Node.js)
- **PostgreSQL**: v12.x trở lên ([Tải về](https://www.postgresql.org/download/))
- **Git**: ([Tải về](https://git-scm.com/downloads))

### Tùy chọn (cho Google Drive):
- Google Cloud Project với Google Drive API enabled
- Service Account credentials (JSON file)

## Cài đặt trên máy mới

### Bước 1: Clone repository

```bash
git clone https://github.com/pdta1314-collab/khachhang-system.git
cd khachhang-system
```

### Bước 2: Cài đặt dependencies

```bash
# Cài đặt server dependencies
npm install

# Cài đặt client dependencies
cd client
npm install
cd ..
```

### Bước 3: Cài đặt PostgreSQL

**Windows:**
1. Download PostgreSQL installer: https://www.postgresql.org/download/windows/
2. Chạy installer, nhớ mật khẩu postgres
3. Đảm bảo PostgreSQL service đang chạy

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

### Bước 4: Tạo database

```bash
# Đăng nhập vào PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE khachhang;

# Tạo user (tùy chọn)
CREATE USER khachhang_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE khachhang TO khachhang_user;

# Thoát
\q
```

### Bước 5: Cấu hình environment variables

Tạo file `.env` trong thư mục gốc:

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/khachhang

# JWT Secret (đổi thành chuỗi ngẫu nhiên dài)
JWT_SECRET=your-secret-key-change-this-in-production

# Server
PORT=3000
NODE_ENV=development

# Google Drive (tùy chọn - nếu muốn upload từ Google Drive)
GOOGLE_DRIVE_CREDENTIALS_PATH=./credentials.json
```

### Bước 6: Chạy project

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: http://localhost:3000

---

## Sử dụng

### Trang chủ (Khách hàng)
- Truy cập: http://localhost:3000
- Khách hàng nhập họ tên, số điện thoại, email
- Sau khi gửi, QR code sẽ được hiển thị
- Khách hàng chụp màn hình QR code hoặc lưu URL

### Trang Admin
- Truy cập: http://localhost:3000/login
- **Username**: admin
- **Password**: lumi2012grade (hoặc password đã đổi)

#### Chức năng Admin:
- Xem danh sách tất cả khách hàng
- Tìm kiếm theo tên hoặc số điện thoại
- Upload video từ local hoặc Google Drive
- Xóa video nếu cần
- Xóa khách hàng
- Xuất danh sách ra file CSV
- Xem trước trang tải video của khách hàng
- Quét Google Drive để tự động gán video cho khách hàng

### Trang tải video (Khách hàng)
- Truy cập qua QR code hoặc URL trực tiếp
- Hiển thị thông tin khách hàng
- Nút tải video về máy
- Hướng dẫn chi tiết cho Android/iOS

---

## Định dạng video

- **Định dạng**: MP4 (H.264 codec) - tương thích nhất
- **Kích thước tối đa**: 500MB (local), không giới hạn (Google Drive)
- **Các định dạng hỗ trợ**: MP4, MOV, AVI, MKV, WEBM

---

## Triển khai lên Railway (Cloud)

Xem file `DEPLOY_RAILWAY.md` để có hướng dẫn chi tiết deploy lên Railway.

### Tóm tắt:
1. Push code lên GitHub
2. Tạo project trên Railway
3. Connect với GitHub repository
4. Thêm biến môi trường (DATABASE_URL, JWT_SECRET)
5. Deploy tự động

---

## Cấu trúc Database

### Bảng customers
- `id`: INTEGER PRIMARY KEY
- `name`: TEXT - Họ và tên
- `phone`: TEXT - Số điện thoại
- `email`: TEXT - Email (tùy chọn)
- `status`: TEXT - Trạng thái (Đang chờ/Đã render/Đã tải)
- `unique_id`: TEXT UNIQUE - Mã định danh duy nhất
- `video_path`: TEXT (JSON) - Đường dẫn file video (hỗ trợ nhiều video)
- `image_count`: INTEGER - Số lượng ảnh
- `registration_time`: DATETIME - Thời gian đăng ký
- `created_at`: DATETIME - Thời gian tạo

### Bảng customer_images
- `id`: INTEGER PRIMARY KEY
- `customer_id`: INTEGER - Khóa ngoại đến customers
- `image_path`: TEXT - Đường dẫn ảnh
- `created_at`: DATETIME

### Bảng admin_users
- `id`: INTEGER PRIMARY KEY
- `username`: TEXT UNIQUE
- `password`: TEXT (đã mã hóa bcrypt)
- `created_at`: DATETIME

---

## API Endpoints

### Customers
- `POST /api/customers` - Tạo khách hàng mới
- `GET /api/customers/:id` - Lấy thông tin khách hàng
- `GET /api/customers/unique/:uniqueId` - Lấy thông tin qua unique ID
- `GET /api/customers` - Danh sách tất cả (cần auth)
- `POST /api/customers/:id/video` - Upload video local (cần auth)
- `POST /api/customers/:id/videos/scan-google-drive` - Quét Google Drive (cần auth)
- `DELETE /api/customers/:id/video/:videoUrl` - Xóa video (cần auth)
- `DELETE /api/:id` - Xóa khách hàng (cần auth)
- `GET /api/customers/:id/images` - Lấy danh sách ảnh (cần auth)
- `POST /api/customers/:id/images` - Upload nhiều ảnh (cần auth)
- `DELETE /api/images/:imageId` - Xóa ảnh (cần auth)

### Admin
- `POST /api/admin/login` - Đăng nhập
- `POST /api/admin/change-password` - Đổi password (cần auth)

---

## Lưu ý quan trọng

### Bảo mật:
- Đổi `JWT_SECRET` khi triển khai production
- Đổi password admin mặc định
- Không commit file `.env` (đã có trong .gitignore)
- Không commit Google Drive credentials

### Database:
- Backup database định kỳ
- Railway tự động backup PostgreSQL
- Local: dùng `pg_dump khachhang > backup.sql`

### Files:
- Video/ảnh local lưu trong `server/uploads/`
- Railway sẽ xóa files khi redeploy (nếu không dùng Volume)
- Google Drive không bị xóa

---

## Xử lý sự cố

### Lỗi "Không thể kết nối database"
- Kiểm tra PostgreSQL service đang chạy
- Kiểm tra DATABASE_URL trong .env
- Đảm bảo database đã được tạo

### Lỗi "Module not found"
- Chạy `npm install` trong cả thư mục gốc và client

### Lỗi "Port 3000 đang được sử dụng"
- Đổi PORT trong .env
- Hoặc tắt service đang dùng port 3000

### Video không tải được trên Zalo
- Hướng dẫn khách hàng mở trong Chrome/Safari
- Xem hướng dẫn chi tiết trên trang tải video

---

## License

MIT License 
