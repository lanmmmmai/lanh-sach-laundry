import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Mock Database for users
  const [users, setUsers] = useState([
    { id: 1, email: 'admin@test.com', password: '123', role: 'admin', name: 'Chủ Tiệm', branchId: null },
  ]);

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
