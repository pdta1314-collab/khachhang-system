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
  const [downloadedVideos, setDownloadedVideos] = useState(new Set());

  useEffect(() => {
    fetchCustomer();
  }, [uniqueId]);

  const fetchCustomer = async () => {
    try {
      console.log('Fetching customer with uniqueId:', uniqueId);
      const response = await axios.get(`${API_URL}/customers/unique/${uniqueId}`);
      console.log('API response:', response.data);
      if (response.data.success) {
        const customerData = response.data.customer;
        // Ghép domain nếu server trả về relative path
        if (customerData.videoUrl && customerData.videoUrl.startsWith('/')) {
          customerData.videoUrl = window.location.origin + customerData.videoUrl;
        }
        setCustomer(customerData);
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

  const handleDownload = (videoUrl, index) => {
    console.log('handleDownload called for video', index, videoUrl);

    if (!videoUrl) {
      alert('Không tìm thấy link video. Vui lòng liên hệ ban tổ chức.');
      return;
    }

    setIsDownloading(true);

    // Đánh dấu video đã tải
    setDownloadedVideos(prev => new Set([...prev, index]));

    // Tạo link ẩn để tải video
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video_${customer?.name || 'customer'}_${index + 1}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 1000);
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
        <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#333', fontSize: '32px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          TRANG TẢI VIDEO
        </h1>

        <div style={{ marginBottom: '24px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
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
            <strong>Giờ đăng ký:</strong> {new Date(customer?.registrationTime || customer?.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {customer?.videoCount > 0 ? (
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
              <strong>✅ Có {customer.videoCount} video đã sẵn sàng để tải</strong>
            </div>

            {/* Danh sách các video */}
            {customer.videoUrls?.map((videoUrl, index) => (
              <div key={index} style={{
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ 
                  marginBottom: '12px', 
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  🎬 Video {index + 1} {customer.videoCount > 1 ? `/${customer.videoCount}` : ''}
                </div>
                
                {/* Nút Tải về cho từng video */}
                <button
                  onClick={() => handleDownload(videoUrl, index)}
                  disabled={isDownloading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: downloadedVideos.has(index) ? '#10b981' : isDownloading ? '#999' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: isDownloading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {downloadedVideos.has(index) ? `✅ Đã tải video ${index + 1}` : isDownloading ? '⏳ Đang tải...' : `📥 Tải video ${index + 1}`}
                </button>
              </div>
            ))}

            {/* Nút Chia sẻ - chia sẻ link tất cả video */}
            {customer.videoCount === 1 && (
              <button 
                onClick={handleShare}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                📤 Chia sẻ video
              </button>
            )}

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
                <li style={{ marginBottom: '6px' }}>Bấm nút <strong>"📥 Tải video"</strong> cho từng video</li>
                <li style={{ marginBottom: '6px' }}>Trên mobile: Video sẽ tải tự động hoặc mở trong trình duyệt</li>
                <li style={{ marginBottom: '6px' }}>Trên máy tính: Kiểm tra thư mục Downloads</li>
                <li style={{ marginBottom: '6px' }}>Nếu không tải được, giữ nút và chọn "Tải liên kết"</li>
              </ol>
              <p style={{ marginTop: '8px', marginBottom: '4px' }}><strong>💡 Lưu ý:</strong> Mỗi video cần tải riêng lẻ. Vui lòng đợi video 1 tải xong trước khi tải video 2.</p>
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
