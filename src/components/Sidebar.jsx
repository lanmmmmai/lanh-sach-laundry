import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, PlusCircle, Users, Settings, Waves, Building2, List, Calendar } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { path: '/', name: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { path: '/orders', name: 'Đơn hàng', icon: <ShoppingCart size={20} /> },
    { path: '/create-order', name: 'Tạo đơn mới', icon: <PlusCircle size={20} /> },
    { path: '/timesheet', name: isAdmin ? 'Chấm công & Lương' : 'Chấm công', icon: <Calendar size={20} /> },
    ...(isAdmin ? [
      { path: '/services', name: 'Dịch vụ', icon: <List size={20} /> },
      { path: '/branches', name: 'Cơ sở', icon: <Building2 size={20} /> },
      { path: '/staff', name: 'Nhân viên', icon: <Users size={20} /> },
    ] : []),
    { path: '/settings', name: 'Cài đặt', icon: <Settings size={20} /> }
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{
        width: '260px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 1.5rem', borderBottom: '1px solid var(--border-color)', gap: '0.75rem' }}>
          <Waves size={28} color="var(--primary)" />
          <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--primary)', fontWeight: '800', letterSpacing: '-0.5px' }}>GiatKy</h1>
        </div>
        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              onClick={() => setIsOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'white' : 'var(--text-main)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                transition: 'var(--transition)'
              })}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
