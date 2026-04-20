const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// ==================== SERVICE ACCOUNT AUTH ====================
let driveClient = null;

// Khởi tạo Google Drive client với Service Account
const getDriveClient = () => {
  if (driveClient) return driveClient;
  
  try {
    // Kiểm tra xem có Service Account key không
    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './service-account-key.json';
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
    
    let auth;
    
    if (keyJson) {
      // Sử dụng key từ biến môi trường (cho Railway deployment)
      const credentials = JSON.parse(keyJson);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
      });
    } else if (fs.existsSync(keyFile)) {
      // Sử dụng file key (cho development local)
      auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: ['https://www.googleapis.com/auth/drive']
      });
    } else {
      console.log('⚠️ Service Account chưa được cấu hình. Một số chức năng sẽ bị hạn chế.');
      return null;
    }
    
    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  } catch (error) {
    console.error('❌ Lỗi khởi tạo Service Account:', error.message);
    return null;
  }
};

// ==================== API KEY AUTH (Read-only) ====================
const getApiKey = () => {
  return process.env.GOOGLE_DRIVE_API_KEY;
};

const getFolderId = () => {
  return process.env.GOOGLE_DRIVE_FOLDER_ID;
};

const getProjectFolderId = () => {
  return process.env.GOOGLE_DRIVE_PROJECT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
};

// ==================== READ OPERATIONS (API Key) ====================

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

  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'video/'+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,size,webContentLink)`;
  
  const response = await axios.get(url);
  console.log('Google Drive API response:', response.data);
  console.log('Files found:', response.data.files?.length || 0);
  return response.data.files || [];
};

// Lấy danh sách các folder con trong Project folder
const getProjectFolders = async () => {
  const apiKey = getApiKey();
  const projectFolderId = getProjectFolderId();

  if (!apiKey || !projectFolderId) {
    console.log('⚠️ API Key hoặc Project Folder ID chưa cấu hình');
    return [];
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files?q='${projectFolderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&key=${apiKey}&fields=files(id,name,createdTime,modifiedTime)&orderBy=name`;
    
    const response = await axios.get(url);
    console.log('Project folders found:', response.data.files?.length || 0);
    return response.data.files || [];
  } catch (error) {
    console.error('Lỗi lấy danh sách folders:', error.message);
    return [];
  }
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
    return [];
  }

  const url = `https://www.googleapis.com/drive/v3/files?q='${videosFolder.id}'+in+parents+and+mimeType+contains+'video/'+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,size,webContentLink)`;
  
  const response = await axios.get(url);
  return response.data.files || [];
};

// Download file từ Google Drive (public file)
const downloadFile = async (fileId, destinationPath) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('GOOGLE_DRIVE_API_KEY không được cấu hình');
  }

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

// ==================== WRITE OPERATIONS (Service Account) ====================

// Tạo folder mới trong Project folder (dùng Service Account)
const createProjectFolder = async (folderName) => {
  const drive = getDriveClient();
  const projectFolderId = getProjectFolderId();
  
  if (!drive) {
    console.log('⚠️ Service Account chưa cấu hình. Trả về mock data.');
    return {
      id: `temp_${Date.now()}`,
      name: folderName,
      note: 'Service Account chưa cấu hình - Folder cần tạo thủ công'
    };
  }
  
  if (!projectFolderId) {
    throw new Error('GOOGLE_DRIVE_PROJECT_FOLDER_ID không được cấu hình');
  }

  try {
    // Tạo folder trong Project folder
    const response = await drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [projectFolderId]
      },
      fields: 'id,name,createdTime'
    });
    
    console.log('✅ Đã tạo folder:', response.data.name, 'ID:', response.data.id);
    return {
      id: response.data.id,
      name: response.data.name,
      createdTime: response.data.createdTime
    };
  } catch (error) {
    console.error('❌ Lỗi tạo folder:', error.message);
    throw new Error('Không thể tạo folder trên Google Drive: ' + error.message);
  }
};

// Tạo folder con trong một folder (dùng Service Account)
const createFolderInParent = async (folderName, parentFolderId) => {
  const drive = getDriveClient();
  
  if (!drive) {
    console.log('⚠️ Service Account chưa cấu hình. Trả về mock data.');
    return {
      id: `temp_${Date.now()}_${folderName}`,
      name: folderName
    };
  }

  try {
    const response = await drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      },
      fields: 'id,name'
    });
    
    console.log('✅ Đã tạo folder con:', response.data.name, 'ID:', response.data.id);
    return {
      id: response.data.id,
      name: response.data.name
    };
  } catch (error) {
    console.error('❌ Lỗi tạo folder con:', error.message);
    throw new Error('Không thể tạo folder con: ' + error.message);
  }
};

// Tạo file CSV rỗng (dùng Service Account)
const createEmptyCSVFile = async (fileName, parentFolderId) => {
  const drive = getDriveClient();
  
  if (!drive) {
    console.log('⚠️ Service Account chưa cấu hình. Trả về mock data.');
    return {
      id: `temp_${Date.now()}_csv`,
      name: fileName
    };
  }

  try {
    const csvContent = 'ID,Họ tên,Trang phục,Số điện thoại,Ngày đăng ký,Trạng thái\n';
    
    const response = await drive.files.create({
      resource: {
        name: fileName,
        mimeType: 'text/csv',
        parents: [parentFolderId]
      },
      media: {
        mimeType: 'text/csv',
        body: csvContent
      },
      fields: 'id,name'
    });
    
    console.log('✅ Đã tạo file CSV:', response.data.name, 'ID:', response.data.id);
    return {
      id: response.data.id,
      name: response.data.name
    };
  } catch (error) {
    console.error('❌ Lỗi tạo file CSV:', error.message);
    throw new Error('Không thể tạo file CSV: ' + error.message);
  }
};

// Cập nhật file CSV (dùng Service Account)
const updateCSVFile = async (folderId, fileName, content) => {
  const drive = getDriveClient();
  
  if (!drive) {
    console.log('⚠️ Service Account chưa cấu hình. Bỏ qua cập nhật CSV.');
    return { success: false, note: 'Service Account chưa cấu hình' };
  }

  try {
    // Tìm file CSV trong folder
    const searchResponse = await drive.files.list({
      q: `'${folderId}' in parents and name='${fileName}' and mimeType='text/csv' and trashed=false`,
      fields: 'files(id,name)'
    });
    
    const existingFile = searchResponse.data.files?.[0];
    
    if (existingFile) {
      // Cập nhật file hiện có
      await drive.files.update({
        fileId: existingFile.id,
        media: {
          mimeType: 'text/csv',
          body: '\ufeff' + content
        }
      });
      console.log('✅ Đã cập nhật file CSV:', fileName);
    } else {
      // Tạo file mới
      await drive.files.create({
        resource: {
          name: fileName,
          mimeType: 'text/csv',
          parents: [folderId]
        },
        media: {
          mimeType: 'text/csv',
          body: '\ufeff' + content
        }
      });
      console.log('✅ Đã tạo file CSV mới:', fileName);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi cập nhật file CSV:', error.message);
    return { success: false, error: error.message };
  }
};

// ==================== MODULE EXPORTS ====================
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
  getDriveClient,
};
