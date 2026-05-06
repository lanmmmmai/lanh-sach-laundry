import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { DollarSign, ShoppingBag, Clock, CheckCircle } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: `${color}20`, color: color }}>
      {icon}
    </div>
    <div>
      <div className="text-sm text-muted mb-1">{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isMainAdmin } = useAuth();
  const { orders } = useData();
  const isAdmin = user?.role === 'admin';
  
  const visibleOrders = isMainAdmin ? orders : orders.filter(o => !o.isHidden);
  
  const totalRevenue = visibleOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const newOrdersCount = visibleOrders.filter(o => o.status === 'Mới tạo').length;
  const processingCount = visibleOrders.filter(o => o.status === 'Đang giặt').length;
  const readyCount = visibleOrders.filter(o => o.status === 'Sẵn sàng giao').length;

  return (
    <div>
      <h2 className="mb-6">Xin chào, {user?.name}!</h2>
      
      <div className="grid grid-cols-4 gap-6 mb-6">
        {isAdmin && <StatCard title="Doanh thu hôm nay" value={`${totalRevenue.toLocaleString()} đ`} icon={<DollarSign size={24} />} color="var(--success)" />}
        <StatCard title="Đơn hàng mới" value={newOrdersCount} icon={<ShoppingBag size={24} />} color="var(--primary)" />
        <StatCard title="Đang xử lý" value={processingCount} icon={<Clock size={24} />} color="var(--warning)" />
        <StatCard title="Sẵn sàng giao" value={readyCount} icon={<CheckCircle size={24} />} color="var(--secondary)" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 className="mb-4">Đơn hàng gần đây</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Trạng thái</th>
                  <th>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.slice(-5).reverse().map(order => (
                  <tr key={order.id}>
                    <td className="font-semibold">{order.id}</td>
                    <td>{order.customerName}</td>
                    <td><span className={`badge ${order.status === 'Đã giao khách' ? 'badge-success' : order.status === 'Mới tạo' ? 'badge-primary' : 'badge-warning'}`}>{order.status}</span></td>
                    <td className="font-semibold">{order.totalPrice.toLocaleString()} đ</td>
                  </tr>
                ))}
                {visibleOrders.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có đơn hàng nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
