# Hướng dẫn Upload Video lên Railway

## Vấn đề
- File `trumso.mp4` (330MB) quá lớn để push lên GitHub (giới hạn 100MB)
- Code đã được push lên GitHub, nhưng video chưa có trên server
- Cần upload video lên Railway thủ công để video hiển thị trên trang web

---

## Cách 1: Upload qua Railway Dashboard (Dễ nhất)

### Bước 1: Truy cập Railway Dashboard
1. Mở trình duyệt, vào: https://railway.app/dashboard
2. Đăng nhập bằng tài khoản của bạn

### Bước 2: Chọn project
1. Tìm project tên "khachhang-system" hoặc tên tương tự
2. Click vào project để mở

### Bước 3: Chọn service frontend
1. Trong project, tìm service tên "client" hoặc "frontend" (React app)
2. Click vào service đó

### Bước 4: Vào tab "Deployments"
1. Click tab "Deployments" ở trên cùng
2. Tìm deployment mới nhất (màu xanh lá)
3. Click vào deployment đó

### Bước 5: Mở Terminal
1. Click nút "Shell" hoặc "Terminal" (icon >_)
2. Đợi terminal load

### Bước 6: Upload file (Cách A: Copy từ URL)
```bash
# Vào thư mục public
cd /app/public

# Download video từ link bên ngoài (nếu có)
wget -O trumso.mp4 "YOUR_VIDEO_URL_HERE"

# Hoặc curl
curl -L -o trumso.mp4 "YOUR_VIDEO_URL_HERE"
```

### Bước 6: Upload file (Cách B: Dùng Railway CLI - Khuyên dùng)

#### 1. Cài Railway CLI trên máy local
**Windows (PowerShell):**
```powershell
npm install -g @railway/cli
```

**Mac/Linux:**
```bash
npm install -g @railway/cli
```

#### 2. Đăng nhập Railway CLI
```bash
railway login
```
- Sẽ mở trình duyệt để đăng nhập
- Hoặc dùng token: `railway login --token YOUR_TOKEN`

#### 3. Chọn project
```bash
railway link
```
- Chọn project "khachhang-system" từ danh sách

#### 4. Upload file lên volume
```bash
# Upload file trumso.mp4 từ máy local lên Railway
railway add -f ./client/public/trumso.mp4
```

Hoặc nếu Railway hỗ trợ volumes:
```bash
# Mount volume và copy file
railway volumes create uploads --size 1GB
railway volumes mount uploads /app/public
# Sau đó upload file qua dashboard
```

---

## Cách 2: Dùng SCP/SFTP (Nếu Railway hỗ trợ)

```bash
# Upload qua SCP (nếu có SSH access)
scp ./client/public/trumso.mp4 railway@your-project.railway.app:/app/public/
```

---

## Cách 3: Git LFS (Không khuyến khích)

Nếu muốn dùng Git LFS để lưu file lớn:

```bash
# 1. Cài Git LFS
git lfs install

# 2. Theo dõi file mp4
git lfs track "*.mp4"

# 3. Add và commit
git add .gitattributes
git add client/public/trumso.mp4
git commit -m "Add trumso.mp4 via Git LFS"
git push
```

⚠️ **Lưu ý:** Railway có thể không hỗ trợ Git LFS, cần kiểm tra lại.

---

## Cách 4: Dùng Cloud Storage (Khuyến khích cho production)

Upload video lên dịch vụ cloud và dùng URL:

### Google Drive + Drive API
1. Upload `trumso.mp4` lên Google Drive
2. Chia sẻ file (Public access)
3. Lấy direct link
4. Sửa code để dùng link thay vì `/trumso.mp4`

### Amazon S3 / Cloudflare R2
1. Upload file lên bucket
2. Lấy public URL
3. Sửa code: `src="https://your-bucket.com/trumso.mp4"`

---

## Kiểm tra sau khi upload

1. Truy cập website sau khi deploy xong
2. Mở DevTools (F12) → tab "Network"
3. Tìm request đến `trumso.mp4`
4. Check status: 200 = OK, 404 = Chưa có file

---

## Troubleshooting

### Video không hiển thị
- Check console.log có lỗi không
- Check tab Network xem video load được không
- Đảm bảo file đúng đường dẫn `/trumso.mp4`

### Video không autoplay
- Trình duyệt chặn autoplay có âm thanh
- Đã thêm `muted` nên không vấn đề này

### File quá lớn
- Nén video: `ffmpeg -i trumso.mp4 -vcodec h264 -acodec mp2 trumso_compressed.mp4`
- Hoặc dùng format WebM nhẹ hơn

---

## Khuyến nghị nhanh nhất

**Nếu muốn nhanh gọn:**
1. Upload `trumso.mp4` lên Google Drive
2. Lấy direct link
3. Sửa code các trang để dùng link Google Drive thay vì `/trumso.mp4`
4. Push code lại

Ví dụ sửa code:
```jsx
<source src="https://drive.google.com/uc?export=download&id=YOUR_FILE_ID" type="video/mp4" />
```

Hoặc tốt hơn, upload lên Cloudflare R2/Amazon S3 để có URL trực tiếp.
