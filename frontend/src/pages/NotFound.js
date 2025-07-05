"use client"

import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "../styles/NotFound.css"

const NotFound = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAdmin, isClerk, isCustomer } = useAuth()

  // Determine the type of error based on the current path and user role
  const getErrorType = () => {
    const path = location.pathname

    // Check if it's an unauthorized access attempt
    if (path.includes("/admin/") && !isAdmin) {
      return "unauthorized"
    }
    if ((path.includes("/clerk/") || path === "/dashboard") && !isClerk) {
      return "unauthorized"
    }
    if ((path.includes("/dashboard") || path.includes("/clerk/") || path.includes("/admin/")) && !isAuthenticated) {
      return "unauthenticated"
    }

    // Otherwise it's a regular 404
    return "notfound"
  }

  const errorType = getErrorType()

  const getErrorContent = () => {
    switch (errorType) {
      case "unauthorized":
        return {
          code: "403",
          title: "Access Forbidden",
          message: `You do not have permission to access this area. ${
            location.pathname.includes("/admin/")
              ? "This is an admin-only section."
              : location.pathname.includes("/clerk/") || location.pathname === "/dashboard"
                ? "This is a clerk-only section."
                : "This section requires different privileges."
          }`,
          icon: "🚫",
          suggestions: [
            "Contact your administrator if you believe you should have access",
            "Return to your authorized dashboard",
            "Log out and log in with appropriate credentials",
          ],
        }
      case "unauthenticated":
        return {
          code: "401",
          title: "Authentication Required",
          message: "You need to log in to access this page.",
          icon: "🔐",
          suggestions: [
            "Log in with your credentials",
            "Contact support if you forgot your password",
            "Return to the customer view if you're just browsing",
          ],
        }
      default:
        return {
          code: "404",
          title: "Page Not Found",
          message: "The page you are looking for does not exist or has been moved.",
          icon: "🔍",
          suggestions: [
            "Check the URL for typos",
            "Use the navigation menu to find what you're looking for",
            "Return to the homepage",
          ],
        }
    }
  }

  const errorContent = getErrorContent()

  const handleGoHome = () => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin/payment-reports")
      } else if (isClerk) {
        navigate("/dashboard")
      } else {
        navigate("/")
      }
    } else {
      navigate("/")
    }
  }

  const handleGoLogin = () => {
    navigate("/login")
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Error Icon and Code */}
        <div className="error-display">
          <div className="error-icon">{errorContent.icon}</div>
          <div className="error-code">{errorContent.code}</div>
        </div>

        {/* Error Message */}
        <div className="error-message-section">
          <h1 className="error-title">{errorContent.title}</h1>
          <p className="error-message">{errorContent.message}</p>

          {/* Current Path Display */}
          <div className="current-path">
            <span className="path-label">Requested path:</span>
            <code className="path-value">{location.pathname}</code>
          </div>
        </div>

        {/* Suggestions */}
        <div className="suggestions-section">
          <h3 className="suggestions-title">What you can do:</h3>
          <ul className="suggestions-list">
            {errorContent.suggestions.map((suggestion, index) => (
              <li key={index} className="suggestion-item">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={handleGoBack} className="action-button secondary">
            <span className="button-icon">←</span>
            <span>Go Back</span>
          </button>

          {!isAuthenticated && errorType === "unauthenticated" && (
            <button onClick={handleGoLogin} className="action-button primary">
              <span className="button-icon">🔑</span>
              <span>Login</span>
            </button>
          )}

          <button onClick={handleGoHome} className="action-button primary">
            <span className="button-icon">🏠</span>
            <span>
              {isAuthenticated ? (isAdmin ? "Admin Dashboard" : isClerk ? "Dashboard" : "Home") : "Customer View"}
            </span>
          </button>
        </div>

        {/* System Info */}
        <div className="system-info">
          <div className="brand-section">
            <img src="/favicon.png" alt="ParkMoneyger Logo" className="brand-logo" />
            <div className="brand-text">
              <h2 className="brand-title">ParkMoneyger</h2>
              <p className="brand-subtitle">Parking Management System</p>
            </div>
          </div>

          {isAuthenticated && (
            <div className="user-info">
              <p className="user-status">
                Logged in as:{" "}
                <span className="user-role">{isAdmin ? "Administrator" : isClerk ? "Clerk" : "Customer"}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotFound
