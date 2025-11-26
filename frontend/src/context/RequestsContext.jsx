import React, { createContext, useState, useContext } from 'react';

const RequestsContext = createContext();

export const useRequests = () => useContext(RequestsContext);

export const RequestsProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);


  const addRequest = (newRequest) => {
    setRequests(prevRequests => [
      ...prevRequests,
      { 
        ...newRequest, 
        id: newRequest.id, 
        status: 'Pending', 
        assignedVolunteerId: null 
      }
    ]);
  };

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