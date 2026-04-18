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
  const [canShare, setCanShare] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    fetchCustomer();
    // Kiểm tra Web Share API sau khi mount
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
    setIsIOS(typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent));
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
    if (!customer?.videoUrl) {
      console.error('No video URL available');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      console.log('Downloading video from:', customer.videoUrl);
      // Mở video trong tab mới - cách đơn giản và hoạt động tốt nhất
      window.open(customer.videoUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      alert('Lỗi khi tải video: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!customer?.videoUrl) {
      console.error('No video URL available');
      return;
    }
    
    // Sử dụng Web Share API nếu có (tốt cho mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Video của ${customer.name}`,
          text: `Video của ${customer.name} - tải tại: ${customer.videoUrl}`,
          url: customer.videoUrl
        });
        return;
      } catch (err) {
        console.log('Share failed, falling back to copy link');
      }
    }
    
    // Fallback: Copy link to clipboard
    try {
      await navigator.clipboard.writeText(customer.videoUrl);
      alert('Đã copy link video! Bạn có thể gửi link này cho người khác.');
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Không thể copy link. Vui lòng copy link thủ công từ trình duyệt.');
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

            {/* Nút Tải về - hỗ trợ cả Android và iOS */}
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

            {/* Nút Chia sẻ - chỉ hiện trên mobile hỗ trợ Web Share API */}
            {canShare && (
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
            )}

            {/* Hướng dẫn cho iOS */}
            {isIOS && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                backgroundColor: '#e3f2fd', 
                borderRadius: '8px', 
                fontSize: '12px',
                color: '#1565c0'
              }}>
                <strong>Hướng dẫn iOS:</strong> Bấm tải về, sau đó dùng app "Files" để xem video.
                <strong>💡 Hướng dẫn lưu video trên iPhone/iPad:</strong>
                <ol style={{ marginTop: '8px', paddingLeft: '16px' }}>
                  <li>Bấm "Tải video về máy"</li>
                  <li>Video sẽ mở trong tab mới</li>
                  <li>Bấm nút Share (⬆️) dưới video</li>
                  <li>Chọn "Lưu vào Files" hoặc "Lưu Video"</li>
                </ol>
              </div>
            )}

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
