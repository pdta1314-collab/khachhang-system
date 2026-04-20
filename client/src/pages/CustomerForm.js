import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

const API_URL = '/api';

function CustomerForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  // Project management states
  const [projects, setProjects] = useState([]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ họ tên và số điện thoại');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/customers`, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim()
      });

      if (response.data.success) {
        setSuccess(true);
        // Tự động tạo QR URL từ window.location thay vì dùng từ backend
        const baseUrl = window.location.origin;
        const qrUrl = `${baseUrl}/video/${response.data.customer.uniqueId}`;
        setCustomerData({
          ...response.data,
          qrCode: response.data.qrCode, // Dùng QR từ backend
          downloadUrl: qrUrl // Override URL với URL hiện tại
        });
        setName('');
        setPhone('');
        setEmail('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCustomer = () => {
    setSuccess(false);
    setCustomerData(null);
    setError(null);
  };

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/projects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success) {
        setProjects(response.data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError('Vui lòng nhập tên dự án');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/projects`, 
        { name: newProjectName.trim() },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (response.data.success) {
        setNewProjectName('');
        setShowCreateProject(false);
        setShowProjectMenu(false);
        fetchProjects(); // Refresh list
        
        // Auto export CSV
        if (response.data.project?.id) {
          await axios.post(`${API_URL}/projects/${response.data.project.id}/export-csv`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        }
        
        alert('Đã tạo dự án mới thành công và xuất CSV!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi khi tạo dự án');
    } finally {
      setLoading(false);
    }
  };

  // Select project
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setShowProjectList(false);
    setShowProjectMenu(false);
    alert(`Đã chọn dự án: ${project.name}`);
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
      {/* Logo làm tiêu đề trang - nằm ngoài card */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            width: '500px',
            height: 'auto',
            objectFit: 'contain',
            maxWidth: '100%',
            borderRadius: '12px'
          }}
        />
      </div>

      <div style={{ width: '100%', maxWidth: '500px', background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        {!success ? (
          <>
            <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#333', fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              NHẬP THÔNG TIN ĐĂNG KÝ
            </h1>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Họ và tên</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại của bạn"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (không bắt buộc)</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '18px' }}
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <span className="spinner" style={{ width: '20px', height: '20px', display: 'inline-block', marginRight: '10px' }}></span>
                    Đang xử lý...
                  </span>
                ) : (
                  'Gửi thông tin'
                )}
              </button>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  🔐 Vào trang Admin
                </button>

                {/* Nút DỰ ÁN với dropdown */}
                <div style={{ position: 'relative' }}>
                  <button 
                    type="button"
                    onClick={() => setShowProjectMenu(!showProjectMenu)}
                    className="btn btn-primary"
                    style={{ 
                      padding: '12px 20px',
                      background: selectedProject ? '#28a745' : '#667eea'
                    }}
                  >
                    📁 DỰ ÁN {selectedProject && `(${selectedProject.name})`} ▼
                  </button>

                  {/* Dropdown menu */}
                  {showProjectMenu && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '5px',
                      background: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      minWidth: '200px',
                      zIndex: 1000,
                      border: '1px solid #e0e0e0'
                    }}>
                      <div 
                        onClick={() => {
                          setShowCreateProject(true);
                          setShowProjectList(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          color: '#333',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        ➕ Tạo dự án mới
                      </div>
                      <div 
                        onClick={() => {
                          setShowProjectList(true);
                          setShowCreateProject(false);
                          fetchProjects();
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          color: '#333',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        📂 Dự án đã tạo {projects.length > 0 && `(${projects.length})`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="success-message">
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                Đăng ký thành công!
              </h2>
              <p style={{ textAlign: 'center' }}>
                Quý khách vui lòng quét mã QR bên dưới để tải video sau khi sự kiện kết thúc.
              </p>
            </div>

            <div className="qr-code" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                <QRCodeSVG 
                  value={customerData?.downloadUrl || ''} 
                  size={200}
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

            {/* Hiển thị ID lớn */}
            <div style={{ marginTop: '20px', padding: '20px', background: '#667eea', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>
                Số ID của bạn
              </p>
              <p style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
                {customerData?.customer?.id}
              </p>
              <p style={{ fontSize: '12px', opacity: 0.8 }}>
                Vui lòng nhớ số ID này để nhận video
              </p>
            </div>

            <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ textAlign: 'center', marginBottom: '12px' }}>
                <strong>Thông tin đã đăng ký:</strong>
              </p>
              <p style={{ textAlign: 'center', marginBottom: '8px' }}>
                <strong>Họ tên:</strong> {customerData?.customer?.name}
              </p>
              <p style={{ textAlign: 'center', marginBottom: '8px' }}>
                <strong>Số điện thoại:</strong> {customerData?.customer?.phone}
              </p>
              {customerData?.customer?.email && (
                <p style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <strong>Email:</strong> {customerData?.customer?.email}
                </p>
              )}
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                <strong>Giờ đăng ký:</strong> {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p style={{ textAlign: 'center', marginTop: '8px', padding: '8px', background: customerData?.customer?.status === 'Đang chụp' ? '#ffebee' : '#e3f2fd', borderRadius: '4px', color: customerData?.customer?.status === 'Đang chụp' ? '#c62828' : '#1565c0', fontWeight: 'bold' }}>
                Trạng thái: {customerData?.customer?.status}
              </p>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <p style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
                Hoặc truy cập trực tiếp: <br/>
                <a href={customerData?.downloadUrl} style={{ color: '#667eea', wordBreak: 'break-all' }}>
                  {customerData?.downloadUrl}
                </a>
              </p>
            </div>

            <button 
              onClick={handleNewCustomer}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '20px' }}
            >
              Đăng ký khách hàng mới
            </button>
          </>
        )}

        {/* Modal Tạo dự án mới */}
        {showCreateProject && (
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
          }} onClick={() => setShowCreateProject(false)}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>➕ Tạo dự án mới</h3>
              
              <div className="form-group">
                <label>Tên dự án</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nhập tên dự án (VD: TrumSo)"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                />
              </div>

              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                📅 Ngày tháng năm sẽ tự động tạo: {new Date().toLocaleDateString('vi-VN')}
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={() => setShowCreateProject(false)}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    background: '#95a5a6', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button 
                  onClick={handleCreateProject}
                  disabled={loading || !newProjectName.trim()}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    background: loading ? '#ccc' : '#667eea', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading || !newProjectName.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Đang tạo...' : 'Tạo dự án'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Danh sách dự án */}
        {showProjectList && (
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
          }} onClick={() => setShowProjectList(false)}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>📂 Dự án đã tạo</h3>
              
              {loadingProjects ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Đang tải...</p>
              ) : projects.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Chưa có dự án nào</p>
              ) : (
                <div>
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => handleSelectProject(project)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        background: selectedProject?.id === project.id ? '#d4edda' : '#f8f9fa',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: selectedProject?.id === project.id ? '2px solid #28a745' : '1px solid #e0e0e0'
                      }}
                    >
                      <p style={{ fontWeight: 'bold', color: '#333' }}>{project.name}</p>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        📁 {project.date_folder_name}
                      </p>
                      <p style={{ fontSize: '11px', color: '#999' }}>
                        Tạo: {new Date(project.created_at).toLocaleDateString('vi-VN')}
                      </p>
                      {selectedProject?.id === project.id && (
                        <span style={{ color: '#28a745', fontSize: '12px', fontWeight: 'bold' }}>✓ Đang chọn</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setShowProjectList(false)}
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
    </div>
  );
}

export default CustomerForm;
