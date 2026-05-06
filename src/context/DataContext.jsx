import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/branches').then(r => r.json()).then(setBranches).catch(console.error);
    fetch('http://localhost:3001/api/orders').then(r => r.json()).then(setOrders).catch(console.error);
    fetch('http://localhost:3001/api/services').then(r => r.json()).then(setServices).catch(console.error);
    fetch('http://localhost:3001/api/customers').then(r => r.json()).then(setCustomers).catch(console.error);
    fetch('http://localhost:3001/api/shifts').then(r => r.json()).then(setShifts).catch(console.error);
    fetch('http://localhost:3001/api/shift-templates').then(r => r.json()).then(setShiftTemplates).catch(console.error);
  }, []);

  const addShiftTemplate = async (template) => {
    const r = await fetch('http://localhost:3001/api/shift-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(template) });
    const data = await r.json();
    setShiftTemplates([...shiftTemplates, data]);
  };
  const deleteShiftTemplate = async (id) => {
    await fetch(`http://localhost:3001/api/shift-templates/${id}`, { method: 'DELETE' });
    setShiftTemplates(shiftTemplates.filter(t => t.id !== id));
  };

  const addCustomer = async (customer) => {
    if (!customers.find(c => c.phone === customer.phone)) {
      const r = await fetch('http://localhost:3001/api/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customer)
      });
      const data = await r.json();
      if(r.ok) setCustomers([...customers, data]);
    }
  };

  const addBranch = async (branch) => {
    const r = await fetch('http://localhost:3001/api/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(branch) });
    const data = await r.json();
    setBranches([...branches, data]);
  };
  const updateBranch = async (id, updatedBranch) => {
    await fetch(`http://localhost:3001/api/branches/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedBranch) });
    setBranches(branches.map(b => b.id === id ? { ...b, ...updatedBranch } : b));
  };
  const deleteBranch = async (id) => {
    await fetch(`http://localhost:3001/api/branches/${id}`, { method: 'DELETE' });
    setBranches(branches.filter(b => b.id !== id));
  };

  const addOrder = async (order) => {
    const o = { ...order, id: `LD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, '0')}` };
    await fetch('http://localhost:3001/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
    setOrders([...orders, o]);
  };
  const updateOrder = async (id, updatedOrder) => {
    await fetch(`http://localhost:3001/api/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedOrder) });
    setOrders(orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o));
  };
  const deleteOrder = async (id) => {
    await fetch(`http://localhost:3001/api/orders/${id}`, { method: 'DELETE' });
    setOrders(orders.filter(o => o.id !== id));
  };

  const addService = async (service) => {
    const r = await fetch('http://localhost:3001/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(service) });
    const data = await r.json();
    setServices([...services, data]);
  };
  const updateService = async (id, updatedService) => {
    await fetch(`http://localhost:3001/api/services/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedService) });
    setServices(services.map(s => s.id === id ? { ...s, ...updatedService } : s));
  };
  const deleteService = async (id) => {
    await fetch(`http://localhost:3001/api/services/${id}`, { method: 'DELETE' });
    setServices(services.filter(s => s.id !== id));
  };

  const importServices = async (newServices) => {
    const r = await fetch('http://localhost:3001/api/services/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newServices) });
    if(r.ok) {
      const res = await fetch('http://localhost:3001/api/services');
      const data = await res.json();
      setServices(data);
    }
  };

  const importBranches = async (newBranches) => {
    const r = await fetch('http://localhost:3001/api/branches/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBranches) });
    if(r.ok) {
      const res = await fetch('http://localhost:3001/api/branches');
      const data = await res.json();
      setBranches(data);
    }
  };

  const importOrders = async (newOrders) => {
    const r = await fetch('http://localhost:3001/api/orders/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrders) });
    if(r.ok) {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      setOrders(data);
    }
  };

  const addShift = async (shift) => {
    const r = await fetch('http://localhost:3001/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(shift) });
    const data = await r.json();
    setShifts([...shifts, data]);
  };
  const updateShift = async (id, updatedShift) => {
    await fetch(`http://localhost:3001/api/shifts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedShift) });
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
      shiftTemplates, addShiftTemplate, deleteShiftTemplate
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
