import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = '/api';

function CustomerForm() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
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

      <div style={{ width: '100%', maxWidth: '400px' }}>
        {!success ? (
          <>
            <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#333', fontSize: '32px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {t('registrationTitle')}
            </h1>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">{t('fullName')}</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'vi' ? 'Nhập họ và tên của bạn' : 'Enter your full name'}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('phone')}</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={language === 'vi' ? 'Nhập số điện thoại của bạn' : 'Enter your phone number'}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">{t('email')}</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'vi' ? 'Nhập email của bạn' : 'Enter your email'}
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
                    {t('processing')}
                  </span>
                ) : (
                  t('submit')
                )}
              </button>

              <button 
                type="button"
                onClick={() => navigate('/admin')}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '10px', padding: '12px' }}
              >
                🔐 {t('adminPage')}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="success-message">
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                {t('registrationSuccess')}
              </h2>
              <p style={{ textAlign: 'center' }}>
                {t('qrInstruction')}
              </p>
            </div>

            <div className="qr-code" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                {/* Logo mờ phía sau QR code - căn bằng và phủ đầy */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '200px',
                  height: '200px',
                  opacity: '0.4',
                  zIndex: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src="/logo.png"
                    alt="Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div style={{ position: 'relative', zIndex: '2' }}>
                  <QRCodeSVG 
                    value={customerData?.downloadUrl || ''} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
            </div>

            {/* Hiển thị ID lớn */}
            <div style={{ marginTop: '20px', padding: '20px', background: '#667eea', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>
                {t('yourId')}
              </p>
              <p style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
                {customerData?.customer?.id}
              </p>
              <p style={{ fontSize: '12px', opacity: 0.8 }}>
                {t('rememberId')}
              </p>
            </div>

            <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ textAlign: 'center', marginBottom: '12px' }}>
                <strong>{t('registeredInfo')}:</strong>
              </p>
              <p style={{ textAlign: 'center', marginBottom: '8px' }}>
                <strong>{t('name')}:</strong> {customerData?.customer?.name}
              </p>
              <p style={{ textAlign: 'center', marginBottom: '8px' }}>
                <strong>{t('phone')}:</strong> {customerData?.customer?.phone}
              </p>
              {customerData?.customer?.email && (
                <p style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <strong>{t('email')}:</strong> {customerData?.customer?.email}
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

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button 
                onClick={toggleLanguage}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px' }}
                title={t('language')}
              >
                {language === 'vi' ? '🇻🇳 VN' : '🇬🇧 EN'}
              </button>
              <button 
                onClick={handleNewCustomer}
                className="btn btn-secondary"
                style={{ flex: 2, padding: '12px' }}
              >
                {t('newRegistration')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CustomerForm;
