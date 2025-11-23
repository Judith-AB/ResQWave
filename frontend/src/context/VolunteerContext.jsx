import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";

const VolunteerContext = createContext();

export const useVolunteers = () => useContext(VolunteerContext);

export const VolunteerProvider = ({ children }) => {

  const {
    volunteer: volunteerInfo, 
    loginVolunteer,
    logoutVolunteer
  } = useAuth();

  return (
    <VolunteerContext.Provider
      value={{
        volunteerInfo,
        loginVolunteer,
        logoutVolunteer,
      }}
    >
      {children}
    </VolunteerContext.Provider>
  );
};