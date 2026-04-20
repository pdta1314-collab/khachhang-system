# Giải Pháp Đơn Giản: Manual Workflow

Vì OAuth2 và Service Account đều bị hạn chế bởi tổ chức, chúng ta dùng workflow thủ công đơn giản.

## ✅ Đã Hoàn Thành

- ✅ **Không cần** OAuth2 phức tạp
- ✅ **Không cần** Service Account key
- ✅ **Chỉ cần** tạo folder thủ công trên Google Drive
- ✅ Admin Dashboard có nút **DỰ ÁN** để chọn folder
- ✅ Hệ thống tự động đọc folder và sync video
- ✅ Export CSV trực tiếp từ Admin Dashboard

## Quy trình Sử Dụng

### Bước 1: Tạo folder thủ công trên Google Drive

1. Mở Google Drive của bạn
2. Tạo folder mới trong folder **"Project"**
3. Đặt tên theo định dạng: `dd-mm-yyyy_Tên dự án`
   - VD: `20-04-2026_TrumSo`
4. Trong folder đó, tạo:
   - Subfolder: **"videos"** (để chứa video)

### Bước 2: Chọn dự án trong Admin Dashboard

1. Đăng nhập vào Admin Dashboard
2. Click nút **📁 DỰ ÁN**
3. Modal hiển thị danh sách folder từ Google Drive
4. Chọn folder dự án muốn làm việc

### Bước 3: Upload video và sync

1. Upload video vào folder `videos/` trên Google Drive
2. Đặt tên theo định dạng: `ID{N}_T{N}.mp4`
   - VD: `ID1_T1.mp4`, `ID1_T2.mp4`, `ID2_T1.mp4`
3. Trong Admin Dashboard, click **☁️ Scan Google Drive**
4. Hệ thống tự động:
   - Đọc tất cả video từ folder đã chọn
   - Parse tên file → Liên kết với customer ID
   - Cập nhật database

### Bước 4: Export CSV

1. Trong Admin Dashboard, click nút **📊 Export CSV**
2. File CSV được tải về máy với tên: `{TênDựÁN}_{Ngày}.csv`
3. Upload file CSV vào folder dự án trên Google Drive (thủ công)

## So sánh

| | OAuth2 | Service Account | **Manual (Đã implement)** |
|---|---|---|---|
| **Độ phức tạp** | Cao | Cao | **Thấp** |
| **Cần IT admin** | Có | Có | **Không** |
| **Tự động tạo folder** | ✅ | ✅ | ❌ (Tự tạo tay) |
| **Sync video** | ✅ | ✅ | ✅ (Auto scan) |
| **Export CSV** | ✅ | ✅ | ✅ (Download từ Admin) |

## Các thay đổi đã thực hiện

### Frontend
- ✅ Xóa nút DỰ ÁN khỏi trang đăng ký (CustomerForm.js)
- ✅ Thêm nút DỰ ÁN vào Admin Dashboard
- ✅ Thêm modal chọn folder từ Google Drive
- ✅ Thêm nút Export CSV

### Backend
- ✅ Tạo route `/api/google-drive/folders` để lấy danh sách folder
- ✅ Tạo route `/api/google-drive/sync-folder` để sync video từ folder
- ✅ Đăng ký routes trong server.js

## Deploy

Code đã được push lên GitHub (commit `34e51a0`).

Bạn cần:
1. Railway sẽ tự động deploy
2. Đảm bảo biến môi trường `GOOGLE_DRIVE_API_KEY` và `GOOGLE_DRIVE_PROJECT_FOLDER_ID` đã được cấu hình
3. Test bằng cách tạo folder trên Google Drive và chọn trong Admin Dashboard
