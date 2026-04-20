const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const adminController = require('../controllers/adminController');

// Lấy danh sách tất cả dự án (cần authentication)
router.get('/', adminController.verifyToken, projectController.getAllProjects);

// Tạo dự án mới (cần authentication)
router.post('/', adminController.verifyToken, projectController.createProject);

// Lấy videos từ dự án (cần authentication)
router.get('/:projectId/videos', adminController.verifyToken, projectController.getProjectVideos);

// Xuất CSV cho dự án (cần authentication)
router.post('/:projectId/export-csv', adminController.verifyToken, projectController.exportProjectCSV);

// Đồng bộ videos từ dự án vào hệ thống (cần authentication)
router.post('/:projectId/sync', adminController.verifyToken, projectController.syncProjectVideos);

module.exports = router;
