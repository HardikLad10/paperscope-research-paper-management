import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Home from './pages/Home'
import CreatePaperPage from './pages/CreatePaperPage'
import AuthorInsightsPage from './pages/AuthorInsightsPage'
import ReviewPapersPage from './pages/ReviewPapersPage'
import PaperDetail from './pages/PaperDetail'
import { MainLayout } from './components/MainLayout'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('user')
    if (token && user) {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleLogin = (token, user) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('user', JSON.stringify(user))
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <MainLayout onLogout={handleLogout}>
                <Home defaultTab="search" />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/my-papers"
          element={
            isAuthenticated ? (
              <MainLayout onLogout={handleLogout}>
                <Home defaultTab="my-papers" />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/papers/new"
          element={
            isAuthenticated ? (
              <MainLayout onLogout={handleLogout}>
                <CreatePaperPage />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/insights"
          element={
            isAuthenticated ? (
              <MainLayout onLogout={handleLogout}>
                <AuthorInsightsPage />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/review-papers"
          element={
            isAuthenticated ? (
              <MainLayout onLogout={handleLogout}>
                <ReviewPapersPage />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/papers/:paper_id"
          element={
            isAuthenticated ? (
              <MainLayout onLogout={handleLogout}>
                <PaperDetail />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App

