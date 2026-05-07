import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Save, Edit, FileText, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';

const DailyReports = () => {
  const { user } = useAuth();
  const { orders, branches, dailyReports, saveDailyReport } = useData();
  const isAdmin = user?.role === 'admin';
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      if (!isAdmin) {
        // Find branch for staff - maybe from shift or assigned
        setSelectedBranchId(branches[0].id);
      } else {
        setSelectedBranchId(branches[0].id);
      }
    }
  }, [branches, selectedBranchId, isAdmin]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getReportDataForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const branchId = parseInt(selectedBranchId);
    
    // Manual data
    const manual = dailyReports.find(r => r.branch_id === branchId && r.report_date === dateStr) || {};
    
    // Auto data from orders
    const dayOrders = orders.filter(o => o.branchId === branchId && o.createdAt && isSameDay(parseISO(o.createdAt), date));
    
    const nhanDon = {
      count: dayOrders.length,
      tm: dayOrders.filter(o => o.paymentStatus === 'Đã thanh toán' && o.paymentMethod === 'Tiền mặt').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
      ck: dayOrders.filter(o => o.paymentStatus === 'Đã thanh toán' && o.paymentMethod === 'Chuyển khoản').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
      no: dayOrders.filter(o => o.paymentStatus === 'Chưa thanh toán').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    };

    // Thu nợ: Orders created before this day but paid on this day
    // Need paidAt field. If not present, we can't accurately track. 
    // For now, let's assume we use updatedOrder to set paidAt.
    const thuNo = {
      count: orders.filter(o => o.branchId === branchId && o.paidAt && isSameDay(parseISO(o.paidAt), date) && !isSameDay(parseISO(o.createdAt), date)).length,
      tm: orders.filter(o => o.branchId === branchId && o.paidAt && isSameDay(parseISO(o.paidAt), date) && !isSameDay(parseISO(o.createdAt), date) && o.paymentMethod === 'Tiền mặt').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
      ck: orders.filter(o => o.branchId === branchId && o.paidAt && isSameDay(parseISO(o.paidAt), date) && !isSameDay(parseISO(o.createdAt), date) && o.paymentMethod === 'Chuyển khoản').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    };

    const totalRev = nhanDon.tm + nhanDon.ck + nhanDon.no;
    const totalCollection = thuNo.tm + thuNo.ck;
    
    // Calc total in shop: (Opening + TM Received + TM Collected - Expenses)
    const opening = manual.opening_balance || 0;
    const expenses = manual.expense_amount || 0;
    const closing = opening + nhanDon.tm + thuNo.tm - expenses;

    return {
      dateStr,
      opening,
      dayRev: totalRev,
      nhanDon,
      thuNo,
      totalCollection,
      expenses,
      expenseDesc: manual.expense_desc || '',
      notes: manual.notes || '',
      closing
    };
  };

  const handleEdit = (dayData) => {
    setEditingDay(dayData.dateStr);
    setEditData({
      opening_balance: dayData.opening,
      expense_amount: dayData.expenses,
      expense_desc: dayData.expenseDesc,
      notes: dayData.notes
    });
  };

  const handleSave = async () => {
    await saveDailyReport({
      branch_id: parseInt(selectedBranchId),
      report_date: editingDay,
      ...editData
    });
    setEditingDay(null);
  };

  return (
    <div className="daily-reports">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="mb-1">Báo cáo doanh thu chi tiết</h2>
          <p className="text-muted text-sm">Theo dõi thu chi và doanh số hàng ngày</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
            <button className="p-2 hover:bg-slate-100 rounded-md" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold px-4 min-w-[150px] text-center">
              Tháng {format(currentMonth, 'MM/yyyy')}
            </span>
            <button className="p-2 hover:bg-slate-100 rounded-md" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight size={20} />
            </button>
          </div>

          <select 
            className="input-field w-[200px]" 
            value={selectedBranchId || ''} 
            onChange={(e) => setSelectedBranchId(e.target.value)}
            disabled={!isAdmin}
          >
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <table className="report-table">
            <thead>
              <tr className="bg-slate-50">
                <th rowSpan="2" className="text-center">STT</th>
                <th rowSpan="2">Ngày</th>
                <th colSpan="2" className="text-center bg-yellow-50">Đầu kỳ & Doanh thu</th>
                <th colSpan="4" className="text-center bg-blue-50">Nhận đơn</th>
                <th colSpan="4" className="text-center bg-green-50">Thu nợ</th>
                <th colSpan="2" className="text-center">Phát sinh</th>
                <th rowSpan="2">Ghi chú</th>
                <th rowSpan="2" className="text-center bg-blue-600 text-white">Tổng tại CH</th>
                <th rowSpan="2">Thao tác</th>
              </tr>
              <tr className="bg-slate-50">
                <th className="bg-yellow-50">Đầu kỳ</th>
                <th className="bg-yellow-50">DT ngày</th>
                <th className="bg-blue-50">Số HD</th>
                <th className="bg-blue-50">CK</th>
                <th className="bg-blue-50">TM</th>
                <th className="bg-blue-50">Nợ</th>
                <th className="bg-green-50">Tổng thu</th>
                <th className="bg-green-50">Số HD</th>
                <th className="bg-green-50">CK</th>
                <th className="bg-green-50">TM</th>
                <th>Số tiền</th>
                <th>Diễn giải</th>
              </tr>
            </thead>
            <tbody>
              {days.map((date, idx) => {
                const data = getReportDataForDay(date);
                const isEditing = editingDay === data.dateStr;

                return (
                  <tr key={idx} className={isEditing ? 'bg-indigo-50' : ''}>
                    <td className="text-center text-muted text-xs">{idx + 1}</td>
                    <td className="font-medium whitespace-nowrap">
                      {format(date, 'dd/MM/yyyy')}
                    </td>
                    
                    {/* Opening Balance */}
                    <td className="text-right font-semibold">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-20 p-1 border rounded" 
                          value={editData.opening_balance} 
                          onChange={(e) => setEditData({...editData, opening_balance: parseInt(e.target.value) || 0})}
                        />
                      ) : data.opening.toLocaleString()}
                    </td>

                    {/* Day Revenue */}
                    <td className="text-right bg-yellow-50 font-bold text-orange-600">
                      {data.dayRev.toLocaleString()}
                    </td>

                    {/* Nhận đơn */}
                    <td className="text-center bg-blue-50/30">{data.nhanDon.count}</td>
                    <td className="text-right bg-blue-50/30">{data.nhanDon.ck.toLocaleString()}</td>
                    <td className="text-right bg-blue-50/30">{data.nhanDon.tm.toLocaleString()}</td>
                    <td className="text-right bg-blue-50/30 text-red-500">{data.nhanDon.no.toLocaleString()}</td>

                    {/* Thu nợ */}
                    <td className="text-right bg-green-50/30 font-bold text-green-700">{data.totalCollection.toLocaleString()}</td>
                    <td className="text-center bg-green-50/30">{data.thuNo.count}</td>
                    <td className="text-right bg-green-50/30">{data.thuNo.ck.toLocaleString()}</td>
                    <td className="text-right bg-green-50/30">{data.thuNo.tm.toLocaleString()}</td>

                    {/* Phát sinh */}
                    <td className="text-right">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-20 p-1 border rounded" 
                          value={editData.expense_amount} 
                          onChange={(e) => setEditData({...editData, expense_amount: parseInt(e.target.value) || 0})}
                        />
                      ) : data.expenses.toLocaleString()}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="w-full p-1 border rounded" 
                          value={editData.expense_desc} 
                          onChange={(e) => setEditData({...editData, expense_desc: e.target.value})}
                        />
                      ) : data.expenseDesc}
                    </td>

                    {/* Ghi chú */}
                    <td>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="w-full p-1 border rounded" 
                          value={editData.notes} 
                          onChange={(e) => setEditData({...editData, notes: e.target.value})}
                        />
                      ) : data.notes}
                    </td>

                    {/* Closing Balance */}
                    <td className="text-right bg-blue-600 text-white font-bold">
                      {data.closing.toLocaleString()}
                    </td>

                    <td className="text-center">
                      {isEditing ? (
                        <button className="p-1 text-success hover:bg-success/10 rounded" onClick={handleSave}>
                          <CheckCircle size={18} />
                        </button>
                      ) : (
                        <button className="p-1 text-primary hover:bg-primary/10 rounded" onClick={() => handleEdit(data)}>
                          <Edit size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .report-table th {
          border: 1px solid #e2e8f0;
          font-size: 11px;
          padding: 8px 4px;
        }
        .report-table td {
          border: 1px solid #e2e8f0;
          font-size: 12px;
          padding: 6px 8px;
        }
        .bg-yellow-50 { background-color: #fefce8; }
        .bg-blue-50 { background-color: #eff6ff; }
        .bg-green-50 { background-color: #f0fdf4; }
        .text-right { text-align: right; }
      `}} />
    </div>
  );
};

export default DailyReports;
