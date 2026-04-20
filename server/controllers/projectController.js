const Project = require('../models/Project');
const googleDriveService = require('../services/googleDriveService');
const Customer = require('../models/Customer');
const pool = require('../config/database');

// Đảm bảo bảng projects tồn tại
Project.ensureTable().catch(console.error);

// Lấy danh sách tất cả dự án
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.getAll();
    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách dự án:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách dự án' });
  }
};

// Tạo dự án mới
exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Vui lòng nhập tên dự án' });
    }

    // Tạo ngày tháng năm theo định dạng dd-mm-yyyy
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateFolderName = `${day}-${month}-${year}_${name.trim()}`;

    // Tạo folder trong Google Drive
    const projectFolder = await googleDriveService.createProjectFolder(dateFolderName);
    
    if (!projectFolder || !projectFolder.id) {
      return res.status(500).json({ error: 'Không thể tạo folder trong Google Drive' });
    }

    // Tạo subfolders "videos" và tạo file CSV rỗng
    const videosFolder = await googleDriveService.createFolderInParent('videos', projectFolder.id);
    const csvFile = await googleDriveService.createEmptyCSVFile('customers.csv', projectFolder.id);

    // Lưu vào database
    const project = await Project.create({
      name: name.trim(),
      folder_id: projectFolder.id,
      folder_path: projectFolder.name,
      date_folder_name: dateFolderName
    });

    res.json({
      success: true,
      message: 'Đã tạo dự án mới thành công',
      project: project,
      driveFolder: {
        projectFolderId: projectFolder.id,
        videosFolderId: videosFolder?.id,
        csvFileId: csvFile?.id
      }
    });
  } catch (error) {
    console.error('Lỗi tạo dự án:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo dự án: ' + error.message });
  }
};

// Lấy videos từ folder dự án
exports.getProjectVideos = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.getById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Không tìm thấy dự án' });
    }

    // Tìm folder videos trong project folder
    const videos = await googleDriveService.getVideosFromProjectFolder(project.folder_id);

    res.json({
      success: true,
      project: project,
      videos: videos
    });
  } catch (error) {
    console.error('Lỗi lấy videos dự án:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy videos' });
  }
};

// Xuất CSV cho dự án
exports.exportProjectCSV = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.getById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Không tìm thấy dự án' });
    }

    // Lấy tất cả khách hàng
    const customers = await Customer.getAll();
    
    const headers = ['ID', 'Họ tên', 'Trang phục', 'Số điện thoại', 'Ngày đăng ký', 'Trạng thái', 'Số video'];
    const rows = customers.map(c => [
      c.id,
      c.name,
      c.outfit,
      c.phone || '',
      new Date(c.created_at).toLocaleString('vi-VN'),
      c.status || 'Chờ chụp',
      c.video_path ? (Array.isArray(JSON.parse(c.video_path || '[]')) ? JSON.parse(c.video_path || '[]').length : 1) : 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Cập nhật file CSV trong Google Drive
    await googleDriveService.updateCSVFile(project.folder_id, 'customers.csv', csvContent);

    res.json({
      success: true,
      message: 'Đã xuất CSV thành công',
      csvData: csvContent
    });
  } catch (error) {
    console.error('Lỗi xuất CSV:', error);
    res.status(500).json({ error: 'Lỗi server khi xuất CSV' });
  }
};

// Sync videos từ dự án vào hệ thống
exports.syncProjectVideos = async (req, res) => {
  try {
    const { projectId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    const project = await Project.getById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Không tìm thấy dự án' });
    }

    // Lấy videos từ folder videos của dự án
    const videos = await googleDriveService.getVideosFromProjectFolder(project.folder_id);
    
    let linked = 0;
    let errors = [];

    for (const video of videos) {
      try {
        // Parse tên file: ID1_T1.mp4 hoặc ID1.mp4
        const match = video.name.match(/^ID(\d+)(?:_T(\d+))?\.mp4$/i);
        if (!match) {
          errors.push({ filename: video.name, error: 'Tên file không đúng định dạng ID{N}_T{N}.mp4' });
          continue;
        }

        const customerId = parseInt(match[1]);
        const takeNumber = match[2] || '1';

        // Kiểm tra customer tồn tại
        const customer = await Customer.getById(customerId);
        if (!customer) {
          errors.push({ filename: video.name, error: `Không tìm thấy khách hàng ID${customerId}` });
          continue;
        }

        // Tạo Google Drive URL
        const googleDriveUrl = `https://drive.google.com/uc?export=download&id=${video.id}`;
        
        // Thêm video vào customer
        await Customer.addVideo(customerId, googleDriveUrl);
        
        linked++;
      } catch (err) {
        errors.push({ filename: video.name, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Đã đồng bộ ${linked} video từ dự án ${project.name}`,
      linked,
      errors
    });
  } catch (error) {
    console.error('Lỗi đồng bộ videos:', error);
    res.status(500).json({ error: 'Lỗi server khi đồng bộ videos' });
  }
};
