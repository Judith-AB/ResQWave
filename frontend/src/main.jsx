import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { RequestsProvider } from './context/RequestsContext.jsx'
import { VolunteerProvider } from './context/VolunteerContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx' // NEW

createRoot(document.getElementById('root')).render(
  <StrictMode>

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