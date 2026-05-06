import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Save, Printer, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateOrder = () => {
  const { services, addOrder, customers, addCustomer, shifts, branches } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const currentShift = shifts.find(s => s.staffId === user?.id && s.status === 'CheckedIn');
  const currentBranch = currentShift ? branches.find(b => b.id === currentShift.branchId) : null;
  
  const [branchId, setBranchId] = useState(currentBranch ? currentBranch.id : (branches.length > 0 ? branches[0].id : ''));

  React.useEffect(() => {
    if (!branchId && branches.length > 0) {
      if (user?.role === 'admin') {
        setBranchId(branches[0].id);
      } else if (currentBranch) {
        setBranchId(currentBranch.id);
      }
    }
  }, [branches, branchId, user?.role, currentBranch]);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const [orderItems, setOrderItems] = useState([]);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [surcharge, setSurcharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState('');
  
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const today = new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
  const tomorrow = new Date(Date.now() + 86400000 - tzOffset).toISOString().slice(0, 16);
  
  const [receiveDate, setReceiveDate] = useState(today);
  const [returnDate, setReturnDate] = useState(tomorrow);
  
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveAction, setSaveAction] = useState(null);
  
  const totalWeight = orderItems.reduce((sum, item) => sum + item.weight, 0);
  const itemsTotal = orderItems.reduce((sum, item) => sum + (item.weight * item.service.price), 0);
  const total = itemsTotal + parseInt(surcharge || 0) - parseInt(discount || 0);

  const updateItemWeight = (index, newWeight) => {
    const newItems = [...orderItems];
    newItems[index].weight = newWeight;
    setOrderItems(newItems);
  };

  const removeOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    setShowCustomerSuggestions(true);
    const existingCust = customers.find(c => c.phone === val);
    if (existingCust) {
      setName(existingCust.name);
      setIsExisting(true);
    } else {
      setName('');
      setIsExisting(false);
    }
  };

  const handleAddCustomer = () => {
    if (!phone || !name) {
      alert("Vui lòng nhập SĐT và tên khách hàng để thêm!");
      return;
    }
    addCustomer({ phone, name });
    setIsExisting(true);
    alert("Thêm khách hàng thành công!");
  };

  const handlePreSave = (action) => {
    if (!name || !phone || orderItems.length === 0) {
      alert("Vui lòng nhập tên, SĐT khách hàng và chọn ít nhất 1 dịch vụ!");
      return;
    }
    if (!branchId) {
      alert("Vui lòng chọn cơ sở!");
      return;
    }
    setSaveAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    // Tự động lưu khách hàng nếu chưa có khi tạo đơn (tùy chọn)
    if (!isExisting) {
      addCustomer({ phone, name });
    }

    const serviceString = orderItems.map(item => `${item.service.name} (${item.weight}kg)`).join(', ');

    addOrder({
      createdAt: new Date(receiveDate).toISOString(),
      staff: user?.name,
      branchId: parseInt(branchId),
      customerName: name,
      customerPhone: phone,
      service: serviceString,
      weight: totalWeight,
      pricePerKg: itemsTotal, // Saving total items cost here for reference
      surcharge: parseInt(surcharge || 0),
      discount: parseInt(discount || 0),
      totalPrice: total,
      paymentStatus: isPaid ? 'Đã thanh toán' : 'Chưa thanh toán',
      paymentMethod: isPaid ? paymentMethod : '-',
      status: 'Mới tạo',
      returnDate: new Date(returnDate).toISOString(),
      note
    });
    
    if (saveAction === 'print') {
      alert("Đang in hóa đơn...");
    }

    setShowConfirmModal(false);
    navigate('/orders');
  };

  return (
    <div>
      <h2 className="mb-6">Tạo đơn hàng mới</h2>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6" style={{ gridColumn: 'span 2' }}>
          <div className="card">
            <h3 className="flex items-center justify-between mb-4">
              <span>1. Thông tin khách hàng & Cơ sở</span>
              {phone && !isExisting && (
                <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={handleAddCustomer}>
                  <UserPlus size={14} /> Thêm khách hàng
                </button>
              )}
              {isExisting && (
                <span className="badge badge-success text-xs">Khách hàng cũ</span>
              )}
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="input-group mb-0">
                <label className="input-label">Cơ sở tiếp nhận</label>
                <select className="input-field" value={branchId} onChange={e => setBranchId(e.target.value)}>
                  {user?.role === 'admin' ? (
                    branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                  ) : (
                    currentBranch ? <option value={currentBranch.id}>{currentBranch.name}</option> : <option value="">-- Chưa check-in --</option>
                  )}
                </select>
              </div>
              <div className="input-group mb-0" style={{ position: 'relative' }}>
                <label className="input-label">Số điện thoại</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Nhập SĐT để tìm" 
                  value={phone} 
                  onChange={handlePhoneChange} 
                  onFocus={() => setShowCustomerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                />
                {showCustomerSuggestions && phone.length > 0 && !isExisting && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                    {customers.filter(c => c.phone.includes(phone)).map(c => (
                      <div 
                        key={c.id} 
                        style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                        className="hover:bg-slate-800"
                        onClick={() => {
                          setPhone(c.phone);
                          setName(c.name);
                          setIsExisting(true);
                          setShowCustomerSuggestions(false);
                        }}
                      >
                        <div className="font-semibold text-primary">{c.phone}</div>
                        <div className="text-sm">{c.name}</div>
                      </div>
                    ))}
                    {customers.filter(c => c.phone.includes(phone)).length === 0 && (
                      <div style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Không tìm thấy khách hàng. Nhập tên để thêm mới.</div>
                    )}
                  </div>
                )}
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Tên khách hàng</label>
                <input type="text" className="input-field" placeholder="Tên khách hàng" value={name} onChange={e => !isExisting && setName(e.target.value)} disabled={isExisting} style={isExisting ? { backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' } : {}} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4">2. Dịch vụ & Thời gian</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="input-group mb-0">
                <label className="input-label">Ngày nhận</label>
                <input type="datetime-local" className="input-field" value={receiveDate} onChange={e => setReceiveDate(e.target.value)} />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Ngày hẹn trả</label>
                <input type="datetime-local" className="input-field" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="input-label mb-2 block">Dịch vụ đã chọn</label>
              {orderItems.length === 0 ? (
                <div className="text-sm text-muted italic mb-4 p-4 border border-dashed border-slate-700 rounded-lg text-center">Chưa có dịch vụ nào được chọn.</div>
              ) : (
                <div className="flex flex-col gap-2 mb-4">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border border-slate-700 rounded-lg bg-slate-800/50">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{item.service.name}</div>
                        <div className="text-xs text-primary">{item.service.price.toLocaleString()}đ/kg</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="input-field mb-0 py-1 px-2 h-8 w-20 text-center bg-main border-slate-600" 
                            value={item.weight} 
                            onChange={e => updateItemWeight(idx, parseFloat(e.target.value) || 0)} 
                            min="0.1" step="0.1" 
                          />
                          <span className="text-sm text-muted">kg</span>
                        </div>
                        <div className="font-semibold w-24 text-right">
                          {(item.weight * item.service.price).toLocaleString()} đ
                        </div>
                        <button 
                          className="text-danger hover:text-red-400 p-1 opacity-80 hover:opacity-100"
                          onClick={() => removeOrderItem(idx)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="input-group mb-0" style={{ position: 'relative' }}>
                <label className="input-label">Thêm dịch vụ</label>
                <div 
                  className="input-field flex items-center justify-between cursor-pointer"
                  onClick={() => setShowServiceSuggestions(!showServiceSuggestions)}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    Nhấn để tìm và thêm dịch vụ...
                  </span>
                  <span className="text-xs">▼</span>
                </div>
                
                {showServiceSuggestions && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', marginTop: '0.25rem', padding: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                    <input 
                      type="text" 
                      className="input-field mb-2" 
                      placeholder="Gõ tên dịch vụ để tìm..." 
                      value={serviceSearchQuery}
                      onChange={e => setServiceSearchQuery(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {services.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map(s => (
                        <div 
                          key={s.id} 
                          style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '0.25rem', marginBottom: '0.25rem' }}
                          className="hover:bg-slate-800 flex justify-between items-center"
                          onClick={() => {
                            setOrderItems([...orderItems, { service: s, weight: 1 }]);
                            setShowServiceSuggestions(false);
                            setServiceSearchQuery('');
                          }}
                        >
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-sm text-success">{s.price.toLocaleString()}đ/kg</div>
                        </div>
                      ))}
                      {services.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
                        <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Không tìm thấy dịch vụ nào khớp.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group mb-0">
                <label className="input-label">Phụ thu (đ)</label>
                <input type="number" className="input-field" value={surcharge} onChange={e => setSurcharge(e.target.value)} />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Giảm giá (đ)</label>
                <input type="number" className="input-field" value={discount} onChange={e => setDiscount(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4">3. Ghi chú</h3>
            <textarea className="input-field" rows="3" placeholder="Nhập ghi chú đặc biệt..." value={note} onChange={e => setNote(e.target.value)}></textarea>
          </div>
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h3 className="mb-4">Tóm tắt đơn hàng</h3>
            
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-muted">Nhân viên trực:</span>
              <span className="font-semibold text-primary">{user?.name}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-muted">Cơ sở:</span>
              <span className="font-semibold text-success">{branches.find(b => b.id === parseInt(branchId))?.name || '---'}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-muted">Khách hàng:</span>
              <span className="font-semibold">{name || '---'}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-muted">Tổng dịch vụ:</span>
              <span className="font-semibold">{orderItems.length} dịch vụ ({totalWeight}kg)</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-muted">Tiền giặt:</span>
              <span className="font-semibold">{itemsTotal.toLocaleString()} đ</span>
            </div>
            {surcharge > 0 && (
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-muted">Phụ thu:</span>
                <span className="font-semibold text-warning">+{parseInt(surcharge).toLocaleString()} đ</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between mb-4 text-sm">
                <span className="text-muted">Giảm giá:</span>
                <span className="font-semibold text-success">-{parseInt(discount).toLocaleString()} đ</span>
              </div>
            )}
            
            <div className="my-4 pt-4 flex justify-between items-center" style={{ borderTop: '1px dashed var(--border-color)' }}>
              <span className="font-semibold text-lg">Tổng cộng:</span>
              <span className="font-semibold text-xl" style={{ color: 'var(--primary)' }}>{Math.max(0, total).toLocaleString()} đ</span>
            </div>

            <div className="my-4 pt-4" style={{ borderTop: '1px dashed var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="isPaid" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                <label htmlFor="isPaid" className="font-semibold cursor-pointer select-none">Khách đã thanh toán</label>
              </div>
              {isPaid && (
                <div className="flex gap-4 ml-7 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="paymentMethod" value="Tiền mặt" checked={paymentMethod === 'Tiền mặt'} onChange={e => setPaymentMethod(e.target.value)} style={{ accentColor: 'var(--primary)' }} /> Tiền mặt
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="paymentMethod" value="Chuyển khoản" checked={paymentMethod === 'Chuyển khoản'} onChange={e => setPaymentMethod(e.target.value)} style={{ accentColor: 'var(--primary)' }} /> Chuyển khoản
                  </label>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2 mt-6">
              <button className="btn btn-primary w-full" onClick={() => handlePreSave('save')}>
                <Save size={18} /> Lưu đơn hàng
              </button>
              <button className="btn btn-outline w-full" onClick={() => handlePreSave('print')}>
                <Printer size={18} /> Lưu & In hóa đơn
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 className="mb-4 text-xl">Xác nhận thông tin đơn hàng</h2>
            
            <div className="bg-main p-4 rounded-lg mb-4 text-sm space-y-2">
              <div className="flex justify-between border-b pb-2 border-slate-700">
                <span className="text-muted">Cơ sở:</span>
                <span className="font-semibold text-right">{branches.find(b => b.id === parseInt(branchId))?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-700">
                <span className="text-muted">Khách hàng:</span>
                <span className="font-semibold text-right">{name} - {phone}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-700">
                <span className="text-muted">Dịch vụ:</span>
                <span className="font-semibold text-right">{orderItems.length} dịch vụ</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-700">
                <span className="text-muted">Tổng cân nặng:</span>
                <span className="font-semibold text-right">{totalWeight}kg</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-700">
                <span className="text-muted">Thời gian nhận:</span>
                <span className="font-semibold text-right">{new Date(receiveDate).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-700">
                <span className="text-muted">Hẹn trả:</span>
                <span className="font-semibold text-right">{new Date(returnDate).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-700">
                <span className="text-muted">Thanh toán:</span>
                <span className={`font-semibold text-right ${isPaid ? 'text-success' : 'text-warning'}`}>
                  {isPaid ? `Đã thanh toán (${paymentMethod})` : 'Chưa thanh toán'}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="font-semibold text-lg">Tổng cộng:</span>
                <span className="font-semibold text-xl text-primary">{Math.max(0, total).toLocaleString()} đ</span>
              </div>
              {note && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <span className="text-muted block mb-1">Ghi chú:</span>
                  <p className="font-semibold text-warning">{note}</p>
                </div>
              )}
            </div>

            <p className="text-center text-muted mb-6 text-sm">
              Vui lòng kiểm tra kỹ các thông tin trên trước khi xác nhận tạo đơn.
            </p>

            <div className="flex justify-end gap-3">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy, Sửa lại
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmSave}
              >
                Xác nhận tạo đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrder;
