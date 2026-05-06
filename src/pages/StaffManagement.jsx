import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Plus, Building2 } from 'lucide-react';

const StaffManagement = () => {
  const { users, addStaff, updateStaff, deleteStaff } = useAuth();
  const { branches } = useData();
  
  const [showModal, setShowModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', branchId: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const staffList = users.filter(u => u.role === 'staff');

  const openAddModal = () => {
    setEditingId(null);
    setNewStaff({ name: '', email: '', password: '', branchId: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (staff) => {
    setEditingId(staff.id);
    setNewStaff({ name: staff.name, email: staff.email, password: staff.password, branchId: staff.branchId });
    setError('');
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này không?')) {
      deleteStaff(id);
    }
  };

  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!newStaff.branchId) {
      setError('Vui lòng chọn cơ sở làm việc!');
      return;
    }
    
    if (editingId) {
      updateStaff(editingId, newStaff);
      setShowModal(false);
      setEditingId(null);
    } else {
      const success = addStaff(newStaff.email, newStaff.password, newStaff.name, newStaff.branchId);
      if (success) {
        setShowModal(false);
        setNewStaff({ name: '', email: '', password: '', branchId: '' });
        setError('');
      } else {
        setError('Email này đã tồn tại!');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>Quản lý Nhân Viên</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Thêm nhân viên
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ và Tên</th>
                <th>Email (Tài khoản)</th>
                <th>Cơ sở làm việc</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(staff => {
                const branch = branches.find(b => b.id === staff.branchId);
                return (
                  <tr key={staff.id}>
                    <td className="font-semibold">#{staff.id}</td>
                    <td>{staff.name}</td>
                    <td>{staff.email}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-muted" />
                        {branch ? branch.name : 'Chưa phân bổ'}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline" onClick={() => openEditModal(staff)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Sửa</button>
                        <button className="btn btn-outline" onClick={() => handleDelete(staff.id)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có nhân viên nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 className="mb-4">{editingId ? 'Sửa Nhân viên' : 'Thêm Nhân viên mới'}</h3>
            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
            
            <form onSubmit={handleSaveStaff}>
              <div className="input-group">
                <label className="input-label">Họ và Tên</label>
                <input type="text" className="input-field" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Email đăng nhập</label>
                <input type="email" className="input-field" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} disabled={!!editingId} />
              </div>
              <div className="input-group">
                <label className="input-label">Mật khẩu</label>
                <input type="text" className="input-field" required value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Chọn cơ sở</label>
                <select className="input-field" required value={newStaff.branchId} onChange={e => setNewStaff({...newStaff, branchId: e.target.value})}>
                  <option value="">-- Chọn cơ sở --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Cập nhật' : 'Lưu nhân viên'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
