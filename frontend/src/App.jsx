import { useEffect, useState } from "react";
import DisasterReliefLanding from "./landingpage";
import AdminDashboard from "./AdminDashboard";
import VolunteerDashboard from "./VolunteerDashboard"; 
import { useAuth } from "./context/AuthContext";
import { useVolunteers } from "./context/VolunteerContext"; 
import "./App.css";

function App() {
  const { isAdminAuthenticated } = useAuth();
  const { isVolunteerAuthenticated } = useVolunteers();

  const [lastPage, setLastPage] = useState(() => {
    
    return localStorage.getItem("resqwave.lastPage") || "/";
  });

  
  useEffect(() => {
    localStorage.setItem("resqwave.lastPage", lastPage);
  }, [lastPage]);

  
  useEffect(() => {
    const handlePopState = () => {
      setLastPage(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  
  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    setLastPage(path);
  };


  const renderPage = () => {
    if (isAdminAuthenticated) {
      return <AdminDashboard navigateTo={navigateTo} />;
    } else if (isVolunteerAuthenticated) {
      return <VolunteerDashboard navigateTo={navigateTo} />;
    } else {
      return <DisasterReliefLanding navigateTo={navigateTo} />;
    }
  };

  return <div className="App">{renderPage()}</div>;
}

export default App;
