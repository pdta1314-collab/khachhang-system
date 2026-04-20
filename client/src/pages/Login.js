import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = '/api';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập username và password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/admin/login`, {
        username: username.trim(),
        password: password.trim()
      });

      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Hình nền nằm trên video - khung ở giữa */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '400px',
        height: 'auto',
        aspectRatio: '16/9',
        backgroundImage: 'url(/trumso.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderRadius: '20px',
        zIndex: 1
      }} />

      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', zIndex: 2 }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#fff', fontSize: '24px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          Đăng nhập Admin
        </h1>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập password"
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
                Đang đăng nhập...
              </span>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            Default: admin / admin123
          </p>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>
            Quay về trang chủ
          </a>
        </div>
      </div>
    </div>
    </>
  );
}

export default Login;
