import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const navigate = useNavigate();
  const { orders, updateOrder, deleteOrder } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone.includes(searchTerm)
  );

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) {
      deleteOrder(id);
    }
  };

  const openEditModal = (order) => {
    setEditingOrder({ ...order });
    setShowModal(true);
  };

  const handleSaveOrder = (e) => {
    e.preventDefault();
    updateOrder(editingOrder.id, editingOrder);
    setShowModal(false);
    setEditingOrder(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>Quản lý Đơn hàng</h2>
        <button className="btn btn-primary" onClick={() => navigate('/create-order')}>
          <Plus size={16} /> Tạo đơn mới
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="input-group" style={{ flex: 1, margin: 0, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Tìm kiếm theo mã đơn, tên hoặc SĐT khách hàng..."
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="input-field" style={{ width: '200px' }}>
            <option value="">Tất cả trạng thái</option>
            <option value="Mới tạo">Mới tạo</option>
            <option value="Đang giặt">Đang giặt</option>
            <option value="Sẵn sàng giao">Sẵn sàng giao</option>
            <option value="Đã giao khách">Đã giao khách</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Dịch vụ</th>
              <th>Cân nặng (kg)</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>
                  <div className="font-semibold">{order.id}</div>
                  <div className="text-xs text-muted">Bởi: {order.staff}</div>
                </td>
                <td>
                  <div>{order.customerName}</div>
                  <div className="text-xs text-muted">{order.customerPhone}</div>
                </td>
                <td>{order.service}</td>
                <td>{order.weight}</td>
                <td className="font-semibold text-primary">{order.totalPrice.toLocaleString()} đ</td>
                <td>
                  <span className={`badge ${order.paymentStatus === 'Đã thanh toán' ? 'badge-success' : 'badge-warning'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.25rem 0.5rem', lineHeight: '1.2' }}>
                    <span>{order.paymentStatus}</span>
                    {order.paymentStatus === 'Đã thanh toán' && <span className="text-xs mt-1 font-normal opacity-80">{order.paymentMethod}</span>}
                  </span>
                </td>
                <td>
                  <span className={`badge ${order.status === 'Đã giao khách' ? 'badge-success' : order.status === 'Mới tạo' ? 'badge-primary' : 'badge-warning'}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-outline" onClick={() => openEditModal(order)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Sửa</button>
                    <button className="btn btn-outline" onClick={() => handleDelete(order.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có đơn hàng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && editingOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 className="mb-4">Cập nhật Đơn hàng #{editingOrder.id}</h3>
            <form onSubmit={handleSaveOrder}>
              <div className="input-group">
                <label className="input-label">Trạng thái thanh toán</label>
                <select className="input-field" value={editingOrder.paymentStatus} onChange={e => setEditingOrder({...editingOrder, paymentStatus: e.target.value})}>
                  <option value="Chưa thanh toán">Chưa thanh toán</option>
                  <option value="Đã thanh toán">Đã thanh toán</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Trạng thái xử lý</label>
                <select className="input-field" value={editingOrder.status} onChange={e => setEditingOrder({...editingOrder, status: e.target.value})}>
                  <option value="Mới tạo">Mới tạo</option>
                  <option value="Đã nhận đồ">Đã nhận đồ</option>
                  <option value="Đang giặt">Đang giặt</option>
                  <option value="Đang sấy">Đang sấy</option>
                  <option value="Sẵn sàng giao">Sẵn sàng giao</option>
                  <option value="Đã giao khách">Đã giao khách</option>
                  <option value="Đã hủy">Đã hủy</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
