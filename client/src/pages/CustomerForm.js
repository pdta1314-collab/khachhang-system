import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function CustomerForm() {
  const [name, setName] = useState('');
  const [outfit, setOutfit] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !outfit.trim()) {
      setError('Vui lòng nhập đầy đủ họ tên và trang phục');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/customers`, {
        name: name.trim(),
        outfit: outfit.trim()
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
        setOutfit('');
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
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        {!success ? (
          <>
            <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#333', fontSize: '24px' }}>
              Thu thập Thông tin Khách hàng
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
                <label htmlFor="outfit">Trang phục hôm nay</label>
                <input
                  type="text"
                  id="outfit"
                  value={outfit}
                  onChange={(e) => setOutfit(e.target.value)}
                  placeholder="Mô tả trang phục của bạn"
                  required
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
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <a href="/admin" style={{ color: '#667eea', textDecoration: 'none' }}>
                Đăng nhập Admin
              </a>
            </div>
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
              <QRCodeSVG 
                value={customerData?.downloadUrl || ''} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ textAlign: 'center', marginBottom: '12px' }}>
                <strong>Thông tin đã đăng ký:</strong>
              </p>
              <p style={{ textAlign: 'center', marginBottom: '8px' }}>
                <strong>Họ tên:</strong> {customerData?.customer?.name}
              </p>
              <p style={{ textAlign: 'center' }}>
                <strong>Trang phục:</strong> {customerData?.customer?.outfit}
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
      </div>
    </div>
  );
}

export default CustomerForm;
