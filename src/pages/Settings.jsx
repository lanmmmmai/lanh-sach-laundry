import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState(user?.password || '');
  const [message, setMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    updateUser(user.id, { name, password });
    setMessage('Cập nhật thông tin thành công!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={24} color="var(--primary)" />
          Cài đặt tài khoản
        </h2>
      </div>

      <div className="card" style={{ maxWidth: '500px' }}>
        {message && <div style={{ padding: '0.75rem', backgroundColor: '#dcfce3', color: '#166534', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Email đăng nhập</label>
            <input type="email" className="input-field" value={user?.email} disabled style={{ backgroundColor: '#f3f4f6' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Email không thể thay đổi</span>
          </div>
          
          <div className="input-group">
            <label className="input-label">Vai trò</label>
            <input type="text" className="input-field" value={user?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Nhân viên (Staff)'} disabled style={{ backgroundColor: '#f3f4f6' }} />
          </div>

          <div className="input-group">
            <label className="input-label">Tên hiển thị</label>
            <input 
              type="text" 
              className="input-field" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Mật khẩu mới</label>
            <input 
              type="text" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Lưu thay đổi
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
