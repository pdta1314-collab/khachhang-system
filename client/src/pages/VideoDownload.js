import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = '/api';

function VideoDownload() {
  const { uniqueId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [uniqueId]);

  const fetchCustomer = async () => {
    try {
      console.log('Fetching customer with uniqueId:', uniqueId);
      const response = await axios.get(`${API_URL}/customers/unique/${uniqueId}`);
      console.log('API response:', response.data);
      if (response.data.success) {
        setCustomer(response.data.customer);
      } else {
        setError('Không tìm thấy thông tin khách hàng');
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      console.error('Error response:', err.response?.data);
      setError('Lỗi: ' + (err.response?.data?.error || err.message || 'Không tìm thấy thông tin khách hàng'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    console.log('handleDownload called');
    console.log('customer:', customer);
    console.log('videoUrl:', customer?.videoUrl);
    
    if (!customer?.videoUrl) {
      console.error('No video URL available');
      alert('Không tìm thấy link video. Vui lòng liên hệ ban tổ chức.');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      console.log('Downloading video from:', customer.videoUrl);
      // Mở video trong tab mới - cách đơn giản và hoạt động tốt nhất
      window.open(customer.videoUrl, '_blank');
      alert('Video đã mở trong tab mới. Bạn có thể tải xuống từ trình duyệt.');
    } catch (err) {
      console.error('Download error:', err);
      alert('Lỗi khi tải video: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    console.log('handleShare called');
    console.log('customer:', customer);
    console.log('videoUrl:', customer?.videoUrl);
    
    if (!customer?.videoUrl) {
      console.error('No video URL available');
      alert('Không tìm thấy link video. Vui lòng liên hệ ban tổ chức.');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Use Web Share API with URL (most reliable)
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `Video của ${customer.name}`,
          text: `Video của ${customer.name} - tải tại: ${customer.videoUrl}`,
          url: customer.videoUrl
        });
        console.log('Share successful');
        return;
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(customer.videoUrl);
        alert('Đã copy link video! Bạn có thể gửi link này cho người khác.');
      }
    } catch (err) {
      console.error('Share error:', err);
      // Fallback: Copy link
      try {
        await navigator.clipboard.writeText(customer.videoUrl);
        alert('Đã copy link video! Bạn có thể gửi link này cho người khác.');
      } catch (copyErr) {
        console.error('Copy failed:', copyErr);
        alert('Không thể chia sẻ. Vui lòng copy link từ trình duyệt.');
      }
    } finally {
      setIsDownloading(false);
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
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
        {/* Logo nhỏ ở trên */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              marginBottom: '16px'
            }}
          />
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#333', fontSize: '22px' }}>
          Trang tải Video
        </h1>

        <div style={{ marginBottom: '24px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ marginBottom: '12px' }}>
            <strong>Họ tên:</strong> {customer?.name}
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>Số điện thoại:</strong> {customer?.phone}
          </p>
          {customer?.email && (
            <p style={{ marginBottom: '12px' }}>
              <strong>Email:</strong> {customer.email}
            </p>
          )}
          <p style={{ fontSize: '14px', color: '#666' }}>
            <strong>Ngày đăng ký:</strong> {new Date(customer?.registrationTime || customer?.createdAt).toLocaleDateString('vi-VN')}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            <strong>Giờ đăng ký:</strong> {new Date(customer?.registrationTime || customer?.createdAt).toLocaleTimeString('vi-VN')}
          </p>
        </div>

        {customer?.hasVideo ? (
          <div>
            {/* Hiển thị số lượng video */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#d4edda', 
              border: '1px solid #28a745', 
              borderRadius: '8px', 
              marginBottom: '16px',
              fontSize: '14px',
              color: '#155724',
              textAlign: 'center'
            }}>
              <strong>✅ Video đã sẵn sàng để tải xuống</strong>
            </div>

            {/* Nút Tải về - mở video trong tab mới */}
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: isDownloading ? '#ccc' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                marginBottom: '12px'
              }}
            >
              {isDownloading ? 'Đang tải...' : '📥 Tải video về máy'}
            </button>

            {/* Nút Chia sẻ - chia sẻ link video */}
            <button 
              onClick={handleShare}
              disabled={isDownloading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isDownloading ? 'not-allowed' : 'pointer'
              }}
            >
              📤 Chia sẻ video
            </button>

            {/* Hướng dẫn */}
            <div style={{ 
              marginTop: '12px', 
              padding: '16px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '8px', 
              fontSize: '13px',
              color: '#1565c0',
              lineHeight: '1.6'
            }}>
              <strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>📱 Hướng dẫn tải video:</strong>
              <ol style={{ marginTop: '8px', paddingLeft: '20px', marginBottom: '8px' }}>
                <li style={{ marginBottom: '6px' }}>Bấm nút <strong>"📥 Tải video về máy"</strong></li>
                <li style={{ marginBottom: '6px' }}>Video sẽ mở trong tab mới</li>
                <li style={{ marginBottom: '6px' }}>Trên trình duyệt, bấm nút <strong>Tải xuống</strong> hoặc <strong>Download</strong></li>
                <li style={{ marginBottom: '6px' }}>Chọn vị trí lưu video trên điện thoại/máy tính</li>
              </ol>
              <p style={{ marginTop: '8px', marginBottom: '4px' }}><strong>💡 Chia sẻ video:</strong> Bấm nút <strong>"📤 Chia sẻ video"</strong> để gửi link cho bạn bè hoặc người thân.</p>
            </div>

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
