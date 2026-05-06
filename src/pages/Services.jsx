import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Download, Upload, List, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportToExcel } from '../utils/excelExport';

const Services = () => {
  const { services, addService, updateService, deleteService, importServices } = useData();
  const [showModal, setShowModal] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const exportData = services.map(s => ({
      "Mã dịch vụ": s.id,
      "Tên dịch vụ": s.name,
      "Đơn giá (VNĐ/kg)": s.price
    }));
    exportToExcel(exportData, "DanhSachDichVu");
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewService({ name: '', price: '' });
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingId(service.id);
    setNewService({ name: service.name, price: service.price });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này không?')) {
      deleteService(id);
    }
  };

  const handleSaveService = (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;
    
    if (editingId) {
      updateService(editingId, { name: newService.name, price: parseInt(newService.price) });
    } else {
      addService({ name: newService.name, price: parseInt(newService.price) });
    }
    
    setShowModal(false);
    setNewService({ name: '', price: '' });
    setEditingId(null);
  };

  const downloadTemplate = () => {
    const templateData = [
      { "Tên dịch vụ": "Giặt sấy tiêu chuẩn", "Giá (đ/kg)": 25000 },
      { "Tên dịch vụ": "Giặt hấp áo vest", "Giá (đ/kg)": 50000 }
    ];
    exportToExcel(templateData, "Mau_Nhap_Dich_Vu");
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
      
      const newServicesList = jsonData.map((item, index) => ({
        id: Date.now() + index,
        name: item["Tên dịch vụ"] || item["Ten dich vu"] || "Không tên",
        price: parseInt(item["Giá (đ/kg)"] || item["Gia"] || 0)
      }));
      
      if (newServicesList.length > 0) {
        importServices(newServicesList);
        alert(`Đã nhập thành công ${newServicesList.length} dịch vụ từ file Excel!`);
      }
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>Quản lý Dịch vụ Bảng giá</h2>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={handleExport} style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
            <FileDown size={16} /> Xuất Excel
          </button>
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
            <Plus size={16} /> Thêm thủ công
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên dịch vụ</th>
                <th>Đơn giá (VNĐ/kg)</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, idx) => (
                <tr key={service.id || idx}>
                  <td className="font-semibold text-muted">#{service.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <List size={16} className="text-primary" />
                      <span className="font-semibold">{service.name}</span>
                    </div>
                  </td>
                  <td className="font-semibold text-success">{service.price.toLocaleString()} đ</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline" onClick={() => openEditModal(service)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Sửa</button>
                      <button className="btn btn-outline" onClick={() => handleDelete(service.id)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    Chưa có dịch vụ nào. Hãy thêm thủ công hoặc nhập từ file Excel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 className="mb-4">{editingId ? 'Sửa Dịch vụ' : 'Thêm Dịch vụ mới'}</h3>
            <form onSubmit={handleSaveService}>
              <div className="input-group">
                <label className="input-label">Tên dịch vụ</label>
                <input type="text" className="input-field" required placeholder="VD: Giặt sấy khô" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Đơn giá (đ/kg)</label>
                <input type="number" className="input-field" required min="0" placeholder="VD: 25000" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Cập nhật' : 'Lưu dịch vụ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
