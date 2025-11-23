import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {

  const [adminLoggedIn, setAdminLoggedIn] = useState(
    () => localStorage.getItem("resqwave.isAdmin") === "true"
  );

  
  const [volunteer, setVolunteer] = useState(
    () => JSON.parse(localStorage.getItem("volunteer")) || null
  );

  const loginAdmin = () => {
    setAdminLoggedIn(true);
    localStorage.setItem("resqwave.isAdmin", "true");
  };

  const logoutAdmin = () => {
    setAdminLoggedIn(false);
    localStorage.removeItem("resqwave.isAdmin");
  };

  const loginVolunteer = (data) => {
    setVolunteer(data);
    localStorage.setItem("volunteer", JSON.stringify(data));
  };

  const logoutVolunteer = () => {
    setVolunteer(null);
    localStorage.removeItem("volunteer");
  };


  return (
    <AuthContext.Provider
      value={{
        adminLoggedIn,      // Admin status
        volunteer,          // Volunteer data
        loginAdmin,
        logoutAdmin,
        loginVolunteer,
        logoutVolunteer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};