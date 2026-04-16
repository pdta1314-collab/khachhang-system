const ngrok = require('ngrok');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function startServerWithNgrok() {
  console.log('🚀 Khởi động server với ngrok...\n');

  // Kiểm tra ngrok authtoken
  if (!process.env.NGROK_AUTHTOKEN) {
    console.log('⚠️  CHÚ Ý: Bạn cần thiết lập NGROK_AUTHTOKEN');
    console.log('1. Đăng ký tài khoản miễn phí tại: https://dashboard.ngrok.com/signup');
    console.log('2. Lấy authtoken từ: https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('3. Chạy lệnh: set NGROK_AUTHTOKEN=your_token_here (Windows)');
    console.log('   Hoặc: export NGROK_AUTHTOKEN=your_token_here (Mac/Linux)\n');
    console.log('Đang thử dùng ngrok mà không cần authtoken (giới hạn 2 giờ)...\n');
  }

  try {
    // Khởi động ngrok tunnel
    const connectOptions = {
      addr: 3000,
      proto: 'http',
    };
    
    // Chỉ thêm authtoken nếu có
    if (process.env.NGROK_AUTHTOKEN && process.env.NGROK_AUTHTOKEN !== '%NGROK_AUTHTOKEN%') {
      connectOptions.authtoken = process.env.NGROK_AUTHTOKEN;
      console.log('✅ Đang sử dụng authtoken từ biến môi trường\n');
    } else {
      console.log('⚠️  Chạy ngrok không authtoken (URL sẽ thay đổi mỗi lần chạy)\n');
    }
    
    const url = await ngrok.connect(connectOptions);

    console.log('✅ Ngrok tunnel đã khởi động!');
    console.log(`🔗 URL Public: ${url}`);
    console.log(`🔗 QR Code sẽ trỏ tới: ${url}\n`);

    // Cập nhật .env file với BASE_URL mới
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Thay thế hoặc thêm BASE_URL
    if (envContent.includes('BASE_URL=')) {
      envContent = envContent.replace(/BASE_URL=.*/g, `BASE_URL=${url}`);
    } else {
      envContent += `\nBASE_URL=${url}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Đã cập nhật BASE_URL trong .env\n');

    // Khởi động server Node.js
    console.log('🚀 Khởi động server...\n');
    const server = spawn('node', ['server/server.js'], {
      stdio: 'inherit',
      env: { ...process.env, BASE_URL: url }
    });

    server.on('close', (code) => {
      console.log(`\n❌ Server đã dừng với mã ${code}`);
      ngrok.disconnect();
      process.exit(code);
    });

    // Xử lý khi người dùng nhấn Ctrl+C
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Đang dừng server và ngrok...');
      await ngrok.disconnect();
      server.kill('SIGINT');
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n🛑 Đang dừng server và ngrok...');
      await ngrok.disconnect();
      server.kill('SIGTERM');
    });

  } catch (error) {
    console.error('❌ Lỗi khởi động ngrok:', error.message);
    console.log('\n💡 Thử chạy server không có ngrok:');
    console.log('   npm start');
    console.log('\n⚠️  Lưu ý: QR code sẽ không hoạt động với điện thoại nếu dùng localhost');
    process.exit(1);
  }
}

startServerWithNgrok();
