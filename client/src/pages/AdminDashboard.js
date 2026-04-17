import React, { useState, useEffect } from 'react';
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

  // Multi-select delete states
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Batch video upload states
  const [batchVideoFiles, setBatchVideoFiles] = useState([]);
  const [uploadingBatchVideos, setUploadingBatchVideos] = useState(false);

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
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [navigate, autoRefresh]);

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
      setSelectedIds(filteredCustomers.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBatchVideoUpload = async () => {
    if (batchVideoFiles.length === 0) {
      setError('Vui lòng chọn file video');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    
    batchVideoFiles.forEach(file => {
      formData.append('videos', file);
    });

    setUploadingBatchVideos(true);
    try {
      const response = await axios.post(`${API_URL}/customers/videos/batch`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert(`Đã upload ${response.data.uploaded} video thành công!`);
        if (response.data.errors && response.data.errors.length > 0) {
          alert(`Có ${response.data.errors.length} lỗi:\n${response.data.errors.map(e => `${e.filename}: ${e.error}`).join('\n')}`);
        }
        setBatchVideoFiles([]);
        fetchCustomers(token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi upload video');
    } finally {
      setUploadingBatchVideos(false);
    }
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
      alert('Upload video thành công!');
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi upload video');
    } finally {
      setUploading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Họ tên', 'Trang phục', 'Ngày đăng ký', 'Có video'];
    const rows = customers.map(c => [
      c.id,
      c.name,
      c.outfit,
      new Date(c.created_at).toLocaleString('vi-VN'),
      c.video_path ? 'Có' : 'Chưa'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `khach-hang-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Quản lý Khách hàng</h1>
          <p style={{ color: '#666', marginTop: '4px' }}>
            Xin chào, <strong>{adminUser?.username}</strong>
          </p>
        </div>
        <div className="admin-nav">
          <button onClick={exportToCSV} className="btn btn-primary">
            Xuất CSV
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>📁 Chọn folder video</span>
            <input
              type="file"
              multiple
              webkitdirectory
              directory
              accept="video/*"
              onChange={(e) => setBatchVideoFiles(Array.from(e.target.files))}
              style={{ display: 'none' }}
            />
          </label>
          {batchVideoFiles.length > 0 && (
            <button onClick={handleBatchVideoUpload} disabled={uploadingBatchVideos} className="btn btn-primary">
              {uploadingBatchVideos ? 'Đang upload...' : `Upload ${batchVideoFiles.length} video`}
            </button>
          )}
          <button onClick={handleLogout} className="btn btn-secondary">
            Đăng xuất
          </button>
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
                  checked={selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0}
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
            {filteredCustomers.map(customer => (
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
                  <span className={`status-badge ${customer.video_path ? 'status-success' : 'status-pending'}`}>
                    {customer.video_path ? 'Đã có' : 'Chưa có'}
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
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '14px', background: '#e74c3c' }}
                    >
                      Xóa
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
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#666' }}>
        <p>Tổng số: <strong>{customers.length}</strong> khách hàng</p>
        <p>Có video: <strong>{customers.filter(c => c.video_path).length}</strong> / {customers.length}</p>
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
        <div className="modal" style={{ display: 'flex' }} onClick={() => setViewCustomer(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
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
                <QRCodeSVG 
                  value={`${window.location.origin}/video/${viewCustomer.uniqueId}`}
                  size={200}
                  style={{ margin: '0 auto', display: 'block' }}
                />
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
              {viewCustomer.video_path && (
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Video đã upload:</p>
                  <video 
                    controls 
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                    src={viewCustomer.videoUrl}
                  />
                </div>
              )}

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
    </div>
  );
}

export default AdminDashboard;
