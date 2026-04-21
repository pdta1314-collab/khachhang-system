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
    // Load downloaded videos from localStorage
    const savedDownloads = localStorage.getItem(`downloaded_videos_${uniqueId}`);
    if (savedDownloads) {
      setDownloadedVideos(new Set(JSON.parse(savedDownloads)));
    }
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

    // Đánh dấu video đã tải và lưu vào localStorage
    const newDownloaded = new Set([...downloadedVideos, index]);
    setDownloadedVideos(newDownloaded);
    localStorage.setItem(`downloaded_videos_${uniqueId}`, JSON.stringify([...newDownloaded]));

    // Tạo link ẩn để tải video - không target='_blank' để tải trực tiếp
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video_${customer?.name || 'customer'}_${index + 1}.mp4`;
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
            zIndex: 0
          }}
        >
          <source src="/trumso.mp4" type="video/mp4" />
        </video>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '40px' }}>
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (error) {
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
            zIndex: 0
          }}
        >
          <source src="/trumso.mp4" type="video/mp4" />
        </video>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div className="error-message">
            <h2 style={{ marginBottom: '16px', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Lỗi</h2>
            <p style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{error}</p>
          </div>
          <a href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Quay về trang chủ
          </a>
        </div>
      </div>
      </>
    );
  }

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
          zIndex: 0
        }}
      >
        <source src="/trumso.mp4" type="video/mp4" />
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

      <div style={{ width: '100%', maxWidth: '500px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#fff', fontSize: '32px', fontWeight: 'bold', textTransform: 'uppercase', textShadow: '0 0 10px #00f, 0 0 20px #00f, 0 0 30px #00f, 0 0 40px #0ff, 0 2px 4px rgba(0,0,0,0.5)', animation: 'neonPulse 2s ease-in-out infinite' }}>
          TRANG TẢI VIDEO
        </h1>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ marginBottom: '12px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            <strong>Họ tên:</strong> {customer?.name}
          </p>
          <p style={{ marginBottom: '12px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            <strong>Số điện thoại:</strong> {customer?.phone}
          </p>
          {customer?.email && (
            <p style={{ marginBottom: '12px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              <strong>Email:</strong> {customer.email}
            </p>
          )}
          <p style={{ fontSize: '14px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            <strong>Ngày đăng ký:</strong> {new Date(customer?.registrationTime || customer?.createdAt).toLocaleDateString('vi-VN')}
          </p>
          <p style={{ fontSize: '14px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            <strong>Giờ đăng ký:</strong> {new Date(customer?.registrationTime || customer?.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {customer?.videoCount > 0 ? (
          <div>
            {/* Danh sách các video */}
            {customer.videoUrls?.map((videoUrl, index) => (
              <div key={index} style={{
                marginBottom: '16px'
              }}>
                <div style={{
                  marginBottom: '12px',
                  fontWeight: 'bold',
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
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
              fontSize: '13px',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              lineHeight: '1.6'
            }}>
              <strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>📱 Hướng dẫn tải video:</strong>
              
              {/* Android */}
              <div style={{ marginTop: '12px', marginBottom: '8px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <strong style={{ fontSize: '14px', marginBottom: '6px', display: 'block', color: '#4fc3f7' }}>🤖 Android:</strong>
                <ol style={{ marginTop: '6px', paddingLeft: '18px', marginBottom: '4px' }}>
                  <li style={{ marginBottom: '4px' }}>
                    Trong Zalo, chọn quét mã QR <img src="/qr_code_scanner_24dp_CCCCCC_FILL0_wght400_GRAD0_opsz24.png" alt="qr scanner" style={{ width: '20px', height: '20px', verticalAlign: 'middle', margin: '0 4px' }} /> (ở trên góc phải)
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    Chọn Ảnh có sẵn → Chọn Ảnh mã QR đã chụp → Bấm Mở link
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    Bấm Tải video → Video sẽ tự động tải về thư mục ảnh
                  </li>
                </ol>
              </div>

              {/* iOS */}
              <div style={{ marginTop: '8px', marginBottom: '8px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <strong style={{ fontSize: '14px', marginBottom: '6px', display: 'block', color: '#81c784' }}>🍎 iOS (Safari):</strong>
                <ol style={{ marginTop: '6px', paddingLeft: '18px', marginBottom: '4px' }}>
                  <li style={{ marginBottom: '4px' }}>
                    Trong Zalo, bấm vào dấu <img src="/icons8-more-25.png" alt="more" style={{ width: '20px', height: '20px', verticalAlign: 'middle', margin: '0 4px' }} /> (ở trên góc phải) → Chọn "Mở bằng Safari"
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    Bấm tải video → Thông báo hiện ra → Bấm Tải về
                  </li>
                  <li style={{ marginBottom: '4px' }}>
                    Bấm phần tải về <img src="/icons8-scroll-down-25.png" alt="downloads" style={{ width: '20px', height: '20px', verticalAlign: 'middle', margin: '0 4px' }} /> ở thanh tìm kiếm → Bấm tải về → Trong Bản tải về, bấm vào từng video để xem → Bấm vào dấu <img src="/icons8-share-rounded-48.png" alt="share" style={{ width: '20px', height: '20px', verticalAlign: 'middle', margin: '0 4px' }} /> (ở dưới góc phải) → Bấm Lưu video <img src="/icons8-download-48.png" alt="save" style={{ width: '20px', height: '20px', verticalAlign: 'middle', margin: '0 4px' }} />
                  </li>
                </ol>
              </div>

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
    </>
  );
}

export default VideoDownload;
