import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{ 
      height: '64px', 
      backgroundColor: 'var(--bg-card)', 
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem'
    }}>
      <div className="flex items-center gap-3">
        <button className="navbar-menu-btn btn btn-outline" style={{ border: 'none', padding: '0.25rem', margin: 0 }} onClick={toggleSidebar}>
          <Menu size={24} color="var(--text-main)" />
        </button>
        <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>Hệ thống quản lý</h2>
      </div>
      <div className="flex items-center gap-6">
        <button className="btn btn-outline" style={{ border: 'none', padding: '0.5rem' }}>
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="var(--primary)" />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{user?.name}</div>
            <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ border: 'none', padding: '0.5rem', color: 'var(--danger)' }} title="Đăng xuất">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
