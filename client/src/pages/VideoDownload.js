import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://web-production-a6a88.up.railway.app/api';

function VideoDownload() {
  const { uniqueId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomer();
  }, [uniqueId]);

  const fetchCustomer = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers/unique/${uniqueId}`);
      if (response.data.success) {
        setCustomer(response.data.customer);
      }
    } catch (err) {
      setError('Không tìm thấy thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (customer?.videoUrl) {
      const link = document.createElement('a');
      link.href = customer.videoUrl;
      link.download = `video-${customer.name}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="error-message">
            <h2 style={{ marginBottom: '16px' }}>Lỗi</h2>
            <p>{error}</p>
          </div>
          <a href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Quay về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#333', fontSize: '22px' }}>
          Trang tải Video
        </h1>

        <div style={{ marginBottom: '24px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ marginBottom: '12px' }}>
            <strong>Họ tên:</strong> {customer?.name}
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>Trang phục:</strong> {customer?.outfit}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            <strong>Ngày đăng ký:</strong> {new Date(customer?.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>

        {customer?.hasVideo ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <video 
                controls 
                style={{ width: '100%', borderRadius: '8px', maxHeight: '300px' }}
                src={customer?.videoUrl}
              >
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>

            <button 
              onClick={handleDownload}
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '18px', marginBottom: '12px' }}
            >
              Tải video về máy
            </button>

            <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
              Video có thể xem trực tiếp hoặc tải về để lưu trữ
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', background: '#fff3cd', borderRadius: '8px' }}>
            <p style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '500' }}>
              Video chưa sẵn sàng
            </p>
            <p style={{ color: '#666' }}>
              Video của bạn đang được xử lý. Vui lòng quay lại sau hoặc liên hệ ban tổ chức sự kiện.
            </p>
          </div>
        )}

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>
            Quay về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export default VideoDownload;
