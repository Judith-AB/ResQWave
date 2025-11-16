import DisasterReliefLanding from './landingpage'
import AdminDashboard from './AdminDashboard'
import { useAuth } from './context/AuthContext' 
import './App.css'

function App() {
  const { isAdminAuthenticated } = useAuth();

  return (
    <div className="App">
      {isAdminAuthenticated ? (
        <AdminDashboard />
      ) : (
        <DisasterReliefLanding />
      )}
    </div>
  )
}

export default App