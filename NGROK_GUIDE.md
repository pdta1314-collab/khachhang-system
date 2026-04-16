# Hướng dẫn sử dụng Ngrok để tạo URL Public

## Vấn đề

Khi khách hàng quét QR code bằng điện thoại, họ không thể truy cập được vì URL đang trỏ tới `localhost:3000` - chỉ hoạt động trên máy tính của bạn.

## Giải pháp: Sử dụng Ngrok

Ngrok tạo một URL public (HTTPS) tunnel tới localhost của bạn, cho phép khách hàng truy cập từ bất kỳ đâu trên internet.

## Cách 1: Dùng script tự động (Khuyến nghị)

### Bước 1: Cài đặt ngrok (nếu chưa có)
```bash
npm install ngrok
```

### Bước 2: Đăng ký tài khoản ngrok (MIỄN PHÍ)
1. Truy cập: https://dashboard.ngrok.com/signup
2. Đăng ký tài khoản miễn phí
3. Vào: https://dashboard.ngrok.com/get-started/your-authtoken
4. Sao chép authtoken của bạn

### Bước 3: Thiết lập authtoken
**Windows (Command Prompt hoặc PowerShell):**
```cmd
set NGROK_AUTHTOKEN=your_token_here
```

**Windows (PowerShell permanent):**
```powershell
[Environment]::SetEnvironmentVariable("NGROK_AUTHTOKEN", "your_token_here", "User")
```

**Mac/Linux:**
```bash
export NGROK_AUTHTOKEN=your_token_here
```

### Bước 4: Khởi động server với ngrok
```bash
npm run start:ngrok
```

Script sẽ:
- Tự động khởi động ngrok tunnel
- Tạo URL public (ví dụ: https://abc123-def.ngrok-free.app)
- Cập nhật BASE_URL trong .env
- Khởi động server

### Bước 5: Dùng URL public
- QR code sẽ tự động cập nhật với URL public mới
- Khách hàng có thể quét và truy cập từ điện thoại
- URL hoạt động mọi lúc mọi nơi (kể cả khi khách hàng về nhà)

## Cách 2: Dùng ngrok CLI trực tiếp

### Bước 1: Tải ngrok
- Truy cập: https://ngrok.com/download
- Tải phiên bản Windows
- Giải nén và thêm vào PATH

### Bước 2: Cài đặt authtoken
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### Bước 3: Khởi động
**Terminal 1 - Khởi động server:**
```bash
npm start
```

**Terminal 2 - Khởi động ngrok:**
```bash
ngrok http 3000
```

### Bước 4: Cập nhật BASE_URL
Sao chép URL HTTPS từ ngrok (ví dụ: https://abc123-def.ngrok-free.app) và cập nhật file `.env`:
```
BASE_URL=https://abc123-def.ngrok-free.app
```

Khởi động lại server.

## Lưu ý quan trọng

### 1. URL ngrok thay đổi mỗi lần khởi động lại
- **Miễn phí**: URL thay đổi mỗi lần restart ngrok
- **Trả phí ($5/tháng)**: Có thể giữ URL cố định

### 2. Khách hàng có thể tải video sau khi về nhà
- QR code trỏ tới URL ngrok
- Video được lưu trên server của bạn
- Khách hàng có thể quét QR bất cứ lúc nào để tải video
- Miễn là server của bạn còn chạy và ngrok còn active

### 3. Giới hạn của ngrok miễn phí
- 1 ngrok process đồng thời
- URL thay đổi mỗi lần khởi động
- Có thể bị giới hạn request nếu dùng quá nhiều

### 4. Bảo mật
- Ngrok cung cấp HTTPS miễn phí
- Dữ liệu được mã hóa
- An toàn cho khách hàng truy cập

## Workflow đề xuất cho sự kiện

### Trước sự kiện (1 ngày):
1. Khởi động server với ngrok: `npm run start:ngrok`
2. Lưu lại URL public
3. In QR code mẫu để test

### Trong sự kiện:
1. Khách hàng đăng ký → nhận QR code
2. Nhiếp ảnh gia chụp nhiều batch hình
3. Upload tất cả ảnh vào admin dashboard
4. Chọn ảnh ưng ý để render video
5. Upload video lên từng khách hàng

### Sau sự kiện:
1. Server tiếp tục chạy
2. Khách hàng về nhà vẫn quét QR được
3. Tải video khi đã render xong

## Xử lý sự cố

### Lỗi "ngrok command not found"
```bash
npm install ngrok
```

### Lỗi "authorization failed"
Kiểm tra authtoken:
```bash
echo %NGROK_AUTHTOKEN%  (Windows)
echo $NGROK_AUTHTOKEN   (Mac/Linux)
```

### QR code không hoạt động
1. Kiểm tra BASE_URL trong .env có đúng URL ngrok không
2. Khởi động lại server
3. Kiểm tra ngrok còn active không

## Triển khai lâu dài (Production)

Nếu cần hệ thống chạy 24/7, xem xét:
- **Railway.app**: Deploy miễn phí/giá rẻ
- **Render.com**: Deploy miễn phí
- **VPS/Vultr**: Server riêng $5/tháng

Xem README.md để biết thêm chi tiết.
