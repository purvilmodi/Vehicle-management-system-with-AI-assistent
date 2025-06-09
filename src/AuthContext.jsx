import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('isAdmin', 'true');
    } else {
      localStorage.removeItem('isAdmin');
    }
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{ token, setToken, isAdmin, setIsAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
