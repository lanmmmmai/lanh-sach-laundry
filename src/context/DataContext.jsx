import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const adminId = user?.role === 'admin' ? user.id : (user?.adminId || 1); // fallback to 1

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
    const fetchWithAdmin = (url) => fetch(`${url}?adminId=${adminId}`).then(r => r.json());
    fetchWithAdmin('http://localhost:3001/api/branches').then(setBranches).catch(console.error);
    fetchWithAdmin('http://localhost:3001/api/orders').then(setOrders).catch(console.error);
    fetchWithAdmin('http://localhost:3001/api/services').then(setServices).catch(console.error);
    fetchWithAdmin('http://localhost:3001/api/customers').then(setCustomers).catch(console.error);
    fetchWithAdmin('http://localhost:3001/api/shifts').then(setShifts).catch(console.error);
    fetchWithAdmin('http://localhost:3001/api/shift-templates').then(setShiftTemplates).catch(console.error);
  }, [user, adminId]);

  const addShiftTemplate = async (template) => {
    const r = await fetch('http://localhost:3001/api/shift-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...template, adminId }) });
    const data = await r.json();
    setShiftTemplates([...shiftTemplates, data]);
    addNotification('Hệ thống đã được cập nhật (Thêm ca làm việc)');
  };
  const deleteShiftTemplate = async (id) => {
    await fetch(`http://localhost:3001/api/shift-templates/${id}`, { method: 'DELETE' });
    setShiftTemplates(shiftTemplates.filter(t => t.id !== id));
    addNotification('Hệ thống đã được cập nhật (Xóa ca làm việc)');
  };

  const addCustomer = async (customer) => {
    if (!customers.find(c => c.phone === customer.phone)) {
      const r = await fetch('http://localhost:3001/api/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...customer, adminId })
      });
      const data = await r.json();
      if(r.ok) setCustomers([...customers, data]);
    }
  };

  const addBranch = async (branch) => {
    const r = await fetch('http://localhost:3001/api/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...branch, adminId }) });
    const data = await r.json();
    setBranches([...branches, data]);
  };
  const updateBranch = async (id, updatedBranch) => {
    await fetch(`http://localhost:3001/api/branches/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updatedBranch, adminId }) });
    setBranches(branches.map(b => b.id === id ? { ...b, ...updatedBranch } : b));
    addNotification('Hệ thống đã được cập nhật (Sửa chi nhánh)');
  };
  const deleteBranch = async (id) => {
    await fetch(`http://localhost:3001/api/branches/${id}`, { method: 'DELETE' });
    setBranches(branches.filter(b => b.id !== id));
  };

  const addOrder = async (order) => {
    const o = { ...order, id: `LD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, '0')}`, adminId };
    await fetch('http://localhost:3001/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
    setOrders([...orders, o]);
    addNotification(`Đơn hàng mới đã được thêm: ${o.id}`);
  };
  const updateOrder = async (id, updatedOrder) => {
    await fetch(`http://localhost:3001/api/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updatedOrder, adminId }) });
    setOrders(orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o));
  };
  const deleteOrder = async (id) => {
    await fetch(`http://localhost:3001/api/orders/${id}`, { method: 'DELETE' });
    setOrders(orders.filter(o => o.id !== id));
  };

  const addService = async (service) => {
    const r = await fetch('http://localhost:3001/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...service, adminId }) });
    const data = await r.json();
    setServices([...services, data]);
  };
  const updateService = async (id, updatedService) => {
    await fetch(`http://localhost:3001/api/services/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updatedService, adminId }) });
    setServices(services.map(s => s.id === id ? { ...s, ...updatedService } : s));
    addNotification('Hệ thống đã được cập nhật (Sửa dịch vụ)');
  };
  const deleteService = async (id) => {
    await fetch(`http://localhost:3001/api/services/${id}`, { method: 'DELETE' });
    setServices(services.filter(s => s.id !== id));
  };

  const importServices = async (newServices) => {
    const payload = newServices.map(s => ({ ...s, adminId }));
    const r = await fetch('http://localhost:3001/api/services/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if(r.ok) {
      const res = await fetch(`http://localhost:3001/api/services?adminId=${adminId}`);
      const data = await res.json();
      setServices(data);
    }
  };

  const importBranches = async (newBranches) => {
    const payload = newBranches.map(b => ({ ...b, adminId }));
    const r = await fetch('http://localhost:3001/api/branches/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if(r.ok) {
      const res = await fetch(`http://localhost:3001/api/branches?adminId=${adminId}`);
      const data = await res.json();
      setBranches(data);
    }
  };

  const importOrders = async (newOrders) => {
    const payload = newOrders.map(o => ({ ...o, adminId }));
    const r = await fetch('http://localhost:3001/api/orders/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if(r.ok) {
      const res = await fetch(`http://localhost:3001/api/orders?adminId=${adminId}`);
      const data = await res.json();
      setOrders(data);
    }
  };

  const addShift = async (shift) => {
    const r = await fetch('http://localhost:3001/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...shift, adminId }) });
    const data = await r.json();
    setShifts([...shifts, data]);
  };
  const updateShift = async (id, updatedShift) => {
    await fetch(`http://localhost:3001/api/shifts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updatedShift, adminId }) });
    setShifts(shifts.map(s => s.id === id ? { ...s, ...updatedShift } : s));
  };
  const deleteShift = async (id) => {
    await fetch(`http://localhost:3001/api/shifts/${id}`, { method: 'DELETE' });
    setShifts(shifts.filter(s => s.id !== id));
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
