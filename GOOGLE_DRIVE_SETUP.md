# Hướng dẫn cấu hình Google Drive API

## Bước 1: Tạo Google Cloud Project

1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. Kích hoạt **Google Drive API**:
   - Vào **APIs & Services** > **Library**
   - Tìm "Google Drive API" > Click **Enable**

## Bước 2: Tạo Service Account

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Đặt tên: `khachhang-video-service`
4. Click **Create** > **Continue** > **Done**
5. Click vào service account vừa tạo
6. Tab **Keys** > **Add Key** > **Create New Key**
7. Chọn **JSON** > Click **Create**
8. File JSON sẽ tự động download - đây là file **credentials**

## Bước 3: Chia sẻ folder Google Drive

1. Vào Google Drive của bạn
2. Tạo folder mới tên: `videos`
3. Upload video vào folder (đặt tên: `ID1.mp4`, `ID1_T1.mp4`, `ID2.mp4`...)
4. Click chuột phải folder > **Share**
5. Thêm email service account (có trong file JSON, dạng: `...@....iam.gserviceaccount.com`)
6. Đặt quyền: **Editor** hoặc **Viewer** (tùy nhu cầu)

## Bước 4: Cấu hình Biến môi trường

Thêm vào file `.env` trong thư mục `server/`:

```env
# Google Drive API
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # Copy toàn bộ nội dung file JSON vào đây
GOOGLE_DRIVE_FOLDER_ID=YOUR_FOLDER_ID  # ID folder videos (lấy từ URL Drive)
```

**Lấy Folder ID:**
- URL folder: `https://drive.google.com/drive/folders/1ABC123xyz`
- Folder ID là: `1ABC123xyz`

## Bước 5: Cài đặt dependencies

```bash
cd server
npm install googleapis
```

## Lưu ý bảo mật

- Không commit file credentials JSON lên GitHub
- Không commit `.env` lên GitHub (đã có trong `.gitignore`)
- Railway: Thêm biến môi trường trong Dashboard > Variables

---

## Cách dùng sau khi cấu hình xong

1. Ném video vào folder `videos` trên Google Drive
2. Đặt tên file: `ID1.mp4`, `ID1_T1.mp4`, `ID2.mp4`...
3. Bấm nút **"📂 Scan Google Drive videos"** trong admin
4. Hệ thống sẽ tải video từ Drive về và upload cho khách hàng tương ứng
