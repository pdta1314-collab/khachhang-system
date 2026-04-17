import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://web-production-a6a88.up.railway.app/api';

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
  
  // Image management states
  const [selectedCustomerForImages, setSelectedCustomerForImages] = useState(null);
  const [customerImages, setCustomerImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

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
  }, [navigate]);

  const fetchCustomers = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCustomers(response.data.customers);
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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
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

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.outfit.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button onClick={handleLogout} className="btn btn-danger">
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

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group" style={{ marginBottom: '0' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc trang phục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '0' }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Trang phục</th>
              <th>Ngày đăng ký</th>
              <th>Ảnh</th>
              <th>Video</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.outfit}</td>
                <td>{new Date(customer.created_at).toLocaleDateString('vi-VN')}</td>
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
                      onClick={() => handleOpenImageModal(customer)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      Quản lý ảnh
                    </button>
                    <button 
                      onClick={() => setSelectedCustomer(customer)}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      {customer.video_path ? 'Thay video' : 'Upload video'}
                    </button>
                    
                    {customer.video_path && (
                      <button 
                        onClick={() => handleDeleteVideo(customer.id)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        Xóa video
                      </button>
                    )}
                    
                    <a 
                      href={`/video/${customer.unique_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
                    >
                      Xem
                    </a>

                    <button 
                      onClick={() => handleDelete(customer.id)}
                      className="btn btn-danger"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
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
    </div>
  );
}

export default AdminDashboard;
