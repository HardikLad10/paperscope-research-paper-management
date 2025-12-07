import { useLocation, useNavigate } from 'react-router-dom'
import './MainLayout.css'

export function MainLayout({ children, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const path = location.pathname

  const isActive = (target) => {
    if (target === '/' && path === '/') return true
    if (target !== '/' && path.startsWith(target)) return true
    return false
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-content">
          <h1>Papers Management System</h1>
          <div className="header-actions">
            <span className="user-info">Welcome, {user.user_name || user.username || 'User'}</span>
            <button onClick={onLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="app-tabs">
        <button
          className={path === '/' ? 'tab active' : 'tab'}
          onClick={() => navigate('/')}
        >
          Search Papers
        </button>
        <button
          className={isActive('/my-papers') ? 'tab active' : 'tab'}
          onClick={() => navigate('/my-papers')}
        >
          My Papers
        </button>
        <button
          className={isActive('/insights') ? 'tab active' : 'tab'}
          onClick={() => navigate('/insights')}
        >
          Insights
        </button>
        <button
          className={isActive('/papers/new') ? 'tab active' : 'tab'}
          onClick={() => navigate('/papers/new')}
        >
          New Paper
        </button>
        {(user.is_reviewer === 1 || user.is_reviewer === '1') && (
          <button
            className={isActive('/review-papers') ? 'tab active' : 'tab'}
            onClick={() => navigate('/review-papers')}
          >
            Review Papers
          </button>
        )}
      </nav>

      <main className="app-main">{children}</main>
    </div>
  )
}

