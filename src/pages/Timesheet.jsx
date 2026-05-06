import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Calendar, Clock, DollarSign, Plus, CheckCircle, XCircle } from 'lucide-react';

const Timesheet = () => {
  const { user, users } = useAuth();
  const { branches, shifts, addShift, updateShift } = useData();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'schedule' : 'my_shifts');
  
  const [showModal, setShowModal] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [newShift, setNewShift] = useState({ staffId: '', branchId: '', date: today, startTime: '08:00', endTime: '12:00' });

  const staffList = users.filter(u => u.role === 'staff');

  const handleSaveShift = (e) => {
    e.preventDefault();
    addShift({ ...newShift, status: 'Pending' });
    setShowModal(false);
  };

  const handleCheckIn = (shiftId) => {
    updateShift(shiftId, { actualStartTime: new Date().toLocaleTimeString('en-US', { hour12: false }), status: 'CheckedIn' });
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
        // Simplified hours calculation
        const t1 = new Date(`1970-01-01T${s.actualStartTime}`);
        const t2 = new Date(`1970-01-01T${s.actualEndTime}`);
        const diff = (t2 - t1) / (1000 * 60 * 60); 
        if (diff > 0) totalHours += diff;
      }
    });

    return Math.round(totalHours * (staff.salaryRate || 0));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>{isAdmin ? 'Quản lý Chấm công & Lương' : 'Chấm công của tôi'}</h2>
        {isAdmin && activeTab === 'schedule' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Phân ca mới
          </button>
        )}
      </div>

      <div className="card mb-6 p-0" style={{ overflow: 'hidden' }}>
        <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
          {isAdmin ? (
            <>
              <button 
                className={`px-6 py-3 font-medium transition-colors ${activeTab === 'schedule' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:bg-gray-50'}`}
                onClick={() => setActiveTab('schedule')}
              >
                Phân ca làm việc
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

      {(activeTab === 'schedule' || activeTab === 'my_shifts') && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Ca làm (Dự kiến)</th>
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
                          {shift.status === 'Pending' && <button className="btn btn-outline text-success border-success" onClick={() => handleCheckIn(shift.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><CheckCircle size={14} /> Check In</button>}
                          {shift.status === 'CheckedIn' && <button className="btn btn-outline text-danger border-danger" onClick={() => handleCheckOut(shift.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><XCircle size={14} /> Check Out</button>}
                          {shift.status === 'Completed' && <span className="text-muted text-sm">Đã kết thúc</span>}
                        </td>
                      )}
                    </tr>
                  )
                })}
                {shifts.filter(s => isAdmin ? true : s.staffId === user.id).length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 7} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có lịch phân ca nào.</td>
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

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 className="mb-4">Phân ca làm việc mới</h3>
            <form onSubmit={handleSaveShift}>
              <div className="input-group">
                <label className="input-label">Nhân viên</label>
                <select className="input-field" required value={newShift.staffId} onChange={e => setNewShift({...newShift, staffId: parseInt(e.target.value)})}>
                  <option value="">-- Chọn nhân viên --</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Cơ sở</label>
                <select className="input-field" required value={newShift.branchId} onChange={e => setNewShift({...newShift, branchId: parseInt(e.target.value)})}>
                  <option value="">-- Chọn cơ sở --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Ngày làm việc</label>
                <input type="date" className="input-field" required value={newShift.date} onChange={e => setNewShift({...newShift, date: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Giờ bắt đầu</label>
                  <input type="time" className="input-field" required value={newShift.startTime} onChange={e => setNewShift({...newShift, startTime: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Giờ kết thúc</label>
                  <input type="time" className="input-field" required value={newShift.endTime} onChange={e => setNewShift({...newShift, endTime: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu phân ca</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheet;
