"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { User, Shield, LogOut } from "lucide-react"
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
              <User className="admin-user-icon" size={20} />
              <span className="admin-user-name">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="admin-user-role">
                <Shield size={14} style={{ marginRight: "4px" }} />
                ADMINISTRATOR
              </span>
            </div>

            <button onClick={handleLogout} className="admin-logout-button">
              <LogOut className="admin-logout-icon" size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default AdminNavBar
