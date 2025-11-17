import React, { createContext, useState, useContext, useEffect } from 'react';

const VolunteerContext = createContext();

export const useVolunteers = () => useContext(VolunteerContext);

export const VolunteerProvider = ({ children }) => {
  const [volunteers, setVolunteers] = useState(() => {
    
    const savedVols = localStorage.getItem("resqwave.volunteers");
    return savedVols ? JSON.parse(savedVols) : [];
  });

  const [isVolunteerAuthenticated, setIsVolunteerAuthenticated] = useState(() => {
    return localStorage.getItem("resqwave.isVolunteer") === "true";
  });

  
  useEffect(() => {
    localStorage.setItem("resqwave.volunteers", JSON.stringify(volunteers));
  }, [volunteers]);

  
  useEffect(() => {
    localStorage.setItem("resqwave.isVolunteer", isVolunteerAuthenticated);
  }, [isVolunteerAuthenticated]);

  const addVolunteer = (newVolunteer) => {
    setVolunteers(prevVolunteers => [
      ...prevVolunteers,
      { 
        ...newVolunteer, 
        id: Date.now(), 
        status: 'Available' 
      }
    ]);
  };

  const updateVolunteer = (id, updates) => {
    setVolunteers(prevVolunteers =>
      prevVolunteers.map(v => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const loginVolunteer = () => setIsVolunteerAuthenticated(true);
  const logoutVolunteer = () => setIsVolunteerAuthenticated(false);

  return (
    <VolunteerContext.Provider 
      value={{ 
        volunteers, addVolunteer, updateVolunteer, 
        isVolunteerAuthenticated, loginVolunteer, logoutVolunteer 
      }}
    >
      {children}
    </VolunteerContext.Provider>
  );
};
