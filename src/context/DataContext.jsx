import React, { createContext, useContext, useState } from 'react';
import { mockBranches as initialBranches, mockServices, mockOrders } from '../data/mockData';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]); // Empty initial list as requested
  const [customers, setCustomers] = useState([]);

  const addCustomer = (customer) => {
    // customer: { phone, name }
    if (!customers.find(c => c.phone === customer.phone)) {
      setCustomers([...customers, { id: Date.now(), ...customer }]);
    }
  };

  const addBranch = (branch) => {
    setBranches([...branches, { id: Date.now(), ...branch }]);
  };
  const updateBranch = (id, updatedBranch) => {
    setBranches(branches.map(b => b.id === id ? { ...b, ...updatedBranch } : b));
  };
  const deleteBranch = (id) => {
    setBranches(branches.filter(b => b.id !== id));
  };

  const addOrder = (order) => {
    setOrders([...orders, { ...order, id: `LD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, '0')}` }]);
  };
  const updateOrder = (id, updatedOrder) => {
    setOrders(orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o));
  };
  const deleteOrder = (id) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  const addService = (service) => {
    setServices([...services, { id: Date.now(), ...service }]);
  };

  const updateService = (id, updatedService) => {
    setServices(services.map(s => s.id === id ? { ...s, ...updatedService } : s));
  };

  const deleteService = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  const importServices = (newServices) => {
    setServices(newServices);
  };

  return (
    <DataContext.Provider value={{ 
      branches, addBranch, updateBranch, deleteBranch,
      orders, addOrder, updateOrder, deleteOrder, 
      services, addService, updateService, deleteService, importServices,
      customers, addCustomer
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
