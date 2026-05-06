import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('laundry_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('laundry_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('laundry_user');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const adminId = user.role === 'admin' ? user.id : (user.adminId || 1);
      fetch(`http://localhost:3001/api/users?adminId=${adminId}`)
        .then(res => res.json())
        .then(data => setUsers(data))
        .catch(console.error);
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        return true;
      }
      return false;
    } catch (e) { return false; }
  };

  const registerAdmin = async (email, password, name) => {
    try {
      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin', name, branchId: null })
      });
      const data = await res.json();
      if (!res.ok) return false;
      setUsers([...users, data]);
      setUser(data);
      return true;
    } catch (e) { return false; }
  };

  const addSubAdmin = async (email, password, name) => {
    try {
      const adminId = user?.adminId || user?.id || 1;
      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin', name, branchId: null, adminId })
      });
      const data = await res.json();
      if (!res.ok) return false;
      setUsers([...users, data]);
      return true;
    } catch (e) { return false; }
  };

  const createIndependentAdmin = async (email, password, name) => {
    try {
      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin', name, branchId: null })
      });
      if (!res.ok) return false;
      return true;
    } catch (e) { return false; }
  };

  const addStaff = async (staffData) => {
    try {
      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...staffData, role: 'staff' })
      });
      const data = await res.json();
      if (!res.ok) return false;
      setUsers([...users, data]);
      return true;
    } catch (e) { return false; }
  };

  const updateStaff = async (id, updatedData) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, ...updatedData } : u));
      }
    } catch (e) {}
  };

  const updateUser = async (id, updatedData) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, ...updatedData } : u));
        if (user && user.id === id) setUser({ ...user, ...updatedData });
      }
    } catch (e) {}
  };

  const deleteStaff = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (e) {}
  };

  const importStaff = async (newStaff) => {
    const r = await fetch('http://localhost:3001/api/users/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newStaff) });
    if(r.ok) {
      const res = await fetch('http://localhost:3001/api/users');
      const data = await res.json();
      setUsers(data);
    }
  };

  const logout = () => setUser(null);

  const isMainAdmin = user?.role === 'admin' && (user?.id === user?.adminId || !user?.adminId);

  return (
    <AuthContext.Provider value={{ user, users, login, registerAdmin, createIndependentAdmin, addSubAdmin, addStaff, updateStaff, updateUser, deleteStaff, importStaff, logout, isMainAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
