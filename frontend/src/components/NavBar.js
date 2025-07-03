"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "../styles/components/NavBar.css"

const NavBar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <span className="brand-icon">🚗</span>
            <h1 className="brand-title">ParkManager</h1>
          </div>

          <div className="navbar-actions">
            <div className="user-info">
              <span className="user-icon">👤</span>
              <span className="user-name">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="user-role">{user?.role?.toUpperCase()}</span>
            </div>

            <button className="settings-button">
              <span className="settings-icon">⚙️</span>
            </button>

            <button onClick={handleLogout} className="logout-button">
              <span className="logout-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
