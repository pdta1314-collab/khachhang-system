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

// Lấy Project folder ID (folder "Project" lớn)
const getProjectFolderId = () => {
  return process.env.GOOGLE_DRIVE_PROJECT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
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

// Lấy danh sách các folder con trong Project folder (các dự án đã tạo)
const getProjectFolders = async () => {
  const apiKey = getApiKey();
  const projectFolderId = getProjectFolderId();

  if (!apiKey) {
    throw new Error('GOOGLE_DRIVE_API_KEY không được cấu hình');
  }

  if (!projectFolderId) {
    throw new Error('GOOGLE_DRIVE_PROJECT_FOLDER_ID không được cấu hình');
  }

  // Gọi API để lấy danh sách folders trong Project folder
  const url = `https://www.googleapis.com/drive/v3/files?q='${projectFolderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&key=${apiKey}&fields=files(id,name,createdTime,modifiedTime)&orderBy=name`;
  
  const response = await axios.get(url);
  console.log('Project folders found:', response.data.files?.length || 0);
  return response.data.files || [];
};

// Tạo folder mới trong Project folder
// Lưu ý: Cần OAuth2 token để tạo folder, API key chỉ đọc được
const createProjectFolder = async (folderName) => {
  // Vì API key chỉ đọc, không thể tạo folder
  // Trả về thông tin để người dùng tạo thủ công hoặc dùng service account
  console.log(`Cần tạo folder: ${folderName} trong Project folder`);
  
  // Tạm thời trả về mock data
  // Trong production, cần dùng OAuth2 hoặc Service Account
  return {
    id: `temp_${Date.now()}`,
    name: folderName,
    note: 'Folder cần được tạo thủ công trên Google Drive hoặc dùng OAuth2'
  };
};

// Tạo folder con trong một folder
const createFolderInParent = async (folderName, parentFolderId) => {
  console.log(`Cần tạo folder con: ${folderName} trong ${parentFolderId}`);
  return {
    id: `temp_${Date.now()}_${folderName}`,
    name: folderName
  };
};

// Tạo file CSV rỗng
const createEmptyCSVFile = async (fileName, parentFolderId) => {
  console.log(`Cần tạo file CSV: ${fileName} trong ${parentFolderId}`);
  return {
    id: `temp_${Date.now()}_csv`,
    name: fileName
  };
};

// Cập nhật file CSV
const updateCSVFile = async (folderId, fileName, content) => {
  console.log(`Cần cập nhật file ${fileName} trong ${folderId}`);
  return { success: true };
};

// Lấy videos từ folder videos của project
const getVideosFromProjectFolder = async (projectFolderId) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('GOOGLE_DRIVE_API_KEY không được cấu hình');
  }

  // Tìm folder "videos" trong project folder
  const findVideosFolderUrl = `https://www.googleapis.com/drive/v3/files?q='${projectFolderId}'+in+parents+and+name='videos'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&key=${apiKey}&fields=files(id,name)`;
  
  const folderResponse = await axios.get(findVideosFolderUrl);
  const videosFolder = folderResponse.data.files?.[0];

  if (!videosFolder) {
    return []; // Chưa có folder videos
  }

  // Lấy videos từ folder videos
  const url = `https://www.googleapis.com/drive/v3/files?q='${videosFolder.id}'+in+parents+and+mimeType+contains+'video/'+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,size,webContentLink)`;
  
  const response = await axios.get(url);
  return response.data.files || [];
};

module.exports = {
  getVideosFromFolder,
  downloadFile,
  getProjectFolders,
  createProjectFolder,
  createFolderInParent,
  createEmptyCSVFile,
  updateCSVFile,
  getVideosFromProjectFolder,
  getProjectFolderId,
};
