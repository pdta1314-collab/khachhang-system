# Giải Pháp Đơn Giản: Manual Workflow

Vì OAuth2 và Service Account đều bị hạn chế bởi tổ chức, chúng ta dùng workflow thủ công đơn giản.

## Tóm tắt

- ✅ **Không cần** OAuth2 phức tạp
- ✅ **Không cần** Service Account key
- ✅ **Chỉ cần** tạo folder thủ công trên Google Drive
- ✅ Hệ thống tự động đọc folder và sync video

## Quy trình

### Bước 1: Bạn tạo folder thủ công trên Google Drive

1. Mở Google Drive của bạn
2. Tạo folder mới trong folder **"Project"**
3. Đặt tên theo định dạng: `dd-mm-yyyy_Tên dự án`
   - VD: `20-04-2026_TrumSo`
4. Trong folder đó, tạo:
   - Subfolder: **"videos"** (để chứa video)
   - File Google Sheets: **"customers"** (để chứa danh sách khách hàng)

### Bước 2: Copy Folder ID

1. Mở folder vừa tạo trong Google Drive
2. Nhìn URL, copy phần sau `folders/`:
   ```
   https://drive.google.com/drive/folders/1A2B3C4D5E...
                                     ↑ Copy cái này
   ```

### Bước 3: Thêm dự án vào hệ thống (API có sẵn)

Gọi API để thêm dự án:

```bash
curl -X POST https://your-app.railway.app/api/projects/manual \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TrumSo",
    "folder_id": "1A2B3C4D5E...",
    "date": "20-04-2026"
  }'
```

Hoặc dùng Admin Dashboard UI (tôi sẽ thêm nút "Thêm dự án thủ công")

### Bước 4: Upload video và sync

1. Upload video vào folder `videos/` trên Google Drive
2. Đặt tên theo định dạng: `ID{N}_T{N}.mp4`
   - VD: `ID1_T1.mp4`, `ID1_T2.mp4`, `ID2_T1.mp4`
3. Trong Admin Dashboard, click **"Sync Video từ Drive"**
4. Hệ thống tự động:
   - Đọc tất cả video từ folder
   - Parse tên file → Liên kết với customer ID
   - Cập nhật database

## So sánh

| | OAuth2 | Service Account | **Manual (Khuyến nghị)** |
|---|---|---|---|
| **Độ phức tạp** | Cao | Cao | **Thấp** |
| **Cần IT admin** | Có | Có | **Không** |
| **Tự động tạo folder** | ✅ | ✅ | ❌ (Tự tạo tay) |
| **Sync video** | ✅ | ✅ | ✅ (Auto scan) |
| **Export CSV** | ✅ | ✅ | ✅ (Download từ Sheets) |

## Bạn muốn tôi làm gì?

### Option 1: Thêm "Thêm dự án thủ công" vào Admin Dashboard
- Input: Tên dự án, Folder ID, Ngày
- Lưu vào database
- Sync video tự động từ folder đó

### Option 2: CSV Export đơn giản
- Trong Admin Dashboard: Chọn dự án → Export CSV
- Download file CSV về máy
- Upload lên Google Drive thủ công

**Khuyến nghị: Option 1** - Đơn giản, không cần OAuth2 phức tạp.

---

**Bạn chọn option nào? Tôi sẽ implement ngay.**
