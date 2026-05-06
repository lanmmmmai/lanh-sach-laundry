import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Plus, Building2, Download, Upload, Wallet } from 'lucide-react';
import * as XLSX from 'xlsx';

const StaffManagement = () => {
  const { users, addStaff, updateStaff, deleteStaff, importStaff } = useAuth();
  const { branches } = useData();
  
  const [showModal, setShowModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', branchIds: [], salaryType: 'parttime', salaryRate: 0 });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const staffList = users.filter(u => u.role === 'staff');

  const openAddModal = () => {
    setEditingId(null);
    setNewStaff({ name: '', email: '', password: '', branchIds: [], salaryType: 'parttime', salaryRate: 0 });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (staff) => {
    setEditingId(staff.id);
    let parsedBranchIds = [];
    try {
      if (typeof staff.branchIds === 'string') parsedBranchIds = JSON.parse(staff.branchIds);
      else if (Array.isArray(staff.branchIds)) parsedBranchIds = staff.branchIds;
    } catch(e){}
    
    // Backwards compatibility for old branchId
    if (parsedBranchIds.length === 0 && staff.branchId) {
      parsedBranchIds = [staff.branchId];
    }

    setNewStaff({ 
      name: staff.name, 
      email: staff.email, 
      password: staff.password, 
      branchIds: parsedBranchIds,
      salaryType: staff.salaryType || 'parttime',
      salaryRate: staff.salaryRate || 0
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này không?')) {
      deleteStaff(id);
    }
  };

  const handleBranchToggle = (branchId) => {
    setNewStaff(prev => {
      const isSelected = prev.branchIds.includes(branchId);
      if (isSelected) {
        return { ...prev, branchIds: prev.branchIds.filter(id => id !== branchId) };
      } else {
        return { ...prev, branchIds: [...prev.branchIds, branchId] };
      }
    });
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (newStaff.branchIds.length === 0) {
      setError('Vui lòng chọn ít nhất một cơ sở làm việc!');
      return;
    }
    
    if (editingId) {
      updateStaff(editingId, newStaff);
      setShowModal(false);
      setEditingId(null);
    } else {
      const success = await addStaff(newStaff);
      if (success) {
        setShowModal(false);
        setNewStaff({ name: '', email: '', password: '', branchIds: [], salaryType: 'parttime', salaryRate: 0 });
        setError('');
      } else {
        setError('Email này đã tồn tại!');
      }
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { "Họ và tên": "Nguyễn Văn A", "Email": "nva@test.com", "Mật khẩu": "123", "Mã cơ sở (cách nhau bởi dấu phẩy)": "1,2", "Loại lương (parttime/fulltime)": "parttime", "Mức lương": 25000 }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NhanVien");
    XLSX.writeFile(wb, "Mau_Nhap_Nhan_Vien.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const newStaffList = jsonData.map((item) => {
        let branchIds = [];
        const rawBranches = item["Mã cơ sở (cách nhau bởi dấu phẩy)"] || item["Ma co so"] || "";
        if (rawBranches) {
          branchIds = String(rawBranches).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }

        return {
          name: item["Họ và tên"] || item["Ho va ten"] || "Không tên",
          email: item["Email"],
          password: String(item["Mật khẩu"] || item["Mat khau"] || "123"),
          branchIds: branchIds,
          salaryType: String(item["Loại lương (parttime/fulltime)"] || "parttime").toLowerCase(),
          salaryRate: parseInt(item["Mức lương"] || item["Muc luong"] || 0)
        };
      }).filter(s => s.email);
      
      if (newStaffList.length > 0) {
        importStaff(newStaffList);
        alert(`Đã nhập thành công ${newStaffList.length} nhân viên từ file Excel!`);
      }
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>Quản lý Nhân Viên</h2>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={downloadTemplate} style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
            <Download size={16} /> Tải file mẫu
          </button>
          
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Nhập từ Excel
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            style={{ display: 'none' }} 
          />
          
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Họ và Tên / Email</th>
                <th>Cơ sở làm việc</th>
                <th>Chế độ lương</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(staff => {
                let parsedBranchIds = [];
                try {
                  if (typeof staff.branchIds === 'string') parsedBranchIds = JSON.parse(staff.branchIds);
                  else if (Array.isArray(staff.branchIds)) parsedBranchIds = staff.branchIds;
                } catch(e){}
                if (parsedBranchIds.length === 0 && staff.branchId) parsedBranchIds = [staff.branchId];

                const staffBranches = branches.filter(b => parsedBranchIds.includes(b.id));

                return (
                  <tr key={staff.id}>
                    <td>
                      <div className="font-semibold">{staff.name}</div>
                      <div className="text-xs text-muted">{staff.email}</div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {staffBranches.length > 0 ? staffBranches.map(b => (
                          <div key={b.id} className="flex items-center gap-1 text-sm">
                            <Building2 size={14} className="text-muted" /> {b.name}
                          </div>
                        )) : <span className="text-muted text-sm">Chưa phân bổ</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm">
                        <Wallet size={16} className="text-primary" />
                        <div>
                          <div className="font-semibold">{staff.salaryType === 'fulltime' ? 'Full-time' : 'Part-time'}</div>
                          <div className="text-muted">{staff.salaryRate?.toLocaleString() || 0} đ/{staff.salaryType === 'fulltime' ? 'tháng' : 'giờ'}</div>
                        </div>
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
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có nhân viên nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="mb-4">{editingId ? 'Sửa Nhân viên' : 'Thêm Nhân viên mới'}</h3>
            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '4px' }}>{error}</div>}
            
            <form onSubmit={handleSaveStaff}>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Họ và Tên</label>
                  <input type="text" className="input-field" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email đăng nhập</label>
                  <input type="email" className="input-field" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} disabled={!!editingId} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Mật khẩu</label>
                <input type="text" className="input-field" required value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
              </div>

              <div className="input-group mt-2">
                <label className="input-label mb-2">Cơ sở làm việc (Có thể chọn nhiều)</label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md" style={{ borderColor: 'var(--border-color)', maxHeight: '150px', overflowY: 'auto' }}>
                  {branches.map(b => (
                    <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newStaff.branchIds.includes(b.id)}
                        onChange={() => handleBranchToggle(b.id)}
                        style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                      />
                      {b.name}
                    </label>
                  ))}
                  {branches.length === 0 && <div className="text-muted text-sm col-span-2">Chưa có cơ sở nào.</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="input-group">
                  <label className="input-label">Hình thức lương</label>
                  <select className="input-field" value={newStaff.salaryType} onChange={e => setNewStaff({...newStaff, salaryType: e.target.value})}>
                    <option value="parttime">Part-time (Theo giờ)</option>
                    <option value="fulltime">Full-time (Theo tháng)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Mức lương (VNĐ)</label>
                  <input type="number" className="input-field" required value={newStaff.salaryRate} onChange={e => setNewStaff({...newStaff, salaryRate: parseInt(e.target.value) || 0})} />
                </div>
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
