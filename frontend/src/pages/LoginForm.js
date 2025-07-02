"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "../styles/LoginForm.css"

const LoginForm = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and user data
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))

        // Update auth context
        await login({
          username: username,
          password: password,
          role: data.user.role,
          email: data.user.email,
        })

        // Redirect based on role
        if (data.user.role === "admin") {
          navigate("/admin/payment-reports")
        } else if (data.user.role === "clerk") {
          navigate("/dashboard")
        } else {
          navigate("/customer-view")
        }
      } else {
        setError(data.message || "Invalid username or password")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerView = () => {
    navigate("/")
  }

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="login-header">
          <div className="logo-container">
            <img src="/favicon.png" alt="Park Moneyger Logo" className="logo-image" />
          </div>
          <h2 className="login-title">ParkMoneyger System</h2>
          <h3 className="login-slogan">Park with flair, profit with care</h3>
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
