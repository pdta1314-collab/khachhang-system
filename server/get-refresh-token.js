const { google } = require('googleapis');
const readline = require('readline');
const http = require('http');

// Cấu hình OAuth2
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Tạo server local để nhận callback
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get('code');

  if (code) {
    // Exchange code for tokens
    oauth2Client.getToken(code, (err, tokens) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Lỗi khi lấy tokens: ' + err.message);
        console.error('❌ Lỗi:', err);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1 style="color: #4CAF50;">✅ Thành công!</h1>
          <p>Đã lấy được Refresh Token. Bạn có thể đóng trang này.</p>
          <h2>Refresh Token của bạn:</h2>
          <textarea style="width: 100%; height: 150px; padding: 10px; font-family: monospace; border: 1px solid #ddd; border-radius: 8px;">${tokens.refresh_token}</textarea>
          <p style="color: #666; margin-top: 20px;">Copy refresh token này và thêm vào biến môi trường GOOGLE_REFRESH_TOKEN</p>
        </body>
        </html>
      `);

      console.log('\n✅ Refresh Token:');
      console.log(tokens.refresh_token);
      console.log('\nCopy refresh token này và thêm vào biến môi trường GOOGLE_REFRESH_TOKEN\n');

      server.close();
    });
  } else {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Không tìm thấy code trong URL');
  }
});

// Bắt đầu server
const PORT = 3000;
server.listen(PORT, () => {
  console.log('🚀 Server OAuth2 đang chạy tại http://localhost:3000');
  console.log('📋 Đang chờ callback...\n');

  // Tạo URL để authorize
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Để lấy refresh token
    scope: ['https://www.googleapis.com/auth/drive'],
    prompt: 'consent' // Buộc hiển thị màn hình đồng ý để lấy refresh token
  });

  console.log('🔗 Mở URL sau trong trình duyệt để authorize:');
  console.log(authUrl);
  console.log('\nSau khi đăng nhập và cho phép truy cập, bạn sẽ được redirect về http://localhost:3000/oauth2callback');
});
