# Hướng Dẫn Setup Google Service Account

## Tổng quan
Service Account cho phép server tự động tạo folder, upload file lên Google Drive của bạn mà không cần người dùng đăng nhập.

## Bước 1: Tạo Service Account trên Google Cloud

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Điền thông tin:
   - **Service account name**: `drive-manager`
   - **Service account ID**: tự động tạo
   - **Description**: `Quản lý Google Drive cho ứng dụng`
6. Click **Create and Continue**
7. Ở màn hình **Grant roles**, chọn:
   - **Role**: `Editor` (hoặc `Owner` nếu cần nhiều quyền)
8. Click **Continue** → **Done**

## Bước 2: Tạo Key cho Service Account

1. Vào danh sách Service Accounts
2. Click vào service account vừa tạo (`drive-manager`)
3. Tab **Keys** → **Add Key** → **Create new key**
4. Chọn **JSON** → Click **Create**
5. File JSON sẽ tự động tải về (VD: `project-name-123456-abcdef.json`)
6. **Lưu file này cẩn thận** - đây là private key!

## Bước 3: Kích hoạt Google Drive API

1. Trong Google Cloud Console, vào **APIs & Services** → **Library**
2. Tìm **Google Drive API**
3. Click **Enable**

## Bước 4: Share Folder Google Drive

1. Mở Google Drive của bạn
2. Tìm folder **"Project"** (hoặc folder bạn muốn lưu dự án)
3. Right-click → **Share**
4. Thêm email của Service Account (tìm trong file JSON, key `client_email`)
   - VD: `drive-manager@project-name-123456.iam.gserviceaccount.com`
5. Cấp quyền **Editor**
6. Click **Send**

## Bước 5: Cấu hình cho Local Development

### Cách 1: Dùng file JSON (Khuyến nghị cho local)

1. Đổi tên file JSON thành `service-account-key.json`
2. Copy vào thư mục `server/`
3. File sẽ có đường dẫn: `server/service-account-key.json`

### Cách 2: Dùng biến môi trường

1. Mở file JSON, copy toàn bộ nội dung
2. Chuyển thành chuỗi JSON (bỏ xuống dòng)
3. Thêm vào `.env`:

```
GOOGLE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account","project_id":"..."}
```

Hoặc chỉ định đường dẫn file:

```
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account-key.json
```

## Bước 6: Cấu hình cho Railway (Production)

1. Vào Railway Dashboard
2. Chọn project → **Variables**
3. Thêm biến:
   - **Key**: `GOOGLE_SERVICE_ACCOUNT_KEY_JSON`
   - **Value**: Copy toàn bộ nội dung file JSON (paste trực tiếp)
4. Click **Add**

**Lưu ý**: Railway hỗ trợ multi-line value, bạn có thể paste cả file JSON.

## Bước 7: Cập nhật các biến môi trường khác

Đảm bảo bạn đã có các biến:

```
GOOGLE_DRIVE_API_KEY=your_api_key_here
GOOGLE_DRIVE_FOLDER_ID=your_root_folder_id
GOOGLE_DRIVE_PROJECT_FOLDER_ID=your_project_folder_id (nếu khác với folder_id trên)
```

## Kiểm tra hoạt động

1. Khởi động server
2. Xem log console:
   - Nếu thấy: `⚠️ Service Account chưa được cấu hình` → Chưa setup đúng
   - Nếu thấy: Không có warning → Setup thành công!

3. Test tạo dự án:
   - Vào trang đăng ký
   - Click **DỰ ÁN** → **Tạo dự án mới**
   - Nhập tên dự án → Click **Tạo**
   - Nếu thành công: Folder sẽ được tạo trên Google Drive!

## Troubleshooting

### Lỗi "Service Account chưa được cấu hình"
- Kiểm tra file `service-account-key.json` có trong thư mục `server/` không
- Hoặc kiểm tra biến `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` đã được set chưa

### Lỗi "Insufficient permissions"
- Service Account chưa được share folder Google Drive
- Vào Google Drive → Share folder với email Service Account

### Lỗi "Google Drive API has not been used"
- Chưa kích hoạt Google Drive API trong Google Cloud Console
- Vào **APIs & Services** → **Library** → Tìm **Google Drive API** → **Enable**

### Lỗi "Invalid credentials"
- File JSON bị sai format
- Tạo lại key trong Google Cloud Console

## Giới hạn (Quota)

Service Account miễn phí có giới hạn:
- **1 tỷ request/ngày** cho mỗi project
- **100 requests/user/100 giây**

Với ứng dụng của bạn (tạo dự án, upload CSV), giới hạn này là rất thoải mái.

## Bảo mật

⚠️ **Quan trọng**:
- Không commit file `service-account-key.json` lên GitHub!
- Đã thêm vào `.gitignore`: `server/service-account-key.json`
- Nếu lộ key, vào Google Cloud Console → Xóa key cũ → Tạo key mới
