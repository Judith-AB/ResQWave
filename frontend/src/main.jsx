import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Import all context providers
import { RequestsProvider } from './context/RequestsContext.jsx'
import { VolunteerProvider } from './context/VolunteerContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Wrap App with all context providers */}
    <AuthProvider>
      <RequestsProvider>
        <VolunteerProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </VolunteerProvider>
      </RequestsProvider>
    </AuthProvider>
  </StrictMode>,
)