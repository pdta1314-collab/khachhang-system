# Hệ thống Thu thập Thông tin Khách hàng tại Sự kiện

Hệ thống web giúp thu thập thông tin khách hàng tại sự kiện, tự động tạo QR code để khách hàng có thể tải video sau sự kiện.

## Tính năng

- ✅ Khách hàng tự nhập thông tin (họ tên, trang phục)
- ✅ Tự động tạo QR code sau khi đăng ký
- ✅ Quét QR code để truy cập trang tải video
- ✅ Giao diện admin để quản lý khách hàng
- ✅ Upload video cho từng khách hàng riêng lẻ
- ✅ Tương thích iOS và Android
- ✅ Responsive design cho mobile

## Công nghệ

- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Frontend**: React
- **QR Code**: qrcode library
- **File Upload**: multer
- **Authentication**: JWT + bcryptjs

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy server

```bash
npm start
```

Server sẽ chạy tại: http://localhost:3000

### 3. Build frontend (nếu cần)

```bash
cd client
npm install
npm run build
```

## Sử dụng

### Trang chủ (Khách hàng)
- Truy cập: http://localhost:3000
- Khách hàng nhập họ tên và trang phục
- Sau khi gửi, QR code sẽ được hiển thị
- Khách hàng chụp màn hình QR code hoặc lưu URL

### Trang Admin
- Truy cập: http://localhost:3000/login
- **Username**: admin
- **Password**: admin123

#### Chức năng Admin:
- Xem danh sách tất cả khách hàng
- Tìm kiếm theo tên hoặc trang phục
- Upload video cho từng khách hàng
- Xóa video nếu cần
- Xóa khách hàng
- Xuất danh sách ra file CSV
- Xem trước trang tải video của khách hàng

### Trang tải video (Khách hàng)
- Truy cập qua QR code hoặc URL trực tiếp
- Hiển thị thông tin khách hàng
- Cho phép xem video trực tiếp
- Nút tải video về máy

## Định dạng video

- **Định dạng**: MP4 (H.264 codec) - tương thích nhất
- **Kích thước tối đa**: 500MB
- **Các định dạng hỗ trợ**: MP4, MOV, AVI, MKV, WEBM

## Triển khai lên Internet

### Cách 1: Sử dụng ngrok (Test nhanh)

1. Cài đặt ngrok: https://ngrok.com/download
2. Chạy server: `npm start`
3. Mở terminal mới, chạy: `ngrok http 3000`
4. Sao chép URL public (ví dụ: https://abc123.ngrok.io)
5. Cập nhật BASE_URL trong .env file
6. Khởi động lại server

### Cách 2: Deploy lên Railway/Render (Miễn phí)

1. Tạo tài khoản trên Railway.app hoặc Render.com
2. Connect với GitHub repository
3. Deploy tự động
4. Cập nhật BASE_URL trong biến môi trường

## Cấu trúc Database

### Bảng customers
- `id`: INTEGER PRIMARY KEY
- `name`: TEXT - Họ và tên
- `outfit`: TEXT - Trang phục
- `unique_id`: TEXT UNIQUE - Mã định danh duy nhất
- `video_path`: TEXT - Đường dẫn file video
- `created_at`: DATETIME - Thời gian tạo

### Bảng admin_users
- `id`: INTEGER PRIMARY KEY
- `username`: TEXT UNIQUE
- `password`: TEXT (đã mã hóa bcrypt)
- `created_at`: DATETIME

## API Endpoints

### Customers
- `POST /api/customers` - Tạo khách hàng mới
- `GET /api/customers/:id` - Lấy thông tin khách hàng
- `GET /api/customers/unique/:uniqueId` - Lấy thông tin qua unique ID
- `GET /api/customers` - Danh sách tất cả (cần auth)
- `POST /api/customers/:id/video` - Upload video (cần auth)
- `DELETE /api/customers/:id/video` - Xóa video (cần auth)
- `DELETE /api/:id` - Xóa khách hàng (cần auth)

### Admin
- `POST /api/admin/login` - Đăng nhập
- `POST /api/admin/change-password` - Đổi password (cần auth)

## Lưu ý

- Đảm bảo thư mục `server/uploads` có quyền ghi file
- Đổi `JWT_SECRET` và password admin khi triển khai production
- Backup database.db định kỳ
- Video files lưu trong `server/uploads/`

## License

MIT License
"# Data_KhachHang" 
