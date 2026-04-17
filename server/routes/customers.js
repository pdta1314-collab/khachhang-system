const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const adminController = require('../controllers/adminController');

// Public routes
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomer);
router.get('/unique/:uniqueId', customerController.getCustomerByUniqueId);

// Protected routes (cần authentication)
router.get('/', adminController.verifyToken, customerController.getAllCustomers);
router.get('/latest/list', adminController.verifyToken, customerController.getLatestCustomers);

// Batch video upload (admin only) - upload nhiều video theo tên file ID
router.post('/videos/batch', adminController.verifyToken, customerController.uploadMiddleware.array('videos', 100), customerController.batchUploadVideos);

// Batch video upload từ folder (admin only) - scan folder và upload video theo ID
router.post('/videos/batch-folder', adminController.verifyToken, customerController.batchUploadFromFolder);

// Video routes (admin only)
router.post('/:id/video', adminController.verifyToken, customerController.uploadMiddleware.single('video'), customerController.uploadVideo);
router.delete('/:id/video', adminController.verifyToken, customerController.deleteVideo);

// Image routes (admin only) - upload nhiều ảnh cùng lúc
router.post('/:id/images', adminController.verifyToken, customerController.uploadImageMiddleware.array('images', 50), customerController.uploadImages);
router.get('/:id/images', adminController.verifyToken, customerController.getImages);
router.delete('/images/:imageId', adminController.verifyToken, customerController.deleteImage);

// Delete customer (admin only)
router.delete('/:id', adminController.verifyToken, customerController.deleteCustomer);

module.exports = router;
