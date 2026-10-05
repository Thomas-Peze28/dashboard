import { useEffect } from 'react'
import { getToken } from './api/client'
import Dashboard from './components/dashboard/Dashboard'
import LoginPage from './components/LoginPage'
import './App.css'

function App() {
  const isAuthenticated = Boolean(getToken())

  useEffect(() => {
    if (isAuthenticated && window.location.pathname !== '/dashboard') {
      window.location.replace('/dashboard')
      return
    }

    if (!isAuthenticated && window.location.pathname === '/dashboard') {
      window.location.replace('/')
    }
  }, [isAuthenticated])

  if (isAuthenticated && window.location.pathname === '/dashboard') {
    return <Dashboard />
  }

  return <LoginPage />
}

export default App
