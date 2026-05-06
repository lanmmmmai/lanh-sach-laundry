import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, markNotificationsAsRead } = useData();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markNotificationsAsRead();
    }
  };

  return (
    <header style={{ 
      height: '64px', 
      backgroundColor: 'var(--bg-card)', 
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'relative'
    }}>
      <div className="flex items-center gap-3">
        <button className="navbar-menu-btn btn btn-outline" style={{ border: 'none', padding: '0.25rem', margin: 0 }} onClick={toggleSidebar}>
          <Menu size={24} color="var(--text-main)" />
        </button>
        <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>Hệ thống quản lý</h2>
      </div>
      <div className="flex items-center gap-6">
        <div style={{ position: 'relative' }}>
          <button className="btn btn-outline" style={{ border: 'none', padding: '0.5rem', position: 'relative' }} onClick={toggleNotifications}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'red', color: 'white', fontSize: '10px', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div style={{ position: 'absolute', top: '100%', right: 0, width: '300px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', zIndex: 50, maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Thông báo</div>
              {notifications && notifications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' }}>
                      <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>{n.message}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(n.time).toLocaleString('vi-VN')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>Không có thông báo nào</div>
              )}
            </div>
          )}
        </div>
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
