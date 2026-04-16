const Customer = require('../models/Customer');
const CustomerImage = require('../models/CustomerImage');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer cho upload video
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận file video
    const allowedTypes = /mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('video/');
    
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file video (MP4, MOV, AVI, MKV, WEBM)'));
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  }
});

// Tạo khách hàng mới
exports.createCustomer = async (req, res) => {
  try {
    const { name, outfit } = req.body;
    
    if (!name || !outfit) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ tên và trang phục' });
    }

    const customer = await Customer.create(name, outfit);
    
    // Tạo QR code
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const qrUrl = `${baseUrl}/video/${customer.uniqueId}`;
    const qrCode = await QRCode.toDataURL(qrUrl);
    
    res.json({
      success: true,
      customer: {
        id: customer.id,
        uniqueId: customer.uniqueId,
        name,
        outfit
      },
      qrCode,
      downloadUrl: qrUrl
    });
  } catch (error) {
    console.error('Lỗi tạo khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo khách hàng' });
  }
};

// Lấy thông tin khách hàng theo ID
exports.getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.getById(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const videoUrl = customer.video_path ? `${baseUrl}/uploads/${path.basename(customer.video_path)}` : null;

    res.json({
      success: true,
      customer: {
        id: customer.id,
        uniqueId: customer.uniqueId,
        name: customer.name,
        outfit: customer.outfit,
        createdAt: customer.created_at,
        hasVideo: !!customer.video_path,
        videoUrl
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy thông tin khách hàng theo unique ID (cho trang download)
exports.getCustomerByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const customer = await Customer.getByUniqueId(uniqueId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const videoUrl = customer.video_path ? `${baseUrl}/uploads/${path.basename(customer.video_path)}` : null;

    res.json({
      success: true,
      customer: {
        id: customer.id,
        uniqueId: customer.uniqueId,
        name: customer.name,
        outfit: customer.outfit,
        createdAt: customer.created_at,
        hasVideo: !!customer.video_path,
        videoUrl
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy danh sách tất cả khách hàng (admin)
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.getAll();
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const customersWithUrls = customers.map(c => ({
      ...c,
      videoUrl: c.video_path ? `${baseUrl}/uploads/${path.basename(c.video_path)}` : null
    }));

    res.json({
      success: true,
      customers: customersWithUrls
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Upload video cho khách hàng
exports.uploadVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file video' });
    }

    // Xóa video cũ nếu có
    const customer = await Customer.getById(id);
    if (customer && customer.video_path && fs.existsSync(customer.video_path)) {
      fs.unlinkSync(customer.video_path);
    }

    // Cập nhật đường dẫn video trong database
    await Customer.updateVideo(id, req.file.path);

    res.json({
      success: true,
      message: 'Upload video thành công',
      videoPath: req.file.filename
    });
  } catch (error) {
    console.error('Lỗi upload video:', error);
    res.status(500).json({ error: 'Lỗi server khi upload video' });
  }
};

// Xóa video của khách hàng
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.getById(id);
    if (customer && customer.video_path && fs.existsSync(customer.video_path)) {
      fs.unlinkSync(customer.video_path);
    }

    await Customer.deleteVideo(id);

    res.json({
      success: true,
      message: 'Đã xóa video thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa video:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa video' });
  }
};

// Xóa khách hàng
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.getById(id);
    if (customer && customer.video_path && fs.existsSync(customer.video_path)) {
      fs.unlinkSync(customer.video_path);
    }

    await Customer.delete(id);

    res.json({
      success: true,
      message: 'Đã xóa khách hàng thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa khách hàng' });
  }
};

// Cấu hình multer cho upload ảnh
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận file ảnh
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('image/');
    
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPEG, JPG, PNG, GIF, WEBP, BMP)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max cho ảnh
  }
});

// Upload nhiều ảnh cho khách hàng
exports.uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Vui lòng chọn ít nhất một file ảnh' });
    }

    const uploadedImages = [];
    
    for (const file of req.files) {
      const result = await CustomerImage.create(id, file.path);
      uploadedImages.push({
        id: result.id,
        path: file.filename
      });
    }

    res.json({
      success: true,
      message: `Đã upload ${req.files.length} ảnh thành công`,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Lỗi upload ảnh:', error);
    res.status(500).json({ error: 'Lỗi server khi upload ảnh' });
  }
};

// Lấy danh sách ảnh của khách hàng
exports.getImages = async (req, res) => {
  try {
    const { id } = req.params;
    const images = await CustomerImage.getByCustomerId(id);
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const imagesWithUrls = images.map(img => ({
      id: img.id,
      url: `${baseUrl}/uploads/images/${path.basename(img.image_path)}`,
      createdAt: img.created_at
    }));

    res.json({
      success: true,
      images: imagesWithUrls
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách ảnh:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Xóa ảnh
exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    
    // Lấy thông tin ảnh để xóa file
    const sql = 'SELECT image_path FROM customer_images WHERE id = ?';
    const db = require('../config/database');
    
    db.get(sql, [imageId], (err, row) => {
      if (err) {
        console.error('Lỗi lấy thông tin ảnh:', err);
        return res.status(500).json({ error: 'Lỗi server' });
      }
      
      if (row && row.image_path && fs.existsSync(row.image_path)) {
        fs.unlinkSync(row.image_path);
      }
      
      CustomerImage.delete(imageId)
        .then(() => {
          res.json({
            success: true,
            message: 'Đã xóa ảnh thành công'
          });
        })
        .catch(err => {
          console.error('Lỗi xóa ảnh:', err);
          res.status(500).json({ error: 'Lỗi server khi xóa ảnh' });
        });
    });
  } catch (error) {
    console.error('Lỗi xóa ảnh:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa ảnh' });
  }
};

module.exports.uploadMiddleware = upload;
module.exports.uploadImageMiddleware = uploadImage;
