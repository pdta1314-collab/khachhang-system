# Hướng dẫn cấu hình Google Drive API (API Key - Public Folder)

## Bước 1: Tạo Google Cloud Project

1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. Kích hoạt **Google Drive API**:
   - Vào **APIs & Services** > **Library**
   - Tìm "Google Drive API" > Click **Enable**

## Bước 2: Tạo API Key

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. **API Key** sẽ hiện ra - copy và lưu lại
4. (Tùy chọn) Click **Restrict Key** để giới hạn quyền truy cập:
   - Chỉ cho phép **Google Drive API**
   - Chỉ cho phép IP/domain của bạn

## Bước 3: Tạo Public Folder Google Drive

1. Vào **Google Drive** của bạn
2. Tạo folder mới tên: `videos`
3. Upload video vào folder (đặt tên: `ID1.mp4`, `ID1_T1.mp4`, `ID2.mp4`...)
4. Click chuột phải folder > **Share** > **Share**
5. Ở mục **General access**, chọn: **Anyone with the link**
6. Đặt quyền: **Viewer**
7. Click **Copy link** để lấy link share

## Bước 4: Cấu hình Biến môi trường

Thêm vào file `.env` trong thư mục gốc `E:\KhachHang\`:

```env
# Google Drive API Key
GOOGLE_DRIVE_API_KEY=YOUR_API_KEY_HERE
GOOGLE_DRIVE_FOLDER_ID=YOUR_FOLDER_ID_HERE
```

**Lấy Folder ID từ link share:**
- Link share: `https://drive.google.com/drive/folders/1ABC123xyz?usp=sharing`
- Folder ID là: `1ABC123xyz`

## Lưu ý bảo mật

- Không commit `.env` lên GitHub (đã có trong `.gitignore`)
- Railway: Thêm biến môi trường trong Dashboard > Variables
- API Key chỉ cần quyền read-only để an toàn

## Cài đặt dependencies

```bash
cd E:\KhachHang
npm install axios
```

---

## Cách dùng sau khi cấu hình xong

1. Ném video vào folder `videos` trên Google Drive
2. Đặt tên file: `ID1.mp4`, `ID1_T1.mp4`, `ID2.mp4`...
3. Bấm nút **"📂 Scan Google Drive videos"** trong admin
4. Hệ thống sẽ tải video từ Drive về và upload cho khách hàng tương ứng
