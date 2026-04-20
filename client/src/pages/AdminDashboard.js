import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = '/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [videoFilter, setVideoFilter] = useState(''); // 'has', 'no', ''
  const [imageFilter, setImageFilter] = useState(''); // 'has', 'no', ''
  
  // Auto-refresh
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // View modal states
  const [viewCustomer, setViewCustomer] = useState(null);
  
  // Image management states
  const [selectedCustomerForImages, setSelectedCustomerForImages] = useState(null);
  const [customerImages, setCustomerImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Video management states
  const [selectedCustomerForVideos, setSelectedCustomerForVideos] = useState(null);
  const [removingVideo, setRemovingVideo] = useState(false);

  // Multi-select delete states
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Batch video upload states
  const [scanningVideosFolder, setScanningVideosFolder] = useState(false);
  const [scanningGoogleDrive, setScanningGoogleDrive] = useState(false);
  
  // Logs state for scan/upload
  const [logs, setLogs] = useState([]);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  // Project selection states
  const [selectedProjectFolder, setSelectedProjectFolder] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [googleDriveFolders, setGoogleDriveFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [csvFileId, setCsvFileId] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  
  // Add log function - logs mới nhất ở cuối để auto-scroll đúng
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setLogs(prev => [...prev, { message, type, timestamp }].slice(-50)); // Keep last 50 logs
  };

  // Auto-scroll logs to bottom when new log added
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);
  useEffect(() => {
    if (logsContainerRef.current && logs.length > 0) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Fetch Google Drive folders
  const fetchGoogleDriveFolders = async () => {
    const token = localStorage.getItem('adminToken');
    setLoadingFolders(true);
    try {
      const response = await axios.get(`${API_URL}/google-drive/folders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setGoogleDriveFolders(response.data.folders || []);
        setShowProjectModal(true);
      }
    } catch (err) {
      setError('Không thể lấy danh sách folder từ Google Drive');
      addLog(`❌ Lỗi lấy folder: ${err.message}`, 'error');
    } finally {
      setLoadingFolders(false);
    }
  };

  // Select project folder
  const handleSelectProjectFolder = async (folder) => {
    const token = localStorage.getItem('adminToken');
    setSelectedProjectFolder(folder);
    setShowProjectModal(false);
    addLog(`📁 Đã chọn folder: ${folder.name}`, 'info');

    // Create CSV file for the project
    try {
      addLog(`🔄 Đang tạo CSV file...`, 'info');
      const csvResponse = await axios.post(`${API_URL}/google-drive/create-csv`,
        { folderId: folder.id, fileName: `${folder.name}_customers.csv` },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (csvResponse.data.success) {
        setCsvFileId(csvResponse.data.csv.id);
        addLog(`✅ Đã tạo CSV file`, 'success');
      }
    } catch (err) {
      addLog(`⚠️ Lỗi tạo CSV: ${err.message}`, 'warning');
    }

    // Auto sync videos from selected folder
    try {
      addLog(`🔄 Đang sync video từ folder ${folder.name}...`, 'info');
      const response = await axios.post(`${API_URL}/google-drive/sync-folder`,
        { folderId: folder.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        addLog(`✅ Đã sync ${response.data.linked || 0} video`, 'success');
        fetchCustomers(token);
      }
    } catch (err) {
      addLog(`❌ Lỗi sync: ${err.message}`, 'error');
    }
  };

  // Download CSV from Google Drive
  const handleDownloadCsv = async () => {
    if (!csvFileId) {
      alert('Không có CSV file để download');
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      addLog(`🔄 Đang download CSV...`, 'info');
      const response = await axios.get(`${API_URL}/google-drive/download-csv/${csvFileId}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();

      addLog(`✅ Đã download CSV thành công`, 'success');
    } catch (err) {
      addLog(`❌ Lỗi download CSV: ${err.message}`, 'error');
      alert('Lỗi khi download CSV: ' + err.message);
    }
  };

  // Upload CSV and sync to database
  const handleUploadCsv = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('adminToken');
    setUploadingCsv(true);

    try {
      addLog(`🔄 Đang upload CSV...`, 'info');

      // Parse CSV
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0];
      const dataRows = rows.slice(1).filter(row => row.length > 1);

      // Sync to database
      let updated = 0;
      let errors = [];

      for (const row of dataRows) {
        try {
          const [id, name, outfit, phone, registeredDate, status, videoCount] = row.map(cell => cell?.trim?.() || cell);

          if (!id) {
            errors.push({ row, error: 'Thiếu ID khách hàng' });
            continue;
          }

          const customerId = parseInt(id);

          await axios.put(`${API_URL}/customers/${customerId}`,
            { name, outfit, phone, status },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          updated++;
        } catch (err) {
          errors.push({ row, error: err.message });
        }
      }

      addLog(`✅ Đã sync ${updated} khách hàng từ CSV`, 'success');
      fetchCustomers(token);
      alert(`Đã sync ${updated} khách hàng thành công!`);

      if (errors.length > 0) {
        console.log('Errors:', errors);
      }
    } catch (err) {
      addLog(`❌ Lỗi upload CSV: ${err.message}`, 'error');
      alert('Lỗi khi upload CSV: ' + err.message);
    } finally {
      setUploadingCsv(false);
      event.target.value = '';
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (userStr) {
      setAdminUser(JSON.parse(userStr));
    }

    fetchCustomers(token);
    
    // Auto-refresh mỗi 5 giây
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchCustomers(token);
      }, 5000);
    }
    
    // Auto-scan Google Drive mỗi 30 giây
    let scanInterval;
    if (autoScanEnabled) {
      scanInterval = setInterval(() => {
        autoScanGoogleDrive(token);
      }, 30000);
      // Scan ngay khi load trang
      autoScanGoogleDrive(token);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [navigate, autoRefresh, autoScanEnabled]);

  const fetchCustomers = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCustomers(response.data.customers);
        setLastUpdate(new Date());
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      } else {
        setError('Không thể tải danh sách khách hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch chỉ khách hàng mới (cho auto-refresh)
  const fetchLatestCustomers = async (token) => {
    try {
      const since = lastUpdate ? lastUpdate.toISOString() : null;
      const response = await axios.get(`${API_URL}/customers/latest/list${since ? `?since=${since}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.customers.length > 0) {
        // Cập nhật danh sách - thêm khách mới và cập nhật status
        const newCustomers = response.data.customers;
        setCustomers(prev => {
          const existingIds = prev.map(c => c.id);
          const updated = [...prev];
          
          newCustomers.forEach(newCust => {
            const idx = existingIds.indexOf(newCust.id);
            if (idx >= 0) {
              // Cập nhật khách cũ
              updated[idx] = { ...updated[idx], ...newCust };
            } else {
              // Thêm khách mới
              updated.unshift(newCust);
            }
          });
          
          return updated;
        });
        setLastUpdate(new Date());
      }
    } catch (err) {
      // Không hiển thị lỗi cho auto-refresh
      console.log('Auto-refresh error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  // Lấy style cho row theo trạng thái
  const getRowStyle = (status) => {
    switch (status) {
      case 'Đang chụp':
        return { backgroundColor: '#ffebee', fontWeight: 'bold' }; // Đỏ nhạt
      case 'Đang chờ':
        return { backgroundColor: '#e3f2fd', fontWeight: 'bold' }; // Xanh nhạt
      case 'Đã chụp xong':
        return { backgroundColor: '#f5f5f5' }; // Xám nhạt
      default:
        return {};
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa khách hàng này? Tất cả ảnh và video cũng sẽ bị xóa.')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API_URL}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers(token);
    } catch (err) {
      setError('Lỗi khi xóa khách hàng');
    }
  };

  // Image management functions
  const fetchCustomerImages = async (customerId) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.get(`${API_URL}/customers/${customerId}/images`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCustomerImages(response.data.images);
      }
    } catch (err) {
      setError('Lỗi khi tải danh sách ảnh');
    }
  };

  const handleOpenImageModal = (customer) => {
    setSelectedCustomerForImages(customer);
    fetchCustomerImages(customer.id);
  };

  const handleOpenVideoModal = (customer) => {
    setSelectedCustomerForVideos(customer);
  };

  const handleRemoveVideo = async (videoUrl) => {
    if (!selectedCustomerForVideos) return;
    
    if (!window.confirm('Bạn có chắc muốn xóa video này?')) return;
    
    const token = localStorage.getItem('adminToken');
    setRemovingVideo(true);
    
    try {
      addLog(`🔄 Đang xóa video cho khách ${selectedCustomerForVideos.name}...`, 'info');
      const encodedUrl = encodeURIComponent(videoUrl);
      await axios.delete(`${API_URL}/customers/${selectedCustomerForVideos.id}/video/${encodedUrl}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      addLog(`✅ Đã xóa video thành công`, 'success');
      // Cập nhật state modal
      const currentUrls = selectedCustomerForVideos.videoUrls || [];
      const newUrls = currentUrls.filter(url => url !== videoUrl);
      const newCount = newUrls.length;
      
      setSelectedCustomerForVideos({
        ...selectedCustomerForVideos,
        videoUrls: newUrls,
        videoCount: newCount
      });
      
      // Cập nhật customers state để bảng refresh
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomerForVideos.id 
          ? { ...c, videoUrls: newUrls, videoCount: newCount }
          : c
      ));
    } catch (err) {
      addLog(`❌ Lỗi xóa video: ${err.response?.data?.error || err.message}`, 'error');
      alert('Lỗi khi xóa video: ' + (err.response?.data?.error || err.message));
    } finally {
      setRemovingVideo(false);
    }
  };

  const handleImageUpload = async () => {
    if (imageFiles.length === 0 || !selectedCustomerForImages) {
      setError('Vui lòng chọn ít nhất một file ảnh');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    setUploadingImages(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/customers/${selectedCustomerForImages.id}/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setImageFiles([]);
        fetchCustomerImages(selectedCustomerForImages.id);
        fetchCustomers(token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi upload ảnh');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API_URL}/customers/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomerImages(selectedCustomerForImages.id);
      fetchCustomers(token);
    } catch (err) {
      setError('Lỗi khi xóa ảnh');
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa video này?')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API_URL}/customers/${id}/video`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers(token);
    } catch (err) {
      setError('Lỗi khi xóa video');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API_URL}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers(token);
      setError(null);
    } catch (err) {
      setError('Không thể xóa khách hàng');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} khách hàng đã chọn?`)) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    setDeleting(true);
    
    try {
      await Promise.all(selectedIds.map(id => 
        axios.delete(`${API_URL}/customers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
      setSelectedIds([]);
      fetchCustomers(token);
      setError(null);
    } catch (err) {
      setError('Không thể xóa khách hàng');
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedCustomers.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleScanVideosFolder = async () => {
    const token = localStorage.getItem('adminToken');
    setScanningVideosFolder(true);
    addLog('🔄 Đang scan thư mục videos...', 'info');
    try {
      const response = await axios.post(`${API_URL}/customers/videos/scan-videos`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const { uploaded, files, errors } = response.data;
        addLog(`✅ Đã upload ${uploaded} video từ thư mục`, 'success');
        if (files && files.length > 0) {
          files.forEach(f => {
            addLog(`  📹 ${f.filename} → Khách hàng ID${f.customerId}`, 'success');
          });
        }
        if (errors && errors.length > 0) {
          errors.forEach(e => {
            addLog(`⚠️ ${e.filename}: ${e.error}`, 'warning');
          });
        }
        alert(response.data.message);
        fetchCustomers(token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi scan thư mục videos');
      addLog(`❌ Lỗi scan thư mục: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setScanningVideosFolder(false);
    }
  };

  // Auto-scan Google Drive - không hiển thị alert, chỉ log
  const autoScanGoogleDrive = async (token) => {
    try {
      addLog('🔄 Đang scan Google Drive...', 'info');
      const response = await axios.post(`${API_URL}/customers/videos/scan-google-drive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const { linked, files, errors } = response.data;
        if (linked > 0) {
          addLog(`✅ Đã link ${linked} video mới từ Google Drive`, 'success');
          files.forEach(f => {
            addLog(`  📹 ${f.filename} → Khách hàng ID${f.customerId}`, 'success');
          });
          fetchCustomers(token);
        }
        if (errors && errors.length > 0) {
          errors.forEach(e => {
            addLog(`⚠️ ${e.filename}: ${e.error}`, 'warning');
          });
        }
        if (linked === 0 && (!errors || errors.length === 0)) {
          addLog('ℹ️ Không có video mới', 'info');
        }
      }
    } catch (err) {
      addLog(`❌ Lỗi scan: ${err.response?.data?.error || err.message}`, 'error');
    }
  };

  const handleScanGoogleDrive = async () => {
    const token = localStorage.getItem('adminToken');
    setScanningGoogleDrive(true);
    try {
      addLog('🔄 Đang scan Google Drive (thủ công)...', 'info');
      const response = await axios.post(`${API_URL}/customers/videos/scan-google-drive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const { linked, files, errors } = response.data;
        addLog(`✅ Đã link ${linked} video`, 'success');
        if (files && files.length > 0) {
          files.forEach(f => {
            addLog(`  📹 ${f.filename} → Khách hàng ID${f.customerId}`, 'success');
          });
        }
        if (errors && errors.length > 0) {
          errors.forEach(e => {
            addLog(`⚠️ ${e.filename}: ${e.error}`, 'warning');
          });
        }
        alert(response.data.message);
        fetchCustomers(token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi scan Google Drive');
      addLog(`❌ Lỗi scan: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setScanningGoogleDrive(false);
    }
  };

  const exportToCSV = (data) => {
    const headers = ['ID', 'Họ tên', 'Trang phục', 'Số điện thoại', 'Ngày đăng ký', 'Trạng thái', 'Số video'];
    const rows = data.map(c => [
      c.id,
      c.name,
      c.outfit,
      c.phone || '',
      new Date(c.created_at).toLocaleString('vi-VN'),
      c.status || 'Chờ chụp',
      c.videoCount || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const projectName = selectedProjectFolder ? selectedProjectFolder.name.replace(/\s+/g, '_') : 'khach-hang';
    link.download = `${projectName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    addLog(`📊 Đã export CSV với ${data.length} khách hàng`, 'success');
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedCustomer) {
      setError('Vui lòng chọn file video');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('video', uploadFile);

    setUploading(true);
    setError(null);
    addLog(`🔄 Đang upload video cho khách ${selectedCustomer.name}...`, 'info');

    try {
      await axios.post(`${API_URL}/customers/${selectedCustomer.id}/video`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadFile(null);
      setSelectedCustomer(null);
      fetchCustomers(token);
      addLog(`✅ Đã upload video cho khách ${selectedCustomer.name}`, 'success');
      alert('Upload video thành công!');
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi upload video');
      addLog(`❌ Lỗi upload video cho khách ${selectedCustomer.name}: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    // Search filter
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = !statusFilter || c.status === statusFilter;
    
    // Video filter
    const matchesVideo = !videoFilter || 
                        (videoFilter === 'has' && c.video_path) ||
                        (videoFilter === 'no' && !c.video_path);
    
    // Image filter
    const matchesImage = !imageFilter ||
                        (imageFilter === 'has' && c.image_count > 0) ||
                        (imageFilter === 'no' && (!c.image_count || c.image_count === 0));
    
    return matchesSearch && matchesStatus && matchesVideo && matchesImage;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, videoFilter, imageFilter]);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Nút Quay lại đăng ký - góc trái */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1000 }}>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          ↩ Quay lại đăng ký
        </button>
      </div>

      {/* Nút Đăng xuất - góc phải */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <button onClick={handleLogout} className="btn btn-secondary">
          Đăng xuất
        </button>
      </div>

      {/* Logo làm tiêu đề trang - nằm trên đầu và căn giữa */}
      <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '40px' }}>
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            width: '100%',
            maxWidth: '1200px',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '12px'
          }}
        />
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 className="admin-title" style={{ marginBottom: '8px' }}>Quản lý Khách hàng</h1>
            <p style={{ color: '#666', marginTop: '4px' }}>
              Xin chào, <strong>{adminUser?.username}</strong>
            </p>
          </div>
          <div className="admin-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={fetchGoogleDriveFolders} disabled={loadingFolders} className="btn btn-primary">
              {loadingFolders ? 'Đang tải...' : selectedProjectFolder ? `📁 ${selectedProjectFolder.name}` : '📁 DỰ ÁN'}
            </button>
            {csvFileId && (
              <>
                <button onClick={handleDownloadCsv} className="btn btn-success">
                  📥 Download CSV
                </button>
                <label className="btn btn-primary" style={{ cursor: uploadingCsv ? 'not-allowed' : 'pointer', opacity: uploadingCsv ? 0.5 : 1 }}>
                  {uploadingCsv ? 'Đang upload...' : '📤 Upload CSV'}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleUploadCsv}
                    disabled={uploadingCsv}
                    style={{ display: 'none' }}
                  />
                </label>
              </>
            )}
            <button onClick={handleScanGoogleDrive} disabled={scanningGoogleDrive} className="btn btn-primary">
              {scanningGoogleDrive ? 'Đang scan...' : '☁️ Scan Google Drive'}
            </button>
            <button onClick={() => exportToCSV(filteredCustomers)} className="btn btn-success">
              📊 Export CSV
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '10px', float: 'right' }}>×</button>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '0', flex: '1', minWidth: '200px' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ marginBottom: '0', padding: '10px' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Đang chụp">Đang chụp</option>
            <option value="Đang chờ">Đang chờ</option>
            <option value="Đã chụp xong">Đã chụp xong</option>
          </select>
          <select
            value={videoFilter}
            onChange={(e) => setVideoFilter(e.target.value)}
            style={{ marginBottom: '0', padding: '10px' }}
          >
            <option value="">Tất cả video</option>
            <option value="has">Đã có video</option>
            <option value="no">Chưa có video</option>
          </select>
          <select
            value={imageFilter}
            onChange={(e) => setImageFilter(e.target.value)}
            style={{ marginBottom: '0', padding: '10px' }}
          >
            <option value="">Tất cả ảnh</option>
            <option value="has">Đã có ảnh</option>
            <option value="no">Chưa có ảnh</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Tự động cập nhật
          </label>
        </div>
      </div>

      {/* Delete selected button */}
      {selectedIds.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Đã chọn {selectedIds.length} khách hàng</span>
          <button 
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="btn btn-secondary"
            style={{ padding: '10px 20px', background: '#dc3545', color: 'white' }}
          >
            {deleting ? 'Đang xóa...' : `Xóa ${selectedIds.length} khách hàng`}
          </button>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>
                <input
                  type="checkbox"
                  checked={paginatedCustomers.length > 0 && selectedIds.length === paginatedCustomers.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Số điện thoại</th>
              <th>Trạng thái</th>
              <th>Giờ đăng ký</th>
              <th>Ảnh</th>
              <th>Video</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.map(customer => (
              <tr key={customer.id} style={getRowStyle(customer.status)}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(customer.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, customer.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== customer.id));
                      }
                    }}
                  />
                </td>
                <td style={{ fontWeight: 'bold', fontSize: '16px' }}>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: customer.status === 'Đang chụp' ? '#ef5350' : customer.status === 'Đang chờ' ? '#42a5f5' : '#9e9e9e',
                    color: 'white'
                  }}>
                    {customer.status}
                  </span>
                </td>
                <td>{customer.registration_time ? new Date(customer.registration_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>
                  <span className={`status-badge ${customer.image_count > 0 ? 'status-success' : 'status-pending'}`}>
                    {customer.image_count || 0} ảnh
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${customer.videoCount > 0 ? 'status-success' : 'status-pending'}`}>
                    {customer.videoCount || 0} video
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setViewCustomer(customer)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      Xem
                    </button>
                    <button 
                      onClick={() => handleOpenImageModal(customer)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      Ảnh
                    </button>
                    <button 
                      onClick={() => handleOpenVideoModal(customer)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '14px',
                        backgroundColor: customer.videoCount > 0 ? '#e3f2fd' : undefined,
                        color: customer.videoCount > 0 ? '#1976d2' : undefined
                      }}
                    >
                      {customer.videoCount > 0 ? `Video (${customer.videoCount})` : 'Video'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Không tìm thấy khách hàng nào
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{ padding: '8px 16px' }}
            >
              ← Trước
            </button>
            <span style={{ fontWeight: 'bold', color: '#666' }}>
              Trang {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
              style={{ padding: '8px 16px' }}
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#666' }}>
        <p>Tổng số: <strong>{customers.length}</strong> khách hàng</p>
        <p>Có video: <strong>{customers.filter(c => c.videoCount > 0).reduce((sum, c) => sum + c.videoCount, 0)}</strong> video / {customers.filter(c => c.videoCount > 0).length} khách</p>
      </div>

      {/* Auto-scan toggle */}
      <div style={{ marginTop: '15px', padding: '10px 15px', background: '#f0f7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={autoScanEnabled}
            onChange={(e) => {
              setAutoScanEnabled(e.target.checked);
              addLog(e.target.checked ? '✅ Auto-scan đã BẬT (30s)' : '⏹️ Auto-scan đã TẮT', 'info');
            }}
          />
          <span>Auto-scan Google Drive (30s)</span>
        </label>
      </div>

      {/* Logs Box */}
      <div style={{ marginTop: '20px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ 
          padding: '12px 16px', 
          background: '#f5f5f5', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <strong style={{ fontSize: '14px' }}>📋 Nhật ký hoạt động (Logs)</strong>
          <button 
            onClick={() => setLogs([])}
            style={{ 
              fontSize: '12px', 
              padding: '4px 12px', 
              background: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Xóa logs
          </button>
        </div>
        <div 
          ref={logsContainerRef}
          style={{ 
            maxHeight: '200px', 
            overflowY: 'auto', 
            padding: '10px',
            background: '#fafafa',
            fontSize: '13px',
            fontFamily: 'monospace'
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              Chưa có log nào...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ 
                padding: '4px 8px', 
                marginBottom: '2px',
                borderRadius: '3px',
                background: log.type === 'error' ? '#ffebee' : 
                           log.type === 'success' ? '#e8f5e9' : 
                           log.type === 'warning' ? '#fff3e0' : 'transparent',
                color: log.type === 'error' ? '#c62828' : 
                       log.type === 'success' ? '#2e7d32' : 
                       log.type === 'warning' ? '#ef6c00' : '#666'
              }}>
                <span style={{ color: '#999', fontSize: '11px' }}>[{log.timestamp}]</span>{' '}
                {log.message}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Upload Modal */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginBottom: '20px' }}>
              Upload video cho: {selectedCustomer.name}
            </h3>

            <div className="form-group">
              <label>Chọn file video (MP4, MOV, AVI, MKV)</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setUploadFile(e.target.files[0])}
                style={{ padding: '10px' }}
              />
              {uploadFile && (
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  File: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={handleUpload}
                className="btn btn-primary"
                disabled={!uploadFile || uploading}
                style={{ flex: 1 }}
              >
                {uploading ? (
                  <span>
                    <span className="spinner" style={{ width: '16px', height: '16px', display: 'inline-block', marginRight: '8px' }}></span>
                    Đang upload...
                  </span>
                ) : (
                  'Upload'
                )}
              </button>
              <button 
                onClick={() => {
                  setSelectedCustomer(null);
                  setUploadFile(null);
                }}
                className="btn btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {selectedCustomerForImages && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div className="card" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>
                Quản lý ảnh: {selectedCustomerForImages.name}
              </h3>
              <button 
                onClick={() => {
                  setSelectedCustomerForImages(null);
                  setImageFiles([]);
                  setCustomerImages([]);
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Upload Section */}
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>Thêm ảnh mới</h4>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImageFiles(Array.from(e.target.files))}
                style={{ marginBottom: '15px', display: 'block' }}
              />
              {imageFiles.length > 0 && (
                <p style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                  Đã chọn {imageFiles.length} ảnh
                </p>
              )}
              <button 
                onClick={handleImageUpload}
                className="btn btn-primary"
                disabled={imageFiles.length === 0 || uploadingImages}
              >
                {uploadingImages ? (
                  <span>
                    <span className="spinner" style={{ width: '16px', height: '16px', display: 'inline-block', marginRight: '8px' }}></span>
                    Đang upload...
                  </span>
                ) : (
                  `Upload ${imageFiles.length > 0 ? imageFiles.length : ''} ảnh`
                )}
              </button>
            </div>

            {/* Images Grid */}
            <h4 style={{ marginBottom: '15px' }}>
              Danh sách ảnh ({customerImages.length} ảnh)
            </h4>
            
            {customerImages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                Chưa có ảnh nào. Hãy upload ảnh cho khách hàng này.
              </p>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                gap: '15px',
                marginBottom: '20px'
              }}>
                {customerImages.map((image, index) => (
                  <div key={image.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                    <img 
                      src={image.url} 
                      alt={`Ảnh ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '150px', 
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(image.url, '_blank')}
                    />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      background: 'rgba(0,0,0,0.7)', 
                      color: 'white',
                      padding: '5px',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      Ảnh {index + 1}
                    </div>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        lineHeight: '1'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
              💡 Lưu ý: Các ảnh này dùng để render video. Bạn có thể chụp nhiều batch hình, upload tất cả vào đây, sau đó chọn ảnh ưng ý để render video.
            </p>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết khách hàng */}
      {viewCustomer && (
        <div className="modal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '1000' }} onClick={() => setViewCustomer(null)}>
          <div className="modal-content" style={{ maxWidth: '500px', margin: 'auto', backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thông tin khách hàng #{viewCustomer.id}</h3>
              <button className="close-btn" onClick={() => setViewCustomer(null)}>&times;</button>
            </div>
            
            <div style={{ textAlign: 'center', padding: '20px' }}>
              {/* ID lớn */}
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white', 
                padding: '20px', 
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Số ID</p>
                <p style={{ fontSize: '56px', fontWeight: 'bold', marginBottom: '8px' }}>{viewCustomer.id}</p>
                <p style={{ fontSize: '12px', opacity: 0.8 }}>Vui lòng nhớ số ID này</p>
              </div>

              {/* QR Code */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Mã QR để tải video</p>
                <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
                  <QRCodeSVG 
                    value={`${window.location.origin}/video/${viewCustomer.uniqueId}`}
                    size={200}
                    style={{ display: 'block' }}
                    level="H"
                    includeMargin={true}
                  />
                  {/* Logo ở giữa QR code */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '4px',
                    zIndex: '2'
                  }}>
                    <img
                      src="/logo.png"
                      alt="Logo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div style={{ textAlign: 'left', background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <p style={{ marginBottom: '8px' }}><strong>Họ tên:</strong> {viewCustomer.name}</p>
                <p style={{ marginBottom: '8px' }}><strong>Số điện thoại:</strong> {viewCustomer.phone || '-'}</p>
                <p style={{ marginBottom: '8px' }}><strong>Email:</strong> {viewCustomer.email || '-'}</p>
                <p style={{ marginBottom: '8px' }}>
                  <strong>Trạng thái:</strong>{' '}
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: viewCustomer.status === 'Đang chụp' ? '#ef5350' : viewCustomer.status === 'Đang chờ' ? '#42a5f5' : '#9e9e9e',
                    color: 'white'
                  }}>
                    {viewCustomer.status}
                  </span>
                </p>
                <p><strong>Giờ đăng ký:</strong> {viewCustomer.registration_time ? new Date(viewCustomer.registration_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
              </div>

              {/* Video đã upload */}
              <div style={{ marginBottom: '15px' }}>
                {viewCustomer.video_path ? (
                  <p style={{ fontSize: '16px', color: '#28a745', fontWeight: 'bold', marginBottom: '8px' }}>
                    ✅ Video đã upload!
                  </p>
                ) : (
                  <p style={{ fontSize: '16px', color: '#dc3545', fontWeight: 'bold', marginBottom: '8px' }}>
                    ❌ Chưa có video
                  </p>
                )}
              </div>

              {/* Link tải video */}
              <a 
                href={`/video/${viewCustomer.uniqueId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}
              >
                Mở trang tải video
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Video Management Modal */}
      {selectedCustomerForVideos && (
        <div className="modal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '1000' }} onClick={() => setSelectedCustomerForVideos(null)}>
          <div className="modal-content" style={{ maxWidth: '700px', width: '95%', margin: 'auto', backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '15px' }}>
              <h3 style={{ color: '#333', margin: 0 }}>
                Quản lý video: {selectedCustomerForVideos.name} (ID: {selectedCustomerForVideos.id})
              </h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedCustomerForVideos(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '28px', 
                  cursor: 'pointer',
                  color: '#666',
                  lineHeight: 1,
                  padding: '0 4px'
                }}
              >
                &times;
              </button>
            </div>

            <p style={{ marginBottom: '15px', color: '#555', fontSize: '14px' }}>
              Số điện thoại: <strong>{selectedCustomerForVideos.phone}</strong>
            </p>

            {/* Video List */}
            <h4 style={{ marginBottom: '15px', color: '#222', fontWeight: '600' }}>
              Danh sách video ({selectedCustomerForVideos.videoCount || 0} video)
            </h4>
            
            {(!selectedCustomerForVideos.videoUrls || selectedCustomerForVideos.videoUrls.length === 0) ? (
              <p style={{ textAlign: 'center', color: '#444', padding: '40px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px' }}>
                Chưa có video nào. Hãy upload video qua Google Drive hoặc nút "Upload".
              </p>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                {selectedCustomerForVideos.videoUrls.map((videoUrl, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '15px',
                    marginBottom: '10px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      background: '#2563eb', 
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: '#000',
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {videoUrl.includes('drive.google.com') ? '📁 Google Drive Video' : `📁 Video ${index + 1}`}
                      </p>
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '11px', 
                        color: '#555',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {videoUrl}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => window.open(videoUrl, '_blank')}
                        style={{
                          padding: '8px 12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => handleRemoveVideo(videoUrl)}
                        disabled={removingVideo}
                        style={{
                          padding: '8px 12px',
                          background: removingVideo ? '#ccc' : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: removingVideo ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {removingVideo ? '...' : 'Xóa'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ 
              padding: '15px', 
              background: '#e3f2fd', 
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h5 style={{ marginBottom: '10px', color: '#0d47a1', fontWeight: '600' }}>💡 Hướng dẫn:</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#222', lineHeight: '1.6' }}>
                <li>Video từ Google Drive sẽ tự động được thêm khi scan</li>
                <li>Bấm "Xem" để kiểm tra video trước khi xóa</li>
                <li>Xóa video chỉ xóa link trong hệ thống, không xóa file gốc trên Google Drive</li>
                <li>Để thêm video mới, upload file vào Google Drive với tên định dạng <strong>ID{selectedCustomerForVideos.id}_T1.mp4</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn folder Google Drive */}
      {showProjectModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }} onClick={() => setShowProjectModal(false)}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>📂 Chọn Folder Dự Án</h3>
          
          {loadingFolders ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Đang tải...</p>
          ) : googleDriveFolders.length === 0 ? (
            <div>
              <p style={{ textAlign: 'center', color: '#666' }}>Không tìm thấy folder nào</p>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#999', marginTop: '10px' }}>
                Hãy tạo folder trong Google Drive với định dạng: dd-mm-yyyy_TênDự án
              </p>
            </div>
          ) : (
            <div>
              {googleDriveFolders.map((folder) => (
                <div 
                  key={folder.id}
                  onClick={() => handleSelectProjectFolder(folder)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: selectedProjectFolder?.id === folder.id ? '#d4edda' : '#f8f9fa',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedProjectFolder?.id === folder.id ? '2px solid #28a745' : '1px solid #e0e0e0'
                  }}
                >
                  <p style={{ fontWeight: 'bold', color: '#333' }}>{folder.name}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    📁 ID: {folder.id}
                  </p>
                  {folder.createdTime && (
                    <p style={{ fontSize: '11px', color: '#999' }}>
                      Tạo: {new Date(folder.createdTime).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={() => setShowProjectModal(false)}
            style={{ 
              width: '100%',
              padding: '12px', 
              background: '#95a5a6', 
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    )}
  </div>
);
}

export default AdminDashboard;
