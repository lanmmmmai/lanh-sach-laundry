import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Waves } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result && result.success) {
      navigate('/');
    } else {
      setError(result?.message || 'Email hoặc mật khẩu không đúng.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Waves size={48} color="var(--primary)" />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.25rem' }}>GiatKy</h2>
          <p className="text-muted">Nền tảng Quản lý Tiệm Giặt ủi Toàn diện</p>
        </div>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Mật khẩu</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            Đăng nhập
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
            Chưa có tài khoản chủ tiệm? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Đăng ký ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
