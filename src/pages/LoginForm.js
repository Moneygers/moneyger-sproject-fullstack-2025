"use client"

import { useState } from "react"
import "../styles/LoginForm.css"

const LoginForm = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Simulate login logic
      if (username === "admin" && password === "password") {
        alert("Login successful! Redirecting to dashboard...")
      } else {
        setError("Invalid username or password")
      }
    } catch (err) {
      setError("Invalid username or password")
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerView = () => {
    window.location.href = "/"
  }

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="login-header">
          <div className="logo-container">
            <div className="car-icon">🚗</div>
          </div>
          <h2 className="login-title">ParkManager System</h2>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="input-wrapper">
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-field input-top"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="password-wrapper">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="input-field input-bottom"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="submit-wrapper">
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="customer-view-section">
            <button type="button" onClick={handleCustomerView} className="customer-view-button">
              <span className="eye-icon">👁️</span>
              View Available Parking (Customer)
            </button>
            <p className="customer-view-note">No login required for viewing parking availability</p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginForm
