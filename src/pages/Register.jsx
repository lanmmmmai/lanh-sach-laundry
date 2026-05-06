import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Waves } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const success = await registerAdmin(email, password, name);
    if (success) {
      navigate('/');
    } else {
      setError('Email này đã được sử dụng!');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Waves size={48} color="var(--primary)" />
          <h2>Đăng ký Chủ Tiệm</h2>
          <p className="text-muted">Tạo tài khoản quản lý hệ thống mới</p>
        </div>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">Họ và Tên / Tên Tiệm</label>
            <input 
              type="text" 
              className="input-field" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên"
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
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
              placeholder="Tạo mật khẩu"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            Đăng ký
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
            Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Đăng nhập</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
