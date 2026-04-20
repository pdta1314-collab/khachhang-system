const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Hỏi user nhập thông tin
console.log('🔐 Lấy Google OAuth2 Refresh Token\n');

rl.question('Nhập CLIENT_ID: ', (clientId) => {
  rl.question('Nhập CLIENT_SECRET: ', (clientSecret) => {
    
    const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      REDIRECT_URI
    );
    
    const scopes = ['https://www.googleapis.com/auth/drive'];
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'  // Quan trọng: để luôn nhận refresh_token
    });
    
    console.log('\n1. Mở trình duyệt và truy cập URL sau:');
    console.log(authUrl);
    console.log('\n2. Đăng nhập bằng tài khoản Google của bạn');
    console.log('3. Copy authorization code từ URL redirect (sau khi đăng nhập)');
    
    rl.question('\nNhập authorization code: ', async (code) => {
      try {
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('\n✅ THÀNH CÔNG!\n');
        console.log('Refresh Token:', tokens.refresh_token);
        console.log('\n⚠️ Lưu token này vào biến môi trường GOOGLE_REFRESH_TOKEN');
        
        // Lưu vào file để tiện copy
        const envContent = `
# Google OAuth2
GOOGLE_CLIENT_ID=${clientId}
GOOGLE_CLIENT_SECRET=${clientSecret}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
`;
        fs.writeFileSync('.env.oauth2', envContent);
        console.log('\nĐã lưu vào file: .env.oauth2');
        
      } catch (error) {
        console.error('\n❌ Lỗi:', error.message);
        console.log('\nLưu ý: Authorization code chỉ dùng được 1 lần, cần lấy code mới');
      }
      
      rl.close();
      process.exit(0);
    });
  });
});
