import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
      const fetchUsers = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .or(`adminId.eq.${adminId},id.eq.${adminId}`);
        if (!error && data) {
          const parsedData = data.map(u => ({
            ...u,
            branchIds: typeof u.branchIds === 'string' ? JSON.parse(u.branchIds) : (u.branchIds || [])
          }));
          setUsers(parsedData);
        }
      };
      fetchUsers();
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();
        
      if (error) return { success: false, message: error.message };

      if (data) {
        setUser({
          ...data,
          branchIds: typeof data.branchIds === 'string' ? JSON.parse(data.branchIds) : (data.branchIds || [])
        });
        return { success: true };
      }
      return { success: false, message: 'Sai email hoặc mật khẩu' };
    } catch (e) { return { success: false, message: e.message }; }
  };

  const registerAdmin = async (email, password, name) => {
    try {
      const { data: existing, error: searchError } = await supabase.from('users').select('id').eq('email', email);
      if (searchError) return { success: false, message: searchError.message };
      if (existing && existing.length > 0) return { success: false, message: 'Email này đã được sử dụng!' };

      const { data, error } = await supabase
        .from('users')
        .insert([{ email, password, role: 'admin', name, branchIds: '[]', salaryType: 'parttime', salaryRate: 0 }])
        .select()
        .maybeSingle();
        
      if (error) return { success: false, message: error.message };
      if (!data) return { success: false, message: 'Lỗi không xác định khi tạo tài khoản' };
      
      await supabase.from('users').update({ adminId: data.id }).eq('id', data.id);
      data.adminId = data.id;
      data.branchIds = [];
      
      setUsers([...users, data]);
      setUser(data);
      return { success: true };
    } catch (e) { return { success: false, message: e.message }; }
  };

  const addSubAdmin = async (email, password, name) => {
    try {
      const adminId = user?.adminId || user?.id || 1;
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, password, role: 'admin', name, adminId, branchIds: '[]', salaryType: 'parttime', salaryRate: 0 }])
        .select()
        .maybeSingle();
        
      if (error || !data) return false;
      data.branchIds = [];
      setUsers([...users, data]);
      return true;
    } catch (e) { return false; }
  };

  const createIndependentAdmin = async (email, password, name) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, password, role: 'admin', name, branchIds: '[]', salaryType: 'parttime', salaryRate: 0 }])
        .select()
        .maybeSingle();
        
      if (error || !data) return false;
      await supabase.from('users').update({ adminId: data.id }).eq('id', data.id);
      return true;
    } catch (e) { return false; }
  };

  const addStaff = async (staffData) => {
    try {
      const adminId = user?.adminId || user?.id || 1;
      const bIds = staffData.branchIds ? JSON.stringify(staffData.branchIds) : '[]';
      const { data, error } = await supabase
        .from('users')
        .insert([{ 
          ...staffData, 
          role: 'staff', 
          adminId,
          branchIds: bIds,
          salaryType: staffData.salaryType || 'parttime',
          salaryRate: staffData.salaryRate || 0
        }])
        .select()
        .maybeSingle();
        
      if (error || !data) return false;
      data.branchIds = staffData.branchIds || [];
      setUsers([...users, data]);
      return true;
    } catch (e) { return false; }
  };

  const updateStaff = async (id, updatedData) => {
    try {
      const updatePayload = { ...updatedData };
      if (updatePayload.branchIds) {
        updatePayload.branchIds = JSON.stringify(updatePayload.branchIds);
      }
      const { error } = await supabase.from('users').update(updatePayload).eq('id', id);
      if (!error) {
        setUsers(users.map(u => u.id === id ? { ...u, ...updatedData } : u));
      }
    } catch (e) {}
  };

  const updateUser = async (id, updatedData) => {
    try {
      const updatePayload = { ...updatedData };
      if (updatePayload.branchIds) {
        updatePayload.branchIds = JSON.stringify(updatePayload.branchIds);
      }
      const { error } = await supabase.from('users').update(updatePayload).eq('id', id);
      if (!error) {
        setUsers(users.map(u => u.id === id ? { ...u, ...updatedData } : u));
        if (user && user.id === id) setUser({ ...user, ...updatedData });
      }
    } catch (e) {}
  };

  const deleteStaff = async (id) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (!error) {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (e) {}
  };

  const importStaff = async (newStaff) => {
    const adminId = user?.adminId || user?.id || 1;
    for (const s of newStaff) {
      const bIds = s.branchIds ? JSON.stringify(s.branchIds) : '[]';
      const { data: existing } = await supabase.from('users').select('id').or(`email.eq.${s.email},name.eq.${s.name}`);
      if (existing && existing.length > 0) {
        await supabase.from('users').update({
          password: s.password,
          branchId: s.branchId || null,
          branchIds: bIds,
          salaryType: s.salaryType || 'parttime',
          salaryRate: s.salaryRate || 0,
          adminId
        }).eq('id', existing[0].id);
      } else {
        await supabase.from('users').insert([{
          email: s.email,
          password: s.password,
          role: 'staff',
          name: s.name,
          branchId: s.branchId || null,
          branchIds: bIds,
          salaryType: s.salaryType || 'parttime',
          salaryRate: s.salaryRate || 0,
          adminId
        }]);
      }
    }
    
    const { data } = await supabase.from('users').select('*').or(`adminId.eq.${adminId},id.eq.${adminId}`);
    if (data) {
      const parsedData = data.map(u => ({
        ...u,
        branchIds: typeof u.branchIds === 'string' ? JSON.parse(u.branchIds) : (u.branchIds || [])
      }));
      setUsers(parsedData);
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
