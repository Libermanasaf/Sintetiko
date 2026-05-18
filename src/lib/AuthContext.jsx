import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem('sintetiko_role');
    if (savedRole) {
      setRole(savedRole);
    }
    setIsInitializing(false);
  }, []);

  const login = (selectedRole) => {
    localStorage.setItem('sintetiko_role', selectedRole);
    setRole(selectedRole);
  };

  const logout = () => {
    localStorage.removeItem('sintetiko_role');
    setRole(null);
  };

  const isAdmin = role === 'admin';
  const isPlayer = role === 'player';

  return (
    <AuthContext.Provider value={{ role, login, logout, isAdmin, isPlayer, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
