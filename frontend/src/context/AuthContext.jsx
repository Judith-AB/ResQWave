import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    // Restore login state from localStorage
    return localStorage.getItem("resqwave.isAdmin") === "true";
  });

  const loginAdmin = () => {
    setIsAdminAuthenticated(true);
    localStorage.setItem("resqwave.isAdmin", "true"); // persist login
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.setItem("resqwave.isAdmin", "false"); // persist logout
  };

  return (
    <AuthContext.Provider value={{ isAdminAuthenticated, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
