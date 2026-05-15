import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { DollarSign, ShoppingBag, Clock, CheckCircle, TrendingUp, Calendar, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, isToday, isThisMonth, isThisYear, subDays, startOfDay, isSameDay } from 'date-fns';
import { exportToExcel } from '../utils/excelExport';

const StatCard = ({ title, value, icon, color, subValue }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.25rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
      <div className="text-sm text-muted font-medium">{title}</div>
    </div>
    <div style={{ marginTop: '0.25rem' }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{value}</div>
      {subValue && <div className="text-xs text-muted mt-1">{subValue}</div>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isMainAdmin } = useAuth();
  const { orders, branches, shifts } = useData();
  const isAdmin = user?.role === 'admin';
  
  // Determine current branch for staff
  const currentShift = shifts.find(s => s.staffId === user?.id && s.status === 'CheckedIn');
  const staffBranchId = currentShift ? currentShift.branchId : null;
  
  const [selectedBranchId, setSelectedBranchId] = React.useState(isAdmin ? 'all' : (staffBranchId || 'all'));

  // Sync staffBranchId if it changes
  React.useEffect(() => {
    if (!isAdmin && staffBranchId) {
      setSelectedBranchId(staffBranchId);
    }
  }, [staffBranchId, isAdmin]);

  const visibleOrders = (isMainAdmin ? orders : orders.filter(o => !o.isHidden)).filter(o => {
    if (selectedBranchId === 'all') return true;
    return o.branchId === parseInt(selectedBranchId);
  });
  
  // Received Stats
  const receivedToday = visibleOrders.filter(o => o.createdAt && isToday(new Date(o.createdAt)));
  const revToday = receivedToday.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  
  const receivedMonth = visibleOrders.filter(o => o.createdAt && isThisMonth(new Date(o.createdAt)));
  const revMonth = receivedMonth.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  
  const receivedYear = visibleOrders.filter(o => o.createdAt && isThisYear(new Date(o.createdAt)));
  const revYear = receivedYear.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  // Returned (Delivered) Stats
  const returnedToday = visibleOrders.filter(o => o.status === 'Đã giao khách' && o.returnDate && isToday(new Date(o.returnDate)));
  const retRevToday = returnedToday.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  
  const returnedMonth = visibleOrders.filter(o => o.status === 'Đã giao khách' && o.returnDate && isThisMonth(new Date(o.returnDate)));
  const retRevMonth = returnedMonth.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  
  const returnedYear = visibleOrders.filter(o => o.status === 'Đã giao khách' && o.returnDate && isThisYear(new Date(o.returnDate)));
  const retRevYear = returnedYear.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  // General Counts
  const newOrdersCount = visibleOrders.filter(o => o.status === 'Mới tạo').length;
  const processingCount = visibleOrders.filter(o => o.status === 'Đang giặt' || o.status === 'Đang sấy' || o.status === 'Đã nhận đồ').length;
  const readyCount = visibleOrders.filter(o => o.status === 'Sẵn sàng giao').length;

  // Chart Data (Last 7 Days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = visibleOrders.filter(o => o.createdAt && isSameDay(new Date(o.createdAt), date));
    const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    return {
      name: format(date, 'dd/MM'),
      'Doanh thu': dayRevenue,
      'Số đơn': dayOrders.length
    };
  });

  const handleExportStats = () => {
    const statsData = [
      { Tiêu_chí: "Doanh thu nhận hôm nay", Giá_trị: revToday, Đơn_vị: "VNĐ" },
      { Tiêu_chí: "Doanh thu nhận tháng này", Giá_trị: revMonth, Đơn_vị: "VNĐ" },
      { Tiêu_chí: "Doanh thu nhận năm nay", Giá_trị: revYear, Đơn_vị: "VNĐ" },
      { Tiêu_chí: "Tiền trả khách hôm nay", Giá_trị: retRevToday, Đơn_vị: "VNĐ" },
      { Tiêu_chí: "Tiền trả khách tháng này", Giá_trị: retRevMonth, Đơn_vị: "VNĐ" },
      { Tiêu_chí: "Số đơn nhận hôm nay", Giá_trị: receivedToday.length, Đơn_vị: "Đơn" },
      { Tiêu_chí: "Số đơn trả hôm nay", Giá_trị: returnedToday.length, Đơn_vị: "Đơn" },
    ];
    exportToExcel(statsData, `Bao_Cao_Tong_Quan_${format(new Date(), 'ddMMyyyy')}`);
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="mb-1 text-2xl font-bold">Tổng quan kinh doanh</h2>
          <p className="text-muted text-sm">Chào mừng quay lại, {user?.name}!</p>
        </div>
        
        <div className="flex gap-3 items-end">
          {isAdmin ? (
            <div className="input-group mb-0">
              <label className="input-label text-[10px] uppercase tracking-wider opacity-60">Xem theo cơ sở</label>
              <select 
                className="input-field py-1 px-3 h-10 min-w-[180px] bg-slate-800 border-slate-700"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="all">Tất cả cơ sở</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
              <span className="text-xs text-muted block">Cơ sở hiện tại</span>
              <span className="font-bold text-primary">
                {branches.find(b => b.id === parseInt(selectedBranchId))?.name || 'Chưa xác định'}
              </span>
            </div>
          )}
          <button className="btn btn-outline h-10" onClick={handleExportStats} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <FileDown size={18} /> Xuất thống kê
          </button>
        </div>
      </div>
      
      {/* Received Stats Row */}
      <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
        <TrendingUp size={18} className="text-primary" /> Theo ngày nhận đơn
      </h3>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Doanh thu hôm nay" 
          value={`${revToday.toLocaleString()} đ`} 
          subValue={`${receivedToday.length} đơn nhận mới`}
          icon={<DollarSign size={20} />} 
          color="#3b82f6" 
        />
        <StatCard 
          title="Tháng này" 
          value={`${revMonth.toLocaleString()} đ`} 
          subValue={`${receivedMonth.length} đơn trong tháng`}
          icon={<Calendar size={20} />} 
          color="#8b5cf6" 
        />
        <StatCard 
          title="Năm nay" 
          value={`${revYear.toLocaleString()} đ`} 
          subValue={`${receivedYear.length} đơn trong năm`}
          icon={<TrendingUp size={20} />} 
          color="#06b6d4" 
        />
        <StatCard 
          title="Đơn hàng mới" 
          value={newOrdersCount} 
          subValue="Đang chờ xử lý"
          icon={<ShoppingBag size={20} />} 
          color="#10b981" 
        />
      </div>

      {/* Returned Stats Row */}
      <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
        <CheckCircle size={18} className="text-success" /> Theo ngày trả đơn (Đã hoàn thành)
      </h3>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Tiền trả hôm nay" 
          value={`${retRevToday.toLocaleString()} đ`} 
          subValue={`${returnedToday.length} đơn đã giao`}
          icon={<CheckCircle size={20} />} 
          color="#10b981" 
        />
        <StatCard 
          title="Tháng này" 
          value={`${retRevMonth.toLocaleString()} đ`} 
          subValue={`${returnedMonth.length} đơn đã giao`}
          icon={<Calendar size={20} />} 
          color="#f59e0b" 
        />
        <StatCard 
          title="Năm nay" 
          value={`${retRevYear.toLocaleString()} đ`} 
          subValue={`${returnedYear.length} đơn đã giao`}
          icon={<TrendingUp size={20} />} 
          color="#f43f5e" 
        />
        <StatCard 
          title="Đang giặt/sấy" 
          value={processingCount} 
          subValue="Trong xưởng"
          icon={<Clock size={20} />} 
          color="#6366f1" 
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card" style={{ gridColumn: 'span 2', minHeight: '400px' }}>
          <h3 className="mb-6 font-bold">Biểu đồ doanh thu (7 ngày gần nhất)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="Doanh thu" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 font-bold">Đơn hàng vừa nhận</h3>
          <div className="flex flex-col gap-4">
            {visibleOrders.slice(-5).reverse().map(order => (
              <div key={order.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
                <div>
                  <div className="font-bold text-sm">{order.id}</div>
                  <div className="text-xs text-muted">{order.customerName}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary text-sm">{order.totalPrice.toLocaleString()} đ</div>
                  <div className="text-[10px] text-muted">{format(new Date(order.createdAt), 'dd/MM HH:mm')}</div>
                </div>
              </div>
            ))}
            {visibleOrders.length === 0 && <div className="text-center text-muted py-8 text-sm italic">Chưa có đơn hàng mới</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
