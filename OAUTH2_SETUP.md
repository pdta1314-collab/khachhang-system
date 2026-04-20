# Hướng Dẫn Setup OAuth2 (Thay thế Service Account bị chặn)

Vì tổ chức của bạn đã chặn tạo Service Account key (`iam.disableServiceAccountKeyCreation`), chúng ta sẽ dùng **OAuth2 với Refresh Token**.

## Ưu/Nhược điểm so với Service Account

| | Service Account | OAuth2 + Refresh Token |
|---|---|---|
| **Tạo key** | ❌ Bị chặn bởi tổ chức | ✅ Cho phép |
| **Cần đăng nhập** | Không cần | Lần đầu cần đăng nhập |
| **Token hết hạn** | Không | Refresh token dùng vĩnh viễn |
| **Quyền hạn** | Theo role | Theo người dùng |

## Bước 1: Tạo OAuth2 Credentials (Web Application)

**⚠️ Quan trọng: Phải chọn Web application (không phải Desktop app)**

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Vào **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth client ID**
4. Chọn **Application type**: **Web application** ⭐
5. Điền **Name**: `Drive Web Client`
6. Trong **Authorized redirect URIs** → **Add URI**:
   ```
   https://developers.google.com/oauthplayground
   ```
   > Nếu dùng script Node.js, thêm thêm:
   > ```
   > http://localhost:3000/oauth2callback
   > ```
7. Click **Create**
8. **Download JSON** (tên file dạng `client_secret_xxx.json`)

## Bước 2: Cấu hình OAuth Consent Screen (Fix lỗi org_internal)

**Lỗi `org_internal` xảy ra khi ứng dụng bị giới hạn nội bộ tổ chức:**

1. Trong Google Cloud Console, vào **APIs & Services** → **OAuth consent screen**
2. Chọn **User Type**: **External** ⭐ (quan trọng: chọn External, không phải Internal)
3. Click **Create**
4. Điền thông tin:
   - **App name**: `Drive Manager`
   - **User support email**: Email của bạn
   - **Developer contact information**: Email của bạn
5. Click **Save and Continue**
6. Ở màn hình **Scopes**:
   - Click **Add or Remove Scopes**
   - Tìm và chọn: `https://www.googleapis.com/auth/drive`
   - Click **Update** → **Save and Continue**
7. Ở màn hình **Test users**:
   - Click **Add Users**
   - Thêm email Google của bạn
   - Click **Save and Continue**
8. Click **Back to Dashboard**

> ⚠️ Nếu tổ chức bắt buộc **Internal only**, bạn phải dùng **tài khoản Google cá nhân** (gmail.com) thay vì tài khoản tổ chức để tạo project này.

## Bước 3: Kích hoạt Google Drive API

1. Vào **APIs & Services** → **Library**
2. Tìm **Google Drive API** → Click **Enable**

## Bước 4: Lấy Refresh Token (Chỉ cần làm 1 lần)

### Cách 1: Dùng tool online (Dễ nhất)

1. Mở file `client_secret_xxx.json`, copy:
   - `client_id`
   - `client_secret`

2. Truy cập: [Google OAuth2 Playground](https://developers.google.com/oauthplayground)

3. Ở góc trên bên phải, click **Settings** (⚙️):
   - Check ✅ **Use your own OAuth credentials**
   - Dán `client_id` và `client_secret` vào
   - Click **Close**

4. Ở phần **Select & authorize APIs**:
   - Tìm và chọn `https://www.googleapis.com/auth/drive`
   - Click **Authorize APIs**

5. Đăng nhập bằng tài khoản Google của bạn (tài khoản có quyền truy cập Drive)

6. Click **Exchange authorization code for tokens**

7. Copy giá trị **Refresh token** (dài, bắt đầu bằng `1//`)

### Cách 2: Dùng script có sẵn (Dễ nhất) ⭐

1. Đảm bảo bạn đã có `client_id` và `client_secret` từ Bước 1

2. Đặt chúng vào biến môi trường hoặc sửa file `server/get-refresh-token.js`:
   ```bash
   # Thay YOUR_CLIENT_ID và YOUR_CLIENT_SECRET bằng giá trị của bạn
   export GOOGLE_CLIENT_ID=your_client_id
   export GOOGLE_CLIENT_SECRET=your_client_secret
   ```

3. Chạy script:
   ```bash
   cd server
   node get-refresh-token.js
   ```

4. Script sẽ:
   - Bắt đầu server local tại http://localhost:3000
   - Hiển thị URL để authorize
   - Mở URL trong trình duyệt
   - Đăng nhập và cho phép truy cập Google Drive
   - Tự động lấy refresh token và hiển thị trên trình duyệt

5. Copy refresh token hiển thị trên trình duyệt và thêm vào biến môi trường `GOOGLE_REFRESH_TOKEN`

> 💡 **Lưu ý:** Đảm bảo port 3000 không bị chiếm bởi ứng dụng khác. Nếu bị chiếm, sửa port trong script.

Tôi đã tạo sẵn file `get-refresh-token.js` trong project:

```bash
cd e:\KhachHang
node get-refresh-token.js
```

**Các bước thực hiện:**

1. Script sẽ hỏi **CLIENT_ID** và **CLIENT_SECRET** (lấy từ file `client_secret_xxx.json`)

2. Script hiển thị **URL** để đăng nhập Google. Copy URL và mở trong trình duyệt:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?...
   ```

3. Đăng nhập bằng tài khoản Google của bạn

4. **Lấy Authorization Code** ⭐:
   - Sau khi đăng nhập, trình duyệt sẽ redirect đến:
     ```
     http://localhost:3000/oauth2callback?code=4/0A...XXX
     ```
   - Copy đoạn code sau `code=` (VD: `4/0Ade...xyz`)
   - **Code chỉ dùng được 1 lần**, nếu lỗi phải lấy code mới

5. Dán code vào terminal, nhấn Enter

6. Script sẽ trả về **Refresh Token** và lưu vào file `.env.oauth2`

## Bước 4: Cấu hình Biến Môi Trường

Thêm vào `.env` (local) hoặc Railway Variables:

```
# OAuth2 Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REFRESH_TOKEN=your_refresh_token_here

# Giữ nguyên các biến cũ
GOOGLE_DRIVE_API_KEY=your_api_key_here
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_DRIVE_PROJECT_FOLDER_ID=your_project_folder_id
```

## Bước 5: Triển khai lên Railway

1. Push code lên GitHub
2. Railway Dashboard → Deploy
3. Thêm các biến môi trường từ Bước 4

## Lưu ý Quan Trọng

- **Refresh Token** chỉ hiển thị **1 lần duy nhất** khi đăng nhập lần đầu
- Nếu mất, bạn phải thu hồi quyền và lấy lại:
  1. Vào [Google Account Permissions](https://myaccount.google.com/permissions)
  2. Tìm và xóa quyền của ứng dụng
  3. Lặp lại Bước 4

- Refresh Token sẽ bị vô hiệu hóa nếu:
  - Người dùng đổi mật khẩu
  - Người dùng xóa quyền ứng dụng
  - Không sử dụng trong 6 tháng
