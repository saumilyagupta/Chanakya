import { Outlet, Link, useLocation } from 'react-router-dom'
import './Layout.css'

function Layout() {
  const location = useLocation()
  
  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path)
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/setup" className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-title">Sahayak Pro</span>
              <span className="logo-subtitle">Smart Classroom Assistant</span>
            </div>
          </Link>
          
          <nav className="nav">
            <Link 
              to="/setup" 
              className={`nav-link ${isActiveRoute('/setup') ? 'active' : ''}`}
            >
              <span className="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </span>
              Classes
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="main">
        <Outlet />
      </main>
      
      <footer className="footer">
        <p>Sahayak Pro - Empowering Rural Classrooms</p>
      </footer>
    </div>
  )
}

export default Layout
