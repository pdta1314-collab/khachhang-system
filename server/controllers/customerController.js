const Customer = require('../models/Customer');
const CustomerImage = require('../models/CustomerImage');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const googleDriveService = require('../services/googleDriveService');

// URL công khai (Railway)
const BASE_URL = 'https://web-production-e5a3a.up.railway.app';

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
    const { name, phone, email } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ tên và số điện thoại' });
    }

    // Kiểm tra có khách đang chụp không
    const currentlyShooting = await Customer.getCurrentlyShooting();
    const waitingList = await Customer.getWaitingList();
    
    let status = 'Đang chờ';
    
    if (!currentlyShooting) {
      // Không có ai đang chụp -> khách mới là người đang chụp
      status = 'Đang chụp';
    }

    const customer = await Customer.create(name, phone, email);
    
    // Cập nhật status
    await Customer.updateStatus(customer.id, status);
    customer.status = status;
    
    // Nếu có người đang chụp và khách mới là người thứ 2+ trong hàng chờ
    // thì người đang chụp chuyển sang "Đã chụp xong", người chờ đầu tiên chuyển sang "Đang chụp"
    if (currentlyShooting && waitingList.length >= 1) {
      // Người đang chụp chuyển sang "Đã chụp xong"
      await Customer.updateStatus(currentlyShooting.id, 'Đã chụp xong');
      // Người đầu tiên trong hàng chờ chuyển sang "Đang chụp"
      if (waitingList.length > 0) {
        await Customer.updateStatus(waitingList[0].id, 'Đang chụp');
      }
    }
    
    // Tạo QR code
    const baseUrl = BASE_URL;
    console.log('Using BASE_URL:', baseUrl);
    
    const qrUrl = `${baseUrl}/video/${customer.uniqueId}`;
    const qrCode = await QRCode.toDataURL(qrUrl);
    
    res.json({
      success: true,
      customer: {
        id: customer.id,
        uniqueId: customer.uniqueId,
        name,
        phone,
        email,
        status
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

    const baseUrl = BASE_URL;
    const videoUrl = customer.video_path ? `${baseUrl}/${customer.video_path}` : null;

    res.json({
      success: true,
      customer: {
        id: customer.id,
        uniqueId: customer.uniqueId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        status: customer.status,
        registrationTime: customer.registration_time,
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

    const baseUrl = BASE_URL;
    const videoUrl = customer.video_path ? `${baseUrl}/${customer.video_path}` : null;
    console.log('getCustomerByUniqueId - videoUrl:', videoUrl, 'video_path:', customer.video_path, 'BASE_URL:', baseUrl);

    res.json({
      success: true,
      customer: {
        id: customer.id,
        uniqueId: customer.uniqueId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        status: customer.status,
        registrationTime: customer.registration_time,
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
    
    const baseUrl = BASE_URL;
    const customersWithUrls = customers.map(c => ({
      ...c,
      videoUrl: c.video_path ? `${baseUrl}/uploads/${path.basename(c.video_path)}` : null,
      hasVideo: !!c.video_path,
      hasImages: c.image_count > 0
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

    // Reset sequence để gapless ID
    const pool = require('../config/database');
    try {
      const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM customers');
      const maxId = parseInt(maxIdResult.rows[0].max_id);
      await pool.query(`SELECT setval('customers_id_seq', ${maxId + 1}, false)`);
    } catch (seqErr) {
      console.log('Reset sequence info:', seqErr.message);
    }

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
    
    const baseUrl = BASE_URL;
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
    const pool = require('../config/database');
    const result = await pool.query('SELECT image_path FROM customer_images WHERE id = $1', [imageId]);
    const row = result.rows[0];
    
    if (row && row.image_path && fs.existsSync(row.image_path)) {
      fs.unlinkSync(row.image_path);
    }
    
    await CustomerImage.delete(imageId);
    res.json({
      success: true,
      message: 'Đã xóa ảnh thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa ảnh:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa ảnh' });
  }
};

// Lấy danh sách khách hàng mới nhất (cho auto-refresh)
exports.getLatestCustomers = async (req, res) => {
  try {
    const { since } = req.query;
    const customers = await Customer.getAll();
    
    // Lọc khách hàng mới hơn thời gian 'since'
    let latestCustomers = customers;
    if (since) {
      const sinceTime = new Date(since).getTime();
      latestCustomers = customers.filter(c => new Date(c.registration_time).getTime() > sinceTime);
    }
    
    const baseUrl = BASE_URL;
    const customersWithUrls = latestCustomers.map(c => ({
      ...c,
      videoUrl: c.video_path ? `${baseUrl}/uploads/${path.basename(c.video_path)}` : null,
      hasVideo: !!c.video_path,
      hasImages: c.image_count > 0
    }));

    res.json({
      success: true,
      customers: customersWithUrls,
      currentlyShooting: await Customer.getCurrentlyShooting(),
      waitingList: await Customer.getWaitingList()
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng mới:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Batch upload video từ thư mục (theo ID khách hàng)
exports.batchUploadVideos = async (req, res) => {
  try {
    const uploadedFiles = [];
    const errors = [];
    
    // Lấy tất cả files từ request
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Không có file nào được upload' });
    }
    
    // Xử lý từng file
    for (const file of req.files) {
      try {
        // Parse filename: ID1_T1.mp4, ID1_T2.mp4, ID2.mp4, etc.
        const filename = file.originalname;
        const match = filename.match(/^ID(\d+)(?:_T(\d+))?\.\w+$/i);
        
        if (!match) {
          errors.push({ filename, error: 'Tên file không đúng định dạng (VD: ID1.mp4, ID1_T1.mp4)' });
          continue;
        }
        
        const customerId = parseInt(match[1]);
        const takeNumber = match[2] || '1';
        
        // Kiểm tra khách hàng tồn tại
        const customer = await Customer.getById(customerId);
        if (!customer) {
          errors.push({ filename, error: `Không tìm thấy khách hàng ID ${customerId}` });
          continue;
        }
        
        // Tạo thư mục cho khách hàng nếu chưa có
        const customerFolder = path.join(__dirname, '../uploads', `customer_${customerId}`);
        if (!fs.existsSync(customerFolder)) {
          fs.mkdirSync(customerFolder, { recursive: true });
        }
        
        // Di chuyển file vào thư mục khách hàng
        const newFilename = `take_${takeNumber}_${Date.now()}${path.extname(filename)}`;
        const newPath = path.join(customerFolder, newFilename);
        
        fs.renameSync(file.path, newPath);
        
        // Cập nhật video_path (nếu là take đầu tiên hoặc muốn lưu tất cả)
        const relativePath = `uploads/customer_${customerId}/${newFilename}`;
        await Customer.updateVideo(customerId, relativePath);
        
        uploadedFiles.push({
          customerId,
          customerName: customer.name,
          filename: newFilename,
          takeNumber
        });
        
      } catch (err) {
        errors.push({ filename: file.originalname, error: err.message });
      }
    }
    
    res.json({
      success: true,
      uploaded: uploadedFiles.length,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Lỗi batch upload videos:', error);
    res.status(500).json({ error: 'Lỗi server khi upload videos' });
  }
};

// Batch upload video từ folder
exports.batchUploadFromFolder = async (req, res) => {
  try {
    const { folderPath } = req.body;
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đường dẫn thư mục' });
    }

    // Kiểm tra thư mục tồn tại
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: `Thư mục không tồn tại: ${folderPath}` });
    }

    // Scan tất cả file video trong thư mục
    const files = fs.readdirSync(folderPath);
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const videoFiles = files.filter(file => 
      videoExtensions.includes(path.extname(file).toLowerCase())
    );

    let uploadedCount = 0;
    const errors = [];
    const uploadedFiles = [];

    for (const filename of videoFiles) {
      try {
        // Parse filename: ID1_T1.mp4, ID1_T2.mp4, ID2.mp4, etc.
        const match = filename.match(/^ID(\d+)(?:_T(\d+))?\.\w+$/i);
        
        if (!match) {
          errors.push({ filename, error: 'Tên file không đúng định dạng (VD: ID1.mp4, ID1_T1.mp4)' });
          continue;
        }
        
        const customerId = parseInt(match[1]);
        const takeNumber = match[2] || '1';
        
        // Kiểm tra khách hàng tồn tại
        const customer = await Customer.getById(customerId);
        if (!customer) {
          errors.push({ filename, error: `Không tìm thấy khách hàng ID ${customerId}` });
          continue;
        }
        
        // Tạo thư mục cho khách hàng nếu chưa có
        const customerFolder = path.join(__dirname, '../uploads', `customer_${customerId}`);
        if (!fs.existsSync(customerFolder)) {
          fs.mkdirSync(customerFolder, { recursive: true });
        }
        
        // Copy file vào thư mục khách hàng
        const sourcePath = path.join(folderPath, filename);
        const newFilename = `take_${takeNumber}_${Date.now()}${path.extname(filename)}`;
        const newPath = path.join(customerFolder, newFilename);
        
        fs.copyFileSync(sourcePath, newPath);
        
        // Cập nhật video_path
        const relativePath = `uploads/customer_${customerId}/${newFilename}`;
        await Customer.updateVideo(customerId, relativePath);
        
        uploadedCount++;
        uploadedFiles.push({
          customerId,
          customerName: customer.name,
          filename: newFilename,
          takeNumber
        });
        
      } catch (err) {
        errors.push({ filename, error: err.message });
      }
    }
    
    res.json({
      success: true,
      uploaded: uploadedCount,
      files: uploadedFiles,
      errors
    });
  } catch (error) {
    console.error('Lỗi batch upload từ folder:', error);
    res.status(500).json({ error: 'Lỗi server khi upload video từ folder' });
  }
};

// Scan và upload video từ thư mục videos
exports.scanVideosFolder = async (req, res) => {
  try {
    // Thư mục videos để ném video vào
    const videosFolderPath = path.join(__dirname, '../uploads/videos');
    
    // Kiểm tra thư mục tồn tại, nếu không thì tạo
    if (!fs.existsSync(videosFolderPath)) {
      fs.mkdirSync(videosFolderPath, { recursive: true });
      return res.json({
        success: true,
        message: 'Đã tạo thư mục uploads/videos. Vui lòng ném video vào thư mục này.',
        uploaded: 0,
        files: [],
        errors: []
      });
    }

    // Scan tất cả file video trong thư mục
    const files = fs.readdirSync(videosFolderPath);
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const videoFiles = files.filter(file => 
      videoExtensions.includes(path.extname(file).toLowerCase())
    );

    if (videoFiles.length === 0) {
      return res.json({
        success: true,
        message: 'Thư mục uploads/videos không có file video nào.',
        uploaded: 0,
        files: [],
        errors: []
      });
    }

    let uploadedCount = 0;
    const errors = [];
    const uploadedFiles = [];

    for (const filename of videoFiles) {
      try {
        // Parse filename: ID1_T1.mp4, ID1_T2.mp4, ID2.mp4, etc.
        const match = filename.match(/^ID(\d+)(?:_T(\d+))?\.\w+$/i);
        
        if (!match) {
          errors.push({ filename, error: 'Tên file không đúng định dạng (VD: ID1.mp4, ID1_T1.mp4)' });
          continue;
        }
        
        const customerId = parseInt(match[1]);
        const takeNumber = match[2] || '1';
        
        // Kiểm tra khách hàng tồn tại
        const customer = await Customer.getById(customerId);
        if (!customer) {
          errors.push({ filename, error: `Không tìm thấy khách hàng ID ${customerId}` });
          continue;
        }
        
        // Tạo thư mục cho khách hàng nếu chưa có
        const customerFolder = path.join(__dirname, '../uploads', `customer_${customerId}`);
        if (!fs.existsSync(customerFolder)) {
          fs.mkdirSync(customerFolder, { recursive: true });
        }
        
        // Di chuyển file vào thư mục khách hàng
        const sourcePath = path.join(videosFolderPath, filename);
        const newFilename = `take_${takeNumber}_${Date.now()}${path.extname(filename)}`;
        const newPath = path.join(customerFolder, newFilename);
        
        fs.renameSync(sourcePath, newPath);
        
        // Cập nhật video_path
        const relativePath = `uploads/customer_${customerId}/${newFilename}`;
        await Customer.updateVideo(customerId, relativePath);
        
        uploadedCount++;
        uploadedFiles.push({
          customerId,
          customerName: customer.name,
          filename: newFilename,
          takeNumber
        });
        
      } catch (err) {
        errors.push({ filename, error: err.message });
      }
    }
    
    res.json({
      success: true,
      message: uploadedCount > 0 
        ? `Đã upload ${uploadedCount} video thành công từ thư mục uploads/videos`
        : 'Không có video nào được upload',
      uploaded: uploadedCount,
      files: uploadedFiles,
      errors
    });
  } catch (error) {
    console.error('Lỗi scan và upload từ thư mục videos:', error);
    res.status(500).json({ error: 'Lỗi server khi scan thư mục videos' });
  }
};

// Scan và upload video từ Google Drive
exports.scanGoogleDriveVideos = async (req, res) => {
  try {
    // Lấy danh sách video từ Google Drive
    const driveFiles = await googleDriveService.getVideosFromFolder();

    if (driveFiles.length === 0) {
      return res.json({
        success: true,
        message: 'Folder Google Drive không có file video nào.',
        uploaded: 0,
        files: [],
        errors: []
      });
    }

    let uploadedCount = 0;
    const errors = [];
    const uploadedFiles = [];

    // Tạo thư mục temp để download
    const tempDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    for (const file of driveFiles) {
      try {
        // Parse filename: ID1_T1.mp4, ID1_T2.mp4, ID2.mp4, etc.
        const match = file.name.match(/^ID(\d+)(?:_T(\d+))?\.\w+$/i);
        
        if (!match) {
          errors.push({ filename: file.name, error: 'Tên file không đúng định dạng (VD: ID1.mp4, ID1_T1.mp4)' });
          continue;
        }
        
        const customerId = parseInt(match[1]);
        const takeNumber = match[2] || '1';
        
        // Kiểm tra khách hàng tồn tại
        const customer = await Customer.getById(customerId);
        if (!customer) {
          errors.push({ filename: file.name, error: `Không tìm thấy khách hàng ID ${customerId}` });
          continue;
        }
        
        // Download file từ Google Drive
        const tempPath = path.join(tempDir, file.name);
        await googleDriveService.downloadFile(file.id, tempPath);
        
        // Tạo thư mục cho khách hàng nếu chưa có
        const customerFolder = path.join(__dirname, '../uploads', `customer_${customerId}`);
        if (!fs.existsSync(customerFolder)) {
          fs.mkdirSync(customerFolder, { recursive: true });
        }
        
        // Di chuyển file vào thư mục khách hàng
        const newFilename = `take_${takeNumber}_${Date.now()}${path.extname(file.name)}`;
        const newPath = path.join(customerFolder, newFilename);
        
        fs.renameSync(tempPath, newPath);
        
        // Cập nhật video_path
        const relativePath = `uploads/customer_${customerId}/${newFilename}`;
        await Customer.updateVideo(customerId, relativePath);
        
        uploadedCount++;
        uploadedFiles.push({
          customerId,
          customerName: customer.name,
          filename: newFilename,
          takeNumber
        });
        
      } catch (err) {
        errors.push({ filename: file.name, error: err.message });
      }
    }
    
    // Xóa file temp
    const tempFiles = fs.readdirSync(tempDir);
    tempFiles.forEach(file => {
      fs.unlinkSync(path.join(tempDir, file));
    });
    
    res.json({
      success: true,
      message: uploadedCount > 0 
        ? `Đã upload ${uploadedCount} video thành công từ Google Drive`
        : 'Không có video nào được upload',
      uploaded: uploadedCount,
      files: uploadedFiles,
      errors
    });
  } catch (error) {
    console.error('Lỗi scan và upload từ Google Drive:', error);
    res.status(500).json({ error: 'Lỗi server khi scan Google Drive: ' + error.message });
  }
};

module.exports.uploadMiddleware = upload;
module.exports.uploadImageMiddleware = uploadImage;
