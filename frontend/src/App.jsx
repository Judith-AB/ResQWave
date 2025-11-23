
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DisasterReliefLanding from "./landingpage";
import AdminDashboard from "./AdminDashboard";
import VolunteerDashboard from "./VolunteerDashboard";
import AdminSignInForm from "./AdminSignInForm";
import VolunteerSignInModal from "./VolunteerSignInModal";
import { useAuth } from "./context/AuthContext";
import "./App.css";



const AdminRoute = ({ children }) => {
  const { adminLoggedIn } = useAuth();
  return adminLoggedIn ? children : <Navigate to="/admin/login" replace />;
};

const VolunteerRoute = ({ children }) => {
  const { volunteer } = useAuth();

  if (!volunteer) {
    return <Navigate to="/" replace />;
  }

  return children;
};


export default function App() {

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<DisasterReliefLanding />} />

        <Route path="/admin/login" element={<AdminSignInForm />} />
        <Route path="/volunteer/login" element={<VolunteerSignInModal />} />


        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/volunteer/dashboard"
          element={
            <VolunteerRoute>
              <VolunteerDashboard />
            </VolunteerRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}