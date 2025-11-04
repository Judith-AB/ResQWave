import React, { createContext, useState, useContext } from 'react';

const VolunteerContext = createContext();

export const useVolunteers = () => useContext(VolunteerContext);

export const VolunteerProvider = ({ children }) => {
  const [volunteers, setVolunteers] = useState([]);

  // Function to add a new volunteer
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

  // Function to update volunteer status/assignment
  const updateVolunteer = (id, updates) => {
    setVolunteers(prevVolunteers =>
      prevVolunteers.map(v => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  return (
    <VolunteerContext.Provider value={{ volunteers, addVolunteer, updateVolunteer }}>
      {children}
    </VolunteerContext.Provider>
  );
};