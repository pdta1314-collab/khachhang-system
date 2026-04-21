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


  return (
    <>
      {/* Video background - layer dưới cùng */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          backgroundColor: '#000'
        }}
      >
        <source src="/trumso.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', position: 'relative', zIndex: 1 }}>
      {/* Logo làm tiêu đề trang */}
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

      <div style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
        {!success ? (
          <>
            <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#fff', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: '1.3' }}>
              NHẬP THÔNG TIN ĐĂNG KÝ
            </h1>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Họ và tên</label>
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
                <label htmlFor="phone" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Số điện thoại</label>
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
                <label htmlFor="email" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Email (không bắt buộc)</label>
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

              <button 
                type="button"
                onClick={() => navigate('/admin')}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '10px', padding: '12px' }}
              >
                🔐 Vào trang Admin
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="success-message">
              <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Đăng ký thành công!
              </h2>
              <p style={{ textAlign: 'center', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
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
            <div style={{ marginTop: '20px', padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', marginBottom: '8px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                Số ID của bạn
              </p>
              <p style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {customerData?.customer?.id}
              </p>
              <p style={{ fontSize: '12px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                Vui lòng nhớ số ID này để nhận video
              </p>
            </div>

            <div style={{ marginTop: '20px', padding: '20px' }}>
              <p style={{ textAlign: 'center', marginBottom: '12px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                <strong>Thông tin đã đăng ký:</strong>
              </p>
              <p style={{ textAlign: 'center', marginBottom: '8px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                <strong>Họ tên:</strong> {customerData?.customer?.name}
              </p>
              <p style={{ textAlign: 'center', marginBottom: '8px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                <strong>Số điện thoại:</strong> {customerData?.customer?.phone}
              </p>
              {customerData?.customer?.email && (
                <p style={{ textAlign: 'center', marginBottom: '8px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  <strong>Email:</strong> {customerData?.customer?.email}
                </p>
              )}
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                <strong>Giờ đăng ký:</strong> {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p style={{ textAlign: 'center', marginTop: '8px', padding: '8px', background: customerData?.customer?.status === 'Đang chụp' ? '#ffebee' : '#e3f2fd', borderRadius: '4px', color: customerData?.customer?.status === 'Đang chụp' ? '#c62828' : '#1565c0', fontWeight: 'bold' }}>
                Trạng thái: {customerData?.customer?.status}
              </p>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <p style={{ marginBottom: '12px', color: '#fff', fontSize: '14px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
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

      </div>
    </div>
    </>
  );
}

export default CustomerForm;
