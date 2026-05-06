import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const Settings = () => {
  const { user, updateUser, registerAdmin, isMainAdmin } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState(user?.password || '');
  const [message, setMessage] = useState('');

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    updateUser(user.id, { name, password });
    setMessage('Cập nhật thông tin thành công!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const ok = await registerAdmin(newAdminEmail, newAdminPass, newAdminName);
    if (ok) {
      setAdminMessage('Thêm tài khoản Admin thành công!');
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPass('');
    } else {
      setAdminMessage('Thêm thất bại. Có thể email đã tồn tại.');
    }
    setTimeout(() => setAdminMessage(''), 3000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={24} color="var(--primary)" />
          Cài đặt tài khoản
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="mb-4">Thông tin cá nhân</h3>
          {message && <div style={{ padding: '0.75rem', backgroundColor: '#dcfce3', color: '#166534', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}
          
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Email đăng nhập</label>
              <input type="email" className="input-field" value={user?.email} disabled style={{ backgroundColor: '#f3f4f6' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Email không thể thay đổi</span>
            </div>
            
            <div className="input-group">
              <label className="input-label">Vai trò</label>
              <input type="text" className="input-field" value={user?.role === 'admin' ? (isMainAdmin ? 'Tài khoản Chính (Super Admin)' : 'Quản trị viên (Admin)') : 'Nhân viên (Staff)'} disabled style={{ backgroundColor: '#f3f4f6' }} />
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

        {isMainAdmin && (
          <div className="card">
            <h3 className="mb-4">Thêm tài khoản Admin</h3>
            {adminMessage && <div style={{ padding: '0.75rem', backgroundColor: adminMessage.includes('thành công') ? '#dcfce3' : '#fee2e2', color: adminMessage.includes('thành công') ? '#166534' : '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{adminMessage}</div>}
            
            <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Email đăng nhập</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required 
                  placeholder="admin2@test.com"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Họ và Tên</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  required 
                  placeholder="Quản lý chi nhánh"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Mật khẩu</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  required 
                  placeholder="Mật khẩu"
                />
              </div>

              <button type="submit" className="btn btn-primary bg-success border-success mt-4">
                Tạo tài khoản Admin
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
