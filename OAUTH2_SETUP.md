# Hướng Dẫn Setup OAuth2 (Thay thế Service Account bị chặn)

Vì tổ chức của bạn đã chặn tạo Service Account key (`iam.disableServiceAccountKeyCreation`), chúng ta sẽ dùng **OAuth2 với Refresh Token**.

## Ưu/Nhược điểm so với Service Account

| | Service Account | OAuth2 + Refresh Token |
|---|---|---|
| **Tạo key** | ❌ Bị chặn bởi tổ chức | ✅ Cho phép |
| **Cần đăng nhập** | Không cần | Lần đầu cần đăng nhập |
| **Token hết hạn** | Không | Refresh token dùng vĩnh viễn |
| **Quyền hạn** | Theo role | Theo người dùng |

## Bước 1: Tạo OAuth2 Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Vào **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth client ID**
4. Chọn **Application type**: **Desktop app**
5. Điền **Name**: `Drive Desktop Client`
6. Click **Create**
7. **Download JSON** (tên file dạng `client_secret_xxx.json`)

## Bước 2: Kích hoạt Google Drive API

1. Vào **APIs & Services** → **Library**
2. Tìm **Google Drive API** → Click **Enable**

## Bước 3: Cấu hình Redirect URI (Quan trọng - Fix lỗi redirect_uri_mismatch)

**Lỗi `redirect_uri_mismatch` xảy ra khi URI chưa được thêm vào Google Cloud Console:**

1. Vào **APIs & Services** → **Credentials**
2. Tìm OAuth client ID bạn vừa tạo (`Drive Desktop Client`)
3. Click **Edit** (biểu tượng bút)
4. Trong mục **Authorized redirect URIs**, thêm:
   ```
   https://developers.google.com/oauthplayground
   ```
5. Click **Save**

> ⚠️ **Nếu dùng Node.js script** (Cách 2 bên dưới), thêm thêm:
> ```
> http://localhost:3000/oauth2callback
> ```

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

### Cách 2: Dùng Node.js script (Tự động)

Tạo file `get-refresh-token.js`:

```javascript
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = ['https://www.googleapis.com/auth/drive'];

const server = http.createServer(async (req, res) => {
  const query = url.parse(req.url, true).query;
  
  if (query.code) {
    try {
      const { tokens } = await oauth2Client.getToken(query.code);
      console.log('\n✅ Refresh Token:', tokens.refresh_token);
      console.log('\nLưu token này vào biến môi trường GOOGLE_REFRESH_TOKEN');
      
      res.end('Đã lấy token thành công! Bạn có thể đóng tab này.');
      server.close();
      process.exit(0);
    } catch (error) {
      console.error('Lỗi:', error);
      res.end('Lỗi: ' + error.message);
    }
  } else {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'  // Quan trọng: để luôn nhận refresh_token
    });
    
    res.writeHead(302, { Location: authUrl });
    res.end();
  }
});

console.log('Mở trình duyệt và truy cập: http://localhost:3000');
server.listen(3000);
```

Chạy: `node get-refresh-token.js`

## Bước 5: Cấu hình Biến Môi Trường

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

## Bước 6: Cập nhật Code

Tôi sẽ cập nhật `googleDriveService.js` để hỗ trợ OAuth2 với Refresh Token.

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
