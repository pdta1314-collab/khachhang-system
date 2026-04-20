const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const googleDriveService = require('../services/googleDriveService');

// Lấy danh sách folder từ Google Drive (admin only)
router.get('/folders', adminController.verifyToken, async (req, res) => {
  try {
    const folders = await googleDriveService.getProjectFolders();
    res.json({
      success: true,
      folders: folders
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách folder:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Không thể lấy danh sách folder từ Google Drive' 
    });
  }
});

// Sync video từ folder cụ thể (admin only)
router.post('/sync-folder', adminController.verifyToken, async (req, res) => {
  try {
    const { folderId } = req.body;

    if (!folderId) {
      return res.status(400).json({ error: 'Thiếu folderId' });
    }

    // Lấy videos từ folder
    const videos = await googleDriveService.getVideosFromProjectFolder(folderId);

    let linked = 0;
    let errors = [];
    const Customer = require('../models/Customer');

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
      message: `Đã đồng bộ ${linked} video từ folder`,
      linked,
      errors
    });
  } catch (error) {
    console.error('Lỗi sync folder:', error);
    res.status(500).json({ error: 'Lỗi khi sync video từ folder' });
  }
});

// Tạo CSV rỗng trong folder (admin only)
router.post('/create-csv', adminController.verifyToken, async (req, res) => {
  try {
    const { folderId, fileName } = req.body;

    if (!folderId) {
      return res.status(400).json({ error: 'Thiếu folderId' });
    }

    const csvName = fileName || 'customers.csv';

    const csv = await googleDriveService.createEmptyCSVFile(csvName, folderId);

    res.json({
      success: true,
      message: 'Đã tạo CSV thành công',
      csv: csv
    });
  } catch (error) {
    console.error('Lỗi tạo CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download CSV từ Google Drive (admin only)
router.get('/download-csv/:fileId', adminController.verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileData = await googleDriveService.downloadFileFromDrive(fileId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.send(fileData);
  } catch (error) {
    console.error('Lỗi download CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
