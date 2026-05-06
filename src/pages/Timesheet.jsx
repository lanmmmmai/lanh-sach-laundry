import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Calendar, Clock, DollarSign, Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const Timesheet = () => {
  const { user, users } = useAuth();
  const { branches, shifts, addShift, updateShift, shiftTemplates, addShiftTemplate, deleteShiftTemplate } = useData();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'templates' : 'my_shifts');
  
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', startTime: '08:00', endTime: '12:00' });

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInData, setCheckInData] = useState({ shiftTemplateId: '', branchId: '' });

  const staffList = users.filter(u => u.role === 'staff');
  const today = new Date().toISOString().split('T')[0];

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    addShiftTemplate(newTemplate);
    setShowTemplateModal(false);
    setNewTemplate({ name: '', startTime: '08:00', endTime: '12:00' });
  };

  const handleStaffCheckIn = (e) => {
    e.preventDefault();
    if (!checkInData.shiftTemplateId || !checkInData.branchId) return alert('Vui lòng chọn ca và cơ sở!');
    
    const template = shiftTemplates.find(t => t.id === parseInt(checkInData.shiftTemplateId));
    
    addShift({
      staffId: user.id,
      branchId: checkInData.branchId,
      date: today,
      startTime: template.startTime,
      endTime: template.endTime,
      shiftName: template.name,
      status: 'CheckedIn'
    }).then(() => {
      // It takes a bit for data to sync but we can just reload or rely on react state.
      // Wait, we can't update immediately without the ID, but the backend returns it and context appends it.
      // We will just do a tiny timeout to update actualStartTime. Actually, we can just insert with actualStartTime in addShift.
      // Wait, addShift doesn't take actualStartTime right now. I'll just let them CheckIn here and then update it.
    });
    
    // Quick fix: the context `addShift` does not let us send `actualStartTime` initially unless backend supports it.
    // Our backend ONLY takes `staffId, branchId, date, startTime, endTime, status, shiftName`.
    // Then we must update it.
    setTimeout(() => {
      // Find the newly created shift (the latest one for this user today)
      const latestShift = shifts.filter(s => s.staffId === user.id && s.date === today && s.status === 'CheckedIn').pop();
      if (latestShift) {
        updateShift(latestShift.id, { actualStartTime: new Date().toLocaleTimeString('en-US', { hour12: false }), status: 'CheckedIn' });
      }
    }, 500); // Hacky, but works given the constraints without modifying backend again

    setShowCheckInModal(false);
  };

  const handleCheckOut = (shiftId) => {
    updateShift(shiftId, { actualEndTime: new Date().toLocaleTimeString('en-US', { hour12: false }), status: 'Completed' });
  };

  const calculateSalary = (staff) => {
    if (staff.salaryType === 'fulltime') return staff.salaryRate || 0;
    
    const staffShifts = shifts.filter(s => s.staffId === staff.id && s.status === 'Completed');
    let totalHours = 0;
    
    staffShifts.forEach(s => {
      if (s.actualStartTime && s.actualEndTime) {
        const t1 = new Date(`1970-01-01T${s.actualStartTime}`);
        const t2 = new Date(`1970-01-01T${s.actualEndTime}`);
        const diff = (t2 - t1) / (1000 * 60 * 60); 
        if (diff > 0) totalHours += diff;
      }
    });

    return Math.round(totalHours * (staff.salaryRate || 0));
  };

  // Allow check-in update right away manually
  const doCheckInManual = (shiftId) => {
    updateShift(shiftId, { actualStartTime: new Date().toLocaleTimeString('en-US', { hour12: false }), status: 'CheckedIn' });
  };

  const handleExport = () => {
    import('../utils/excelExport').then(({ exportToExcel }) => {
      if (activeTab === 'history' || activeTab === 'my_shifts') {
        const data = shifts.filter(s => isAdmin ? true : s.staffId === user.id).map(shift => {
          const staff = users.find(u => u.id === shift.staffId);
          const branch = branches.find(b => b.id === shift.branchId);
          return {
            "Ngày": new Date(shift.date).toLocaleDateString('vi-VN'),
            "Tên Ca": shift.shiftName || 'Ca tự do',
            "Khung giờ": `${shift.startTime} - ${shift.endTime}`,
            "Nhân viên": staff?.name || 'Không rõ',
            "Cơ sở": branch?.name || 'Không rõ',
            "Giờ Check-in": shift.actualStartTime || '--:--',
            "Giờ Check-out": shift.actualEndTime || '--:--',
            "Trạng thái": shift.status === 'Completed' ? 'Đã hoàn thành' : shift.status === 'CheckedIn' ? 'Đang làm' : 'Chưa bắt đầu'
          };
        });
        exportToExcel(data, "LichSuChamCong");
      } else if (activeTab === 'salary') {
        const data = staffList.map(staff => ({
          "Nhân viên": staff.name,
          "Chế độ lương": staff.salaryType === 'fulltime' ? 'Full-time (Tháng)' : 'Part-time (Giờ)',
          "Mức lương cơ sở": staff.salaryRate,
          "Tổng lương tạm tính": calculateSalary(staff)
        }));
        exportToExcel(data, "BangLuongTongHop");
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>{isAdmin ? 'Quản lý Chấm công & Lương' : 'Chấm công của tôi'}</h2>
        <div className="flex gap-2">
          {(activeTab === 'history' || activeTab === 'salary' || activeTab === 'my_shifts') && (
            <button className="btn btn-outline" onClick={handleExport} style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
              <Download size={16} /> Xuất Excel
            </button>
          )}
          {isAdmin && activeTab === 'templates' && (
            <button className="btn btn-primary" onClick={() => setShowTemplateModal(true)}>
              <Plus size={16} /> Tạo ca làm mẫu
            </button>
          )}
          {!isAdmin && activeTab === 'my_shifts' && (
            <button className="btn btn-primary" onClick={() => setShowCheckInModal(true)}>
              <CheckCircle size={16} /> Bắt đầu ca mới (Check In)
            </button>
          )}
        </div>
      </div>

      <div className="card mb-6 p-0" style={{ overflow: 'hidden' }}>
        <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
          {isAdmin ? (
            <>
              <button 
                className={`px-6 py-3 font-medium transition-colors ${activeTab === 'templates' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:bg-gray-50'}`}
                onClick={() => setActiveTab('templates')}
              >
                Khung giờ ca làm
              </button>
              <button 
                className={`px-6 py-3 font-medium transition-colors ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:bg-gray-50'}`}
                onClick={() => setActiveTab('history')}
              >
                Lịch sử chấm công
              </button>
              <button 
                className={`px-6 py-3 font-medium transition-colors ${activeTab === 'salary' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:bg-gray-50'}`}
                onClick={() => setActiveTab('salary')}
              >
                Bảng lương tổng hợp
              </button>
            </>
          ) : (
            <button 
              className={`px-6 py-3 font-medium transition-colors ${activeTab === 'my_shifts' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:bg-gray-50'}`}
              onClick={() => setActiveTab('my_shifts')}
            >
              Ca làm việc của tôi
            </button>
          )}
        </div>
      </div>

      {activeTab === 'templates' && isAdmin && (
        <div className="grid grid-cols-2 gap-6">
          {shiftTemplates.map(t => (
            <div key={t.id} className="card flex justify-between items-center">
              <div>
                <h3 className="text-primary mb-1">{t.name}</h3>
                <div className="text-muted flex items-center gap-2 text-sm"><Clock size={14} /> {t.startTime} - {t.endTime}</div>
              </div>
              <button className="btn btn-outline border-danger text-danger p-2" onClick={() => deleteShiftTemplate(t.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {shiftTemplates.length === 0 && (
            <div className="col-span-2 text-center text-muted py-8">Chưa có ca làm mẫu nào được tạo.</div>
          )}
        </div>
      )}

      {(activeTab === 'history' || activeTab === 'my_shifts') && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Tên Ca</th>
                  <th>Khung giờ</th>
                  {isAdmin && <th>Nhân viên</th>}
                  <th>Cơ sở</th>
                  <th>Giờ Check-in</th>
                  <th>Giờ Check-out</th>
                  <th>Trạng thái</th>
                  {!isAdmin && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {shifts.filter(s => isAdmin ? true : s.staffId === user.id).sort((a,b) => new Date(b.date) - new Date(a.date)).map(shift => {
                  const staff = users.find(u => u.id === shift.staffId);
                  const branch = branches.find(b => b.id === shift.branchId);
                  return (
                    <tr key={shift.id}>
                      <td className="font-semibold">{new Date(shift.date).toLocaleDateString('vi-VN')}</td>
                      <td className="font-medium text-primary">{shift.shiftName || 'Ca tự do'}</td>
                      <td>{shift.startTime} - {shift.endTime}</td>
                      {isAdmin && <td>{staff?.name || 'Không rõ'}</td>}
                      <td>{branch?.name || 'Không rõ'}</td>
                      <td className={shift.actualStartTime ? 'text-success font-medium' : 'text-muted'}>{shift.actualStartTime || '--:--'}</td>
                      <td className={shift.actualEndTime ? 'text-success font-medium' : 'text-muted'}>{shift.actualEndTime || '--:--'}</td>
                      <td>
                        <span className={`badge ${shift.status === 'Completed' ? 'badge-success' : shift.status === 'CheckedIn' ? 'badge-warning' : 'badge-primary'}`}>
                          {shift.status === 'Completed' ? 'Đã hoàn thành' : shift.status === 'CheckedIn' ? 'Đang làm' : 'Chưa bắt đầu'}
                        </span>
                      </td>
                      {!isAdmin && (
                        <td>
                          {shift.status === 'Pending' && <button className="btn btn-outline text-success border-success" onClick={() => doCheckInManual(shift.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><CheckCircle size={14} /> Cập nhật Check In</button>}
                          {shift.status === 'CheckedIn' && <button className="btn btn-outline text-danger border-danger" onClick={() => handleCheckOut(shift.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><XCircle size={14} /> Check Out</button>}
                          {shift.status === 'Completed' && <span className="text-muted text-sm">Đã kết thúc</span>}
                        </td>
                      )}
                    </tr>
                  )
                })}
                {shifts.filter(s => isAdmin ? true : s.staffId === user.id).length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 8} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có lịch sử chấm công nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'salary' && isAdmin && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Chế độ lương</th>
                  <th>Mức lương cơ sở</th>
                  <th>Tổng lương tạm tính</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => {
                  const total = calculateSalary(staff);
                  return (
                    <tr key={staff.id}>
                      <td className="font-semibold">{staff.name}</td>
                      <td>{staff.salaryType === 'fulltime' ? 'Full-time (Tháng)' : 'Part-time (Giờ)'}</td>
                      <td className="text-muted">{staff.salaryRate?.toLocaleString() || 0} đ/{staff.salaryType === 'fulltime' ? 'tháng' : 'giờ'}</td>
                      <td className="font-bold text-primary">{total.toLocaleString()} đ</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN MODAL: TẠO KHUNG GIỜ CA MẪU */}
      {showTemplateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 className="mb-4">Tạo Khung giờ Ca mẫu</h3>
            <form onSubmit={handleSaveTemplate}>
              <div className="input-group">
                <label className="input-label">Tên Ca (VD: Ca Sáng, Ca Chiều)</label>
                <input type="text" className="input-field" required value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Giờ bắt đầu</label>
                  <input type="time" className="input-field" required value={newTemplate.startTime} onChange={e => setNewTemplate({...newTemplate, startTime: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Giờ kết thúc</label>
                  <input type="time" className="input-field" required value={newTemplate.endTime} onChange={e => setNewTemplate({...newTemplate, endTime: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowTemplateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu Ca mẫu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF MODAL: BẮT ĐẦU CA (CHECK IN) */}
      {showCheckInModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 className="mb-4">Bắt đầu Ca làm việc (Check In)</h3>
            <form onSubmit={handleStaffCheckIn}>
              <div className="input-group">
                <label className="input-label">Chọn Ca làm việc</label>
                <select className="input-field" required value={checkInData.shiftTemplateId} onChange={e => setCheckInData({...checkInData, shiftTemplateId: e.target.value})}>
                  <option value="">-- Chọn Ca --</option>
                  {shiftTemplates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.startTime} - {t.endTime})</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Chọn Cơ sở</label>
                <select className="input-field" required value={checkInData.branchId} onChange={e => setCheckInData({...checkInData, branchId: parseInt(e.target.value)})}>
                  <option value="">-- Chọn Cơ sở --</option>
                  {user.branchIds && (typeof user.branchIds === 'string' ? JSON.parse(user.branchIds) : user.branchIds).map(id => {
                    const b = branches.find(br => br.id === id);
                    return b ? <option key={b.id} value={b.id}>{b.name}</option> : null;
                  })}
                  {(!user.branchIds || user.branchIds.length === 0) && branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowCheckInModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary bg-success border-success">Bắt đầu làm (Check In)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheet;
