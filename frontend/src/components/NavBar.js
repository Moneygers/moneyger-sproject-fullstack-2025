"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { User, LogOut } from "lucide-react"
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
            <span className="brand-icon">
              <img src="/favicon2.png" alt="Park Moneyger Logo" className="logo-image" />
            </span>
            <h1 className="brand-title">ParkMoneyger</h1>
          </div>

          <div className="navbar-actions">
            <div className="user-info">
              <User className="user-icon" size={20} />
              <span className="user-name">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="user-role">{user?.role?.toUpperCase()}</span>
            </div>

            <button onClick={handleLogout} className="logout-button">
              <LogOut className="logout-icon" size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
