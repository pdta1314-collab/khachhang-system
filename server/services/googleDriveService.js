const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Khởi tạo Google Drive API
const getDriveClient = () => {
  let credentials;
  
  // Đọc credentials từ biến môi trường
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  } else {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY không được cấu hình');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
};

// Lấy folder ID từ biến môi trường
const getFolderId = () => {
  return process.env.GOOGLE_DRIVE_FOLDER_ID;
};

// Lấy danh sách video từ folder
const getVideosFromFolder = async () => {
  const drive = getDriveClient();
  const folderId = getFolderId();

  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID không được cấu hình');
  }

  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
    fields: 'files(id, name, mimeType, size)',
  });

  return response.data.files || [];
};

// Download file từ Google Drive
const downloadFile = async (fileId, destinationPath) => {
  const drive = getDriveClient();

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(destinationPath);
    
    response.data
      .on('end', () => {
        resolve(destinationPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .pipe(dest);
  });
};

module.exports = {
  getVideosFromFolder,
  downloadFile,
};
