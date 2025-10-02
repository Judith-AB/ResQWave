import React, { createContext, useState, useContext } from 'react';

const RequestsContext = createContext();

export const useRequests = () => useContext(RequestsContext);

export const RequestsProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);

  // Function to add a new help request
  const addRequest = (newRequest) => {
    setRequests(prevRequests => [
      ...prevRequests,
      { 
        ...newRequest, 
        id: newRequest.id, // Use the ID passed from the form
        status: 'Pending', 
        assignedVolunteerId: null 
      }
    ]);
  };

  // Function to update the status or assignment of a request
  const updateRequest = (id, updates) => {
    setRequests(prevRequests =>
      prevRequests.map(req => (req.id === id ? { ...req, ...updates } : req))
    );
  };

  return (
    <RequestsContext.Provider value={{ requests, addRequest, updateRequest }}>
      {children}
    </RequestsContext.Provider>
  );
};