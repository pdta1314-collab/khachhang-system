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
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundImage: 'url(/trumso.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255, 255, 255, 0.85)', borderRadius: '16px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#333', fontSize: '24px' }}>
          Đăng nhập Admin
        </h1>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
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
            <label htmlFor="password">Password</label>
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
          <p style={{ fontSize: '14px', color: '#666' }}>
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
  );
}

export default Login;
