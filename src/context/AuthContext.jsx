import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('laundry_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Mock Database for users
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem('laundry_users');
    return savedUsers ? JSON.parse(savedUsers) : [
      { id: 1, email: 'admin@test.com', password: '123', role: 'admin', name: 'Chủ Tiệm', branchId: null },
    ];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('laundry_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('laundry_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('laundry_users', JSON.stringify(users));
  }, [users]);

  const login = (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const registerAdmin = (email, password, name) => {
    if (users.find(u => u.email === email)) return false; // Email đã tồn tại
    const newUser = { id: Date.now(), email, password, role: 'admin', name, branchId: null };
    setUsers([...users, newUser]);
    setUser(newUser);
    return true;
  };

  const addStaff = (email, password, name, branchId) => {
    if (users.find(u => u.email === email)) return false;
    const newStaff = { id: Date.now(), email, password, role: 'staff', name, branchId: parseInt(branchId) };
    setUsers([...users, newStaff]);
    return true;
  };

  const updateStaff = (id, updatedData) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updatedData, branchId: parseInt(updatedData.branchId) } : u));
  };

  const deleteStaff = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, users, login, registerAdmin, addStaff, updateStaff, deleteStaff, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
