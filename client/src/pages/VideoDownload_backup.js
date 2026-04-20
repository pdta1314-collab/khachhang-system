// BACKUP - Phiên bản gốc trước khi đổi sang link thẳng
// Ngày backup: 20/04/2025

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './VideoDownload.css';

const API_URL = '/api';

function VideoDownload() {
  const { uniqueId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('VideoDownload mounted with uniqueId:', uniqueId);
    fetchCustomer();
  }, [uniqueId]);

  const fetchCustomer = async () => {
    try {
      console.log('Fetching customer with uniqueId:', uniqueId);
      const response = await axios.get(`${API_URL}/customers/unique/${uniqueId}`);
      console.log('Customer response:', response.data);
      
      if (response.data.success) {
        setCustomer(response.data.customer);
      } else {
        setError('Không tìm thấy thông tin khách hàng');
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Có lỗi xảy ra khi tải thông tin. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (videoUrl, index) => {
    console.log('handleDownload called for video', index, videoUrl);
    
    if (!videoUrl) {
      alert('Không tìm thấy link video. Vui lòng liên hệ ban tổ chức.');
      return;
    }
    
    // Cách tải tốt nhất cho cả mobile và desktop
    if (videoUrl.includes('drive.google.com')) {
      // Với Google Drive, tạo iframe ẩn để force download
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = videoUrl;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 5000);
      
      alert('Video ' + (index + 1) + ' đang được tải. Vui lòng kiểm tra thông báo tải xuống của trình duyệt.');
    } else {
      // Link trực tiếp - dùng thẻ a với download
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `video_${customer?.name}_${index + 1}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Tải tất cả video cùng lúc
  const handleDownloadAll = () => {
    console.log('handleDownloadAll called');
    console.log('Total videos:', customer?.videoUrls?.length);
    
    if (!customer?.videoUrls || customer.videoUrls.length === 0) {
      alert('Không có video nào để tải.');
      return;
    }
    
    // Tải từng video với delay để tránh chặn trình duyệt
    customer.videoUrls.forEach((videoUrl, index) => {
      setTimeout(() => {
        console.log('Auto downloading video', index + 1);
        if (videoUrl.includes('drive.google.com')) {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = videoUrl;
          document.body.appendChild(iframe);
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 5000);
        } else {
          const link = document.createElement('a');
          link.href = videoUrl;
          link.download = `video_${customer?.name}_${index + 1}.mp4`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }, index * 1000); // Delay 1 giây giữa các video
    });
    
    alert(`Đang tải ${customer.videoUrls.length} video. Vui lòng kiểm tra thông báo tải xuống của trình duyệt.`);
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
    
    const shareUrl = window.location.href;
    console.log('Share URL:', shareUrl);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Video của ${customer?.name}`,
          text: `Xem và tải video của ${customer?.name}`,
          url: shareUrl
        });
        console.log('Shared successfully');
      } catch (err) {
        console.log('Error sharing:', err);
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Đã sao chép link vào clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Đã sao chép link vào clipboard!');
    });
  };

  if (loading) {
    return (
      <div className="video-download-container" style={{ 
        backgroundImage: `url('/bg.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          padding: '40px', 
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '20px', color: '#666' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-download-container" style={{ 
        backgroundImage: `url('/bg.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          padding: '40px', 
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="video-download-container" style={{ 
        backgroundImage: `url('/bg.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          padding: '40px', 
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div className="error-message">Không tìm thấy thông tin khách hàng</div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-download-container" style={{ 
      backgroundImage: `url('/bg.jpeg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="video-download-card" style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        padding: '32px', 
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div className="customer-info" style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>
            Thông tin khách hàng
          </h1>
          <div className="info-item" style={{ marginBottom: '12px' }}>
            <span style={{ color: '#666' }}>Họ tên: </span>
            <strong style={{ color: '#333', fontSize: '18px' }}>{customer.name}</strong>
          </div>
          <div className="info-item" style={{ marginBottom: '12px' }}>
            <span style={{ color: '#666' }}>Trang phục: </span>
            <strong style={{ color: '#333' }}>{customer.outfit}</strong>
          </div>
          <div className="info-item" style={{ marginBottom: '12px' }}>
            <span style={{ color: '#666' }}>Số điện thoại: </span>
            <strong style={{ color: '#333' }}>{customer.phone}</strong>
          </div>
          <div className="info-item">
            <span style={{ color: '#666' }}>Số video: </span>
            <strong style={{ color: '#333' }}>{customer.videoCount || 0}</strong>
          </div>
        </div>

        {customer.videoUrls && customer.videoUrls.length > 0 ? (
          <div className="download-section" style={{ textAlign: 'center' }}>
            <p style={{ 
              fontSize: '16px', 
              color: '#666', 
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              🎉 Video của bạn đã sẵn sàng!
            </p>

            {/* Nút tải tất cả */}
            {customer.videoCount > 1 && (
              <button 
                onClick={handleDownloadAll}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>📥</span>
                TẢI TẤT CẢ {customer.videoCount} VIDEO
              </button>
            )}

            {/* Danh sách video riêng lẻ */}
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '15px' }}>
                Hoặc tải từng video:
              </p>
              {customer.videoUrls.map((videoUrl, index) => (
                <div key={index} style={{ 
                  marginBottom: '12px',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                    Video {index + 1} {videoUrl.includes('drive.google.com') && '- Google Drive'}
                  </p>
                  <button 
                    onClick={() => handleDownload(videoUrl, index)}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    📥 Tải video {index + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Video đang được xử lý. Vui lòng quay lại sau.
            </p>
            <button 
              onClick={fetchCustomer}
              style={{
                padding: '12px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🔄 Kiểm tra lại
            </button>
          </div>
        )}

        <button 
          onClick={handleShare}
          className="share-btn"
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: '16px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🔗</span>
          Chia sẻ link
        </button>
      </div>
    </div>
  );
}

export default VideoDownload;
