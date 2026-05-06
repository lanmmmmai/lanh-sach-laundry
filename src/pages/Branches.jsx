import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, MapPin } from 'lucide-react';

const Branches = () => {
  const { branches, addBranch, updateBranch, deleteBranch } = useData();
  const [showModal, setShowModal] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });
  const [editingId, setEditingId] = useState(null);

  const openAddModal = () => {
    setEditingId(null);
    setNewBranch({ name: '', address: '' });
    setShowModal(true);
  };

  const openEditModal = (branch) => {
    setEditingId(branch.id);
    setNewBranch({ name: branch.name, address: branch.address });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cơ sở này không?')) {
      deleteBranch(id);
    }
  };

  const handleSaveBranch = (e) => {
    e.preventDefault();
    if (editingId) {
      updateBranch(editingId, newBranch);
    } else {
      addBranch(newBranch);
    }
    setShowModal(false);
    setNewBranch({ name: '', address: '' });
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>Quản lý Cơ Sở (Chi nhánh)</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Thêm cơ sở
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="card">
            <h3 className="mb-2" style={{ color: 'var(--primary)' }}>{branch.name}</h3>
            <div className="flex items-center gap-2 text-muted mb-4">
              <MapPin size={16} />
              <span>{branch.address}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => openEditModal(branch)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Sửa</button>
              <button className="btn btn-outline" onClick={() => handleDelete(branch.id)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Xóa</button>
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="col-span-2 text-center text-muted" style={{ gridColumn: 'span 2', padding: '2rem' }}>
            Chưa có cơ sở nào. Vui lòng thêm mới.
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 className="mb-4">{editingId ? 'Sửa Cơ sở' : 'Thêm Cơ sở mới'}</h3>
            <form onSubmit={handleSaveBranch}>
              <div className="input-group">
                <label className="input-label">Tên cơ sở</label>
                <input type="text" className="input-field" required placeholder="VD: Cơ sở 3 (Quận 7)" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Địa chỉ</label>
                <textarea className="input-field" required rows="2" placeholder="Nhập địa chỉ đầy đủ" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Cập nhật' : 'Lưu cơ sở'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
