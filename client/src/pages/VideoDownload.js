import React, { useState, useEffect, useRef } from 'react';
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
  const videoRef = useRef(null);

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
    if (!customer?.videoUrl) return;
    
    setIsDownloading(true);
    
    try {
      // Tải video dưới dạng blob để hỗ trợ tốt trên mobile
      const response = await fetch(customer.videoUrl);
      const blob = await response.blob();
      
      // Tạo URL từ blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Tạo link tải
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `video-${customer.name}-${customer.id}.mp4`;
      
      // Đối với iOS Safari, cần mở trong tab mới
      const isIOSDevice = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOSDevice) {
        // iOS: Mở video trong tab mới để người dùng có thể "Share" → "Save to Files"
        window.open(customer.videoUrl, '_blank');
      } else {
        // Android và desktop: Tải trực tiếp
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Cleanup
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: Mở video trong tab mới nếu download thất bại
      window.open(customer.videoUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!customer?.videoUrl) return;
    
    // Sử dụng Web Share API nếu có (tốt cho mobile)
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const response = await fetch(customer.videoUrl);
        const blob = await response.blob();
        const file = new File([blob], `video-${customer.name}.mp4`, { type: 'video/mp4' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Video của ${customer.name}`,
            text: 'Video từ sự kiện',
            files: [file]
          });
          return;
        }
      } catch (err) {
        console.log('Share failed, falling back to download');
      }
    }
    
    // Fallback: Download
    handleDownload();
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
        </div>

        {customer?.hasVideo ? (
          <div>
            {/* Video Player với controls đầy đủ cho mobile */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              {/* Debug info */}
              <div style={{ padding: '8px', background: '#f0f0f0', fontSize: '11px', marginBottom: '8px', wordBreak: 'break-all' }}>
                <strong>Video URL:</strong> {customer?.videoUrl || 'Không có'}
              </div>
              
              <video 
                ref={videoRef}
                controls 
                controlsList="nodownload"
                playsInline
                preload="metadata"
                style={{ 
                  width: '100%', 
                  borderRadius: '8px', 
                  maxHeight: '400px',
                  backgroundColor: '#000'
                }}
                src={customer?.videoUrl}
                onError={(e) => {
                  console.error('Video error event:', e);
                  console.error('Video error details:', e.target?.error);
                  console.error('Video src:', e.target?.src);
                  setError(`Lỗi tải video: ${e.target?.error?.message || 'Không xác định'}. Thử tải về máy.`);
                }}
                onLoadedMetadata={(e) => {
                  console.log('Video loaded successfully:', e.target.src);
                  console.log('Video duration:', e.target.duration);
                }}
              >
                <source src={customer?.videoUrl} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>

            {/* Nút Tải về - hỗ trợ cả Android và iOS */}
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                padding: '16px', 
                fontSize: '18px', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isDownloading ? (
                <>
                  <span>⏳</span> Đang tải...
                </>
              ) : (
                <>
                  <span>⬇️</span> Tải video về máy
                </>
              )}
            </button>

            {/* Nút Chia sẻ - chỉ hiện nếu Web Share API hỗ trợ */}
            {canShare && (
              <button 
                onClick={handleShare}
                className="btn btn-secondary"
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  fontSize: '16px', 
                  marginBottom: '12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <span>📤</span> Chia sẻ video
              </button>
            )}

            {/* Hướng dẫn cho iOS */}
            {isIOS && (
              <div style={{ 
                padding: '12px', 
                background: '#e7f3ff', 
                borderRadius: '8px', 
                marginBottom: '12px',
                fontSize: '13px'
              }}>
                <strong>💡 Hướng dẫn lưu video trên iPhone/iPad:</strong>
                <ol style={{ marginTop: '8px', paddingLeft: '16px' }}>
                  <li>Bấm "Tải video về máy"</li>
                  <li>Video sẽ mở trong tab mới</li>
                  <li>Bấm nút Share (⬆️) dưới video</li>
                  <li>Chọn "Lưu vào Files" hoặc "Lưu Video"</li>
                </ol>
              </div>
            )}

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
