# Hướng dẫn Deploy lên Railway (URL Cố định - MIỄN PHÍ)

## 🎯 Mục tiêu
- Có URL cố định (không thay đổi) ví dụ: `https://khachhang-production.up.railway.app`
- Khách hàng quét QR code mãi mãi đều truy cập được
- Không cần mang laptop đi sự kiện (chỉ cần tablet/iPad đơn giản)

---

## 📋 Chuẩn bị

### Bước 1: Tạo tài khoản
1. Vào https://github.com/signup → Đăng ký GitHub (MIỄN PHÍ)
2. Vào https://railway.app → Đăng ký Railway (MIỄN PHÍ, dùng GitHub login)

### Bước 2: Cài đặt Git
Tải Git: https://git-scm.com/download/win

---

## 🚀 Các bước Deploy

### Bước 1: Khởi tạo Git repository

Mở PowerShell/Command Prompt tại thư mục `E:\KhachHang`:

```powershell
cd E:\KhachHang

# Khởi tạo git
git init

# Thêm tất cả file
git add .

# Commit
git commit -m "Initial commit - KhachHang event system"
```

### Bước 2: Tạo repository trên GitHub

1. Vào https://github.com/new
2. Repository name: `khachhang-system`
3. Chọn **Public** (hoặc Private cũng được)
4. Bấm **Create repository**
5. Copy 2 lệnh từ mục "…or push an existing repository from the command line":

```powershell
git remote add origin https://github.com/YOUR_USERNAME/khachhang-system.git
git branch -M main
git push -u origin main
```

*(Thay YOUR_USERNAME bằng username GitHub của bạn)*

### Bước 3: Deploy lên Railway

1. Vào https://railway.app/dashboard
2. Bấm **"New Project"**
3. Chọn **"Deploy from GitHub repo"**
4. Chọn repository `khachhang-system`
5. Bấm **"Add Variables"** → Thêm biến môi trường:
   - Key: `JWT_SECRET`
   - Value: `khachhang-secret-key-2024-railway`
   *(Bất kỳ chuỗi nào dài và ngẫu nhiên đều được)*
6. Bấm **"Deploy"**

### Bước 4: Lấy URL cố định

1. Đợi deploy hoàn tất (khoảng 2-3 phút)
2. Vào project → tab **Settings**
3. Trong mục **Public Networking**, bật **"Generate Domain"**
4. Railway sẽ tạo URL ví dụ: `https://khachhang-production.up.railway.app`

**🎉 XONG!** URL này sẽ cố định mãi mãi, không bao giờ thay đổi!

---

## 🔧 Cấu hình sau deploy

### Cập nhật BASE_URL

1. Trong Railway dashboard, vào tab **Variables**
2. Thêm variable:
   - Key: `BASE_URL`
   - Value: `https://your-railway-url.up.railway.app` *(thay bằng URL thật của bạn)*
3. Redeploy lại project

### Thêm Volume để lưu ảnh/video (KHÔNG BẮT BUỘC)

Mặc định Railway xóa file khi redeploy. Để giữ ảnh/video:

1. Railway dashboard → tab **Volumes**
2. Bấm **"New Volume"**
   - Name: `uploads`
   - Mount Path: `/app/server/uploads`
3. Redeploy project

---

## 📝 Cách sử dụng sau khi deploy

### Truy cập hệ thống:
- **Trang chủ**: `https://your-url.up.railway.app/`
- **Admin**: `https://your-url.up.railway.app/login`
  - Username: `admin`
  - Password: `admin123`

### Tại sự kiện:
1. Mở iPad/laptop kết nối WiFi
2. Vào URL Railway
3. Khách hàng đăng ký → chụp QR code
4. Về nhà render video → upload lên Railway qua trình duyệt
5. Khách hàng tải video bất cứ lúc nào

---

## 🔄 Cập nhật code sau này

Khi cần sửa code:

```powershell
cd E:\KhachHang

# Sửa code xong...

# Commit và push
git add .
git commit -m "Sửa lỗi XYZ"
git push origin main
```

Railway sẽ **tự động redeploy** khi có push mới!

---

## ⚠️ Lưu ý

### Giới hạn gói miễn phí:
- **500 giờ** runtime/tháng (~20 ngày liên tục)
- Nếu hết giờ: Deploy lại hoặc nâng cấp $5/tháng
- Dữ liệu SQLite sẽ mất khi redeploy (nếu không dùng Volume)

### Backup dữ liệu:
Định kỳ export database:
- Vào Admin dashboard
- Bấm **"Xuất CSV"** để lưu danh sách khách hàng

### An toàn:
- Đổi password admin ngay sau khi deploy
- Không commit file `.env` (đã có trong .gitignore)

---

## 🆘 Xử lý sự cố

### Lỗi "Build failed"
1. Railway dashboard → tab **Deployments**
2. Xem logs tìm lỗi
3. Sửa code → push lại

### Lỗi "Cannot find module"
- Kiểm tra `package.json` đã commit chưa
- Kiểm tra `node_modules` có trong `.gitignore` không

### URL không truy cập được
1. Railway dashboard → Settings
2. Kiểm tra **Public Networking** đã bật chưa
3. Kiểm tra có domain chưa

---

## 💡 Mẹo

1. **Đặt tên dễ nhớ**: Đổi domain Railway thành tên dễ nhớ
   - Settings → Public Networking → Custom Domain
   - Ví dụ: `sukien-cuaban.up.railway.app`

2. **In QR code**: Dùng URL Railway in QR code dán lên backdrop

3. **Test trước**: Sau deploy, dùng điện thoại thử truy cập URL

---

## ✅ Checklist trước sự kiện

- [ ] Deploy thành công lên Railway
- [ ] Có URL cố định
- [ ] Test đăng ký khách hàng
- [ ] Test upload ảnh
- [ ] Test upload video
- [ ] Test tải video từ điện thoại
- [ ] Đổi password admin
- [ ] In QR code mẫu dán lên backdrop

---

**🎉 Chúc mừng! Bạn đã có hệ thống chạy trên cloud với URL cố định!**

Cần hỗ trợ thêm? Xem logs trong Railway dashboard hoặc liên hệ tôi.
