"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "../styles/components/AdminNavBar.css"

const AdminNavBar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-container">
        <div className="admin-navbar-content">
          <div className="admin-navbar-brand">
            <span className="admin-brand-icon">
              <img src="/favicon2.png" alt="Park Moneyger Logo" className="logo-image" />
            </span>
            <h1 className="admin-brand-title">Admin Panel</h1>
          </div>

          <div className="admin-navbar-actions">
            <div className="admin-user-info">
              <span className="admin-user-icon">👤</span>
              <span className="admin-user-name">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="admin-user-role">ADMINISTRATOR</span>
            </div>

            <button className="admin-settings-button">
              <span className="admin-settings-icon">⚙️</span>
            </button>

            <button onClick={handleLogout} className="admin-logout-button">
              <span className="admin-logout-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default AdminNavBar
