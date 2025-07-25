import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'

// Pages
import LandingPage from './pages/LandingPage'
import OnboardingFlow from './pages/OnboardingFlow'
import Dashboard from './pages/Dashboard'
import EventLobby from './pages/EventLobby'
import SpeedNetworkingRoom from './pages/SpeedNetworkingRoom'
import Connections from './pages/Connections'
import Analytics from './pages/Analytics'
import AdminPanel from './pages/AdminPanel'

// Components
import LoadingScreen from './components/LoadingScreen'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {!user ? (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/onboarding" element={<OnboardingFlow />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/event/:eventId/lobby" element={<EventLobby />} />
              <Route path="/event/:eventId/room" element={<SpeedNetworkingRoom />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App