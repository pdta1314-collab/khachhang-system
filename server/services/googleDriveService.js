const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Lấy API Key từ biến môi trường
const getApiKey = () => {
  return process.env.GOOGLE_DRIVE_API_KEY;
};

// Lấy folder ID từ biến môi trường
const getFolderId = () => {
  return process.env.GOOGLE_DRIVE_FOLDER_ID;
};

// Lấy danh sách video từ folder public
const getVideosFromFolder = async () => {
  const apiKey = getApiKey();
  const folderId = getFolderId();

  if (!apiKey) {
    throw new Error('GOOGLE_DRIVE_API_KEY không được cấu hình');
  }

  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID không được cấu hình');
  }

  // Gọi API để lấy danh sách files trong folder
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'video/'+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,size,webContentLink)`;
  
  const response = await axios.get(url);
  console.log('Google Drive API response:', response.data);
  console.log('Files found:', response.data.files?.length || 0);
  return response.data.files || [];
};

// Download file từ Google Drive (public file)
const downloadFile = async (fileId, destinationPath) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('GOOGLE_DRIVE_API_KEY không được cấu hình');
  }

  // Gọi API để download file
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
  
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
  });

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
