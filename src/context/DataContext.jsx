import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const adminId = user?.adminId || user?.id || 1; 

  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message) => {
    setNotifications(prev => [{ id: Date.now(), message, time: new Date().toISOString(), read: false }, ...prev].slice(0, 10));
  };
  
  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      const [{ data: b }, { data: o }, { data: s }, { data: c }, { data: sh }, { data: st }] = await Promise.all([
        supabase.from('branches').select('*').eq('adminId', adminId),
        supabase.from('orders').select('*').eq('adminId', adminId),
        supabase.from('services').select('*').eq('adminId', adminId),
        supabase.from('customers').select('*').eq('adminId', adminId),
        supabase.from('shifts').select('*').eq('adminId', adminId),
        supabase.from('shift_templates').select('*').eq('adminId', adminId)
      ]);
      
      if (b) setBranches(b);
      if (o) setOrders(o);
      if (s) setServices(s);
      if (c) setCustomers(c);
      if (sh) setShifts(sh);
      if (st) setShiftTemplates(st);
    };
    
    fetchData();
  }, [user, adminId]);

  const addShiftTemplate = async (template) => {
    const { data, error } = await supabase.from('shift_templates').insert([{ ...template, adminId }]).select().maybeSingle();
    if (!error && data) {
      setShiftTemplates([...shiftTemplates, data]);
      addNotification('Hệ thống đã được cập nhật (Thêm ca làm việc)');
    }
  };

  const deleteShiftTemplate = async (id) => {
    const { error } = await supabase.from('shift_templates').delete().eq('id', id);
    if (!error) {
      setShiftTemplates(shiftTemplates.filter(t => t.id !== id));
      addNotification('Hệ thống đã được cập nhật (Xóa ca làm việc)');
    }
  };

  const addCustomer = async (customer) => {
    if (!customers.find(c => c.phone === customer.phone)) {
      const { data, error } = await supabase.from('customers').insert([{ ...customer, adminId }]).select().maybeSingle();
      if (!error && data) setCustomers([...customers, data]);
    }
  };

  const addBranch = async (branch) => {
    const { data, error } = await supabase.from('branches').insert([{ ...branch, adminId }]).select().maybeSingle();
    if (!error && data) setBranches([...branches, data]);
  };

  const updateBranch = async (id, updatedBranch) => {
    const { error } = await supabase.from('branches').update({ ...updatedBranch }).eq('id', id);
    if (!error) {
      setBranches(branches.map(b => b.id === id ? { ...b, ...updatedBranch } : b));
      addNotification('Hệ thống đã được cập nhật (Sửa chi nhánh)');
    }
  };

  const deleteBranch = async (id) => {
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (!error) setBranches(branches.filter(b => b.id !== id));
  };

  const addOrder = async (order) => {
    const orderDate = new Date(order.createdAt || Date.now());
    const month = orderDate.getMonth() + 1;
    const day = String(orderDate.getDate()).padStart(2, '0');
    const datePrefix = `${month}${day}`;
    
    const ordersToday = orders.filter(o => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt);
      return d.getMonth() + 1 === month && d.getDate() === orderDate.getDate() && d.getFullYear() === orderDate.getFullYear();
    });
    
    let maxIndex = 0;
    ordersToday.forEach(o => {
      if (o.id && o.id.startsWith(datePrefix)) {
        const idxStr = o.id.slice(datePrefix.length);
        const idx = parseInt(idxStr, 10);
        if (!isNaN(idx) && idx > maxIndex) {
          maxIndex = idx;
        }
      }
    });
    
    const dailyIndex = Math.max(maxIndex, ordersToday.length) + 1;
    const orderId = `${datePrefix}${String(dailyIndex).padStart(3, '0')}`;

    const o = { ...order, id: orderId, adminId, isHidden: 0 };
    const { error } = await supabase.from('orders').insert([o]);
    if (!error) {
      setOrders([o, ...orders]);
      addNotification(`Đơn hàng mới đã được thêm: ${o.id}`);
    }
  };

  const updateOrder = async (id, updatedOrder) => {
    const { error } = await supabase.from('orders').update({ ...updatedOrder }).eq('id', id);
    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o));
    }
  };

  const deleteOrder = async (id) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const addService = async (service) => {
    const { data, error } = await supabase.from('services').insert([{ ...service, adminId }]).select().maybeSingle();
    if (!error && data) setServices([...services, data]);
  };

  const updateService = async (id, updatedService) => {
    const { error } = await supabase.from('services').update({ ...updatedService }).eq('id', id);
    if (!error) {
      setServices(services.map(s => s.id === id ? { ...s, ...updatedService } : s));
      addNotification('Hệ thống đã được cập nhật (Sửa dịch vụ)');
    }
  };

  const deleteService = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (!error) setServices(services.filter(s => s.id !== id));
  };

  const importServices = async (newServices) => {
    for (const s of newServices) {
      const { id, ...serviceData } = s;
      const { data: existing } = await supabase.from('services').select('id').eq('name', s.name).eq('adminId', adminId);
      if (existing && existing.length > 0) {
        await supabase.from('services').update({ price: s.price, unit: s.unit, category: s.category }).eq('id', existing[0].id);
      } else {
        await supabase.from('services').insert([{ ...serviceData, adminId }]);
      }
    }
    const { data } = await supabase.from('services').select('*').eq('adminId', adminId);
    if (data) setServices(data);
  };

  const importBranches = async (newBranches) => {
    for (const b of newBranches) {
      const { id, ...branchData } = b;
      const { data: existing } = await supabase.from('branches').select('id').eq('name', b.name).eq('adminId', adminId);
      if (existing && existing.length > 0) {
        await supabase.from('branches').update({ address: b.address }).eq('id', existing[0].id);
      } else {
        await supabase.from('branches').insert([{ ...branchData, adminId }]);
      }
    }
    const { data } = await supabase.from('branches').select('*').eq('adminId', adminId);
    if (data) setBranches(data);
  };

  const importOrders = async (newOrders) => {
    for (const o of newOrders) {
      const { data: existing } = await supabase.from('orders').select('id').eq('id', o.id).eq('adminId', adminId);
      const payload = { ...o, adminId, isHidden: o.isHidden ? 1 : 0 };
      if (existing && existing.length > 0) {
        await supabase.from('orders').update(payload).eq('id', o.id);
      } else {
        await supabase.from('orders').insert([payload]);
      }
    }
    const { data } = await supabase.from('orders').select('*').eq('adminId', adminId);
    if (data) setOrders(data);
  };

  const addShift = async (shift) => {
    const { data, error } = await supabase.from('shifts').insert([{ ...shift, adminId, status: shift.status || 'Pending', shiftName: shift.shiftName || '' }]).select().maybeSingle();
    if (!error && data) setShifts([...shifts, data]);
  };

  const updateShift = async (id, updatedShift) => {
    const { error } = await supabase.from('shifts').update({ ...updatedShift }).eq('id', id);
    if (!error) setShifts(shifts.map(s => s.id === id ? { ...s, ...updatedShift } : s));
  };

  const deleteShift = async (id) => {
    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (!error) setShifts(shifts.filter(s => s.id !== id));
  };

  return (
    <DataContext.Provider value={{ 
      branches, addBranch, updateBranch, deleteBranch, importBranches,
      orders, addOrder, updateOrder, deleteOrder, importOrders,
      services, addService, updateService, deleteService, importServices,
      customers, addCustomer,
      shifts, addShift, updateShift, deleteShift,
      shiftTemplates, addShiftTemplate, deleteShiftTemplate,
      notifications, markNotificationsAsRead
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
