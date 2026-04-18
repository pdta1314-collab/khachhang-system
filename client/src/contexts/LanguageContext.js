import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const translations = {
  vi: {
    // Common
    logout: 'Đăng xuất',
    backToRegister: 'Quay lại đăng ký',
    language: 'Ngôn ngữ',
    
    // Customer Form
    registrationTitle: 'NHẬP THÔNG TIN ĐĂNG KÝ',
    fullName: 'Họ và tên',
    phone: 'Số điện thoại',
    email: 'Email',
    submit: 'Gửi thông tin',
    processing: 'Đang xử lý...',
    adminPage: 'Trang quản lý',
    registrationSuccess: 'Đăng ký thành công!',
    qrInstruction: 'Quý khách vui lòng quét mã QR bên dưới để tải video sau khi sự kiện kết thúc.',
    yourId: 'Số ID của bạn',
    rememberId: 'Vui lòng nhớ số ID này để nhận video',
    newRegistration: 'Đăng ký khách hàng mới',
    registeredInfo: 'Thông tin đã đăng ký',
    name: 'Họ tên',
    
    // Admin Dashboard
    customerManagement: 'Quản lý Khách hàng',
    welcome: 'Xin chào',
    exportCSV: 'Xuất CSV',
    scanGoogleDrive: 'Scan Google Drive',
    scanning: 'Đang scan...',
    filters: 'Bộ lọc',
    search: 'Tìm kiếm theo tên...',
    allStatus: 'Tất cả trạng thái',
    allVideo: 'Tất cả video',
    hasVideo: 'Có video',
    noVideo: 'Chưa có video',
    id: 'ID',
    status: 'Trạng thái',
    actions: 'Thao tác',
    view: 'Xem',
    delete: 'Xóa',
    edit: 'Sửa',
    images: 'Ảnh',
    upload: 'Tải lên',
    close: 'Đóng',
    customerInfo: 'Thông tin khách hàng',
    phoneNumber: 'Số điện thoại',
    pleaseRememberId: 'Vui lòng nhớ số ID này',
    qrForDownload: 'Mã QR để tải video',
    detailedInfo: 'Thông tin chi tiết',
    videoAvailable: '✅ Video đã sẵn sàng để tải xuống',
    
    // Video Download
    videoDownloadPage: 'Trang tải Video',
    fullNameLabel: 'Họ tên',
    phoneLabel: 'Số điện thoại',
    emailLabel: 'Email',
    registrationDate: 'Ngày đăng ký',
    registrationTime: 'Giờ đăng ký',
    downloadVideo: 'Tải video về máy',
    shareVideo: 'Chia sẻ video',
    downloading: 'Đang tải...',
    downloadInstructions: '📱 Hướng dẫn tải video:',
    step1: 'Bấm nút "Tải video về máy"',
    step2: 'Video sẽ mở trong tab mới',
    step3: 'Trên trình duyệt, bấm nút Tải xuống hoặc Download',
    step4: 'Chọn vị trí lưu video trên điện thoại/máy tính',
    shareHint: '💡 Chia sẻ video: Bấm nút "Chia sẻ video" để gửi link cho bạn bè hoặc người thân.',
    videoNotReady: 'Video chưa sẵn sàng',
    videoProcessing: 'Video của bạn đang được xử lý. Vui lòng quay lại sau hoặc liên hệ ban tổ chức sự kiện.',
    backToHome: 'Quay về trang chủ',
    copyLink: 'Sao chép link',
    linkCopied: 'Đã sao chép link!',
    error: 'Lỗi',
    notFound: 'Không tìm thấy thông tin khách hàng',
    back: 'Quay lại'
  },
  en: {
    // Common
    logout: 'Logout',
    backToRegister: 'Back to Registration',
    language: 'Language',
    
    // Customer Form
    registrationTitle: 'REGISTRATION INFORMATION',
    fullName: 'Full Name',
    phone: 'Phone Number',
    email: 'Email',
    submit: 'Submit',
    processing: 'Processing...',
    adminPage: 'Admin Page',
    registrationSuccess: 'Registration Successful!',
    qrInstruction: 'Please scan the QR code below to download your video after the event.',
    yourId: 'Your ID',
    rememberId: 'Please remember this ID to receive your video',
    newRegistration: 'New Registration',
    registeredInfo: 'Registered Information',
    name: 'Name',
    
    // Admin Dashboard
    customerManagement: 'Customer Management',
    welcome: 'Welcome',
    exportCSV: 'Export CSV',
    scanGoogleDrive: 'Scan Google Drive',
    scanning: 'Scanning...',
    filters: 'Filters',
    search: 'Search by name...',
    allStatus: 'All Status',
    allVideo: 'All Videos',
    hasVideo: 'Has Video',
    noVideo: 'No Video',
    id: 'ID',
    status: 'Status',
    actions: 'Actions',
    view: 'View',
    delete: 'Delete',
    edit: 'Edit',
    images: 'Images',
    upload: 'Upload',
    close: 'Close',
    customerInfo: 'Customer Information',
    phoneNumber: 'Phone Number',
    pleaseRememberId: 'Please remember this ID',
    qrForDownload: 'QR Code for Video Download',
    detailedInfo: 'Detailed Information',
    videoAvailable: '✅ Video is ready for download',
    
    // Video Download
    videoDownloadPage: 'Video Download',
    fullNameLabel: 'Full Name',
    phoneLabel: 'Phone Number',
    emailLabel: 'Email',
    registrationDate: 'Registration Date',
    registrationTime: 'Registration Time',
    downloadVideo: 'Download Video',
    shareVideo: 'Share Video',
    downloading: 'Downloading...',
    downloadInstructions: '📱 How to download video:',
    step1: 'Click "Download Video" button',
    step2: 'Video will open in new tab',
    step3: 'On browser, click Download button',
    step4: 'Choose save location on your device',
    shareHint: '💡 Share video: Click "Share Video" button to send link to friends or family.',
    videoNotReady: 'Video Not Ready',
    videoProcessing: 'Your video is being processed. Please check back later or contact event organizer.',
    backToHome: 'Back to Home',
    copyLink: 'Copy Link',
    linkCopied: 'Link copied!',
    error: 'Error',
    notFound: 'Customer information not found',
    back: 'Back'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'vi';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'vi' ? 'en' : 'vi');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
