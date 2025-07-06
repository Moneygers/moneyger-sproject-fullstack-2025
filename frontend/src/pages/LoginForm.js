"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Footer from "../components/Footer"
import "../styles/LoginForm.css"

const LoginForm = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^09\d{9}$/
    return phoneRegex.test(phone)
  }

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s.]+$/
    return nameRegex.test(name) && name.trim().length >= 2
  }

  const validateSignUpForm = () => {
    const errors = {}

    if (!firstName.trim()) {
      errors.firstName = "First name is required"
    } else if (!validateName(firstName)) {
      errors.firstName = "First name should contain only letters, spaces, and periods"
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required"
    } else if (!validateName(lastName)) {
      errors.lastName = "Last name should contain only letters, spaces, and periods"
    }

    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required"
    } else if (!validatePhoneNumber(phoneNumber)) {
      errors.phoneNumber = "Please enter a valid Philippine mobile number (09XXXXXXXXX)"
    }

    if (!username.trim()) {
      errors.username = "Username is required"
    } else if (username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters long"
    }

    if (!password) {
      errors.password = "Password is required"
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long"
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field, value) => {
    let processedValue = value

    if (field === "firstName" || field === "lastName") {
      processedValue = value.replace(/[^a-zA-Z\s.]/g, "")
    } else if (field === "phoneNumber") {
      processedValue = value.replace(/[^0-9]/g, "")
      if (processedValue.length > 11) {
        processedValue = processedValue.slice(0, 11)
      }
    }

    // Update the appropriate state
    switch (field) {
      case "firstName":
        setFirstName(processedValue)
        break
      case "lastName":
        setLastName(processedValue)
        break
      case "email":
        setEmail(processedValue)
        break
      case "phoneNumber":
        setPhoneNumber(processedValue)
        break
      case "username":
        setUsername(processedValue)
        break
      case "password":
        setPassword(processedValue)
        break
      case "confirmPassword":
        setConfirmPassword(processedValue)
        break
    }

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError("")

    if (!validateSignUpForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("http://localhost:8000/api/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone_no: phoneNumber.trim(),
          username: username.trim(),
          password: password,
          role: "customer",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Account created successfully! You can now sign in.")
        // Switch to sign in mode and clear form
        setIsSignUp(false)
        setFirstName("")
        setLastName("")
        setEmail("")
        setPhoneNumber("")
        setUsername("")
        setPassword("")
        setConfirmPassword("")
        setFormErrors({})
      } else {
        if (data.username) {
          setError(data.username[0])
        } else if (data.email) {
          setError(data.email[0])
        } else {
          setError(data.message || "Failed to create account")
        }
      }
    } catch (err) {
      console.error("Sign up error:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
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
        } else if (data.user.role === "customer") {
          navigate("/")
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

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError("")
    setFormErrors({})
    // Clear form fields when switching modes
    setUsername("")
    setPassword("")
    setConfirmPassword("")
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhoneNumber("")
  }

  return (
    <div className="login-page-container">
      <div className="login-container">
        <div className="login-form-wrapper">
          <div className="login-header">
            <div className="logo-container">
              <img src="/favicon.png" alt="Park Moneyger Logo" className="logo-image" />
            </div>
            <h2 className="login-title">ParkMoneyger System</h2>
            <h3 className="login-slogan">Park with flair, profit with care</h3>
            <p className="login-subtitle">{isSignUp ? "Create your customer account" : "Sign in to your account"}</p>
          </div>

          <form className="login-form" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
            {isSignUp ? (
              // Sign Up Form
              <>
                <div className="input-group">
                  <div className="input-row">
                    <div className="input-wrapper half-width">
                      <input
                        type="text"
                        required
                        className={`input-field ${formErrors.firstName ? "error" : ""}`}
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        maxLength={50}
                      />
                      {formErrors.firstName && <div className="error-message">{formErrors.firstName}</div>}
                    </div>
                    <div className="input-wrapper half-width">
                      <input
                        type="text"
                        required
                        className={`input-field ${formErrors.lastName ? "error" : ""}`}
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        maxLength={50}
                      />
                      {formErrors.lastName && <div className="error-message">{formErrors.lastName}</div>}
                    </div>
                  </div>

                  <div className="input-wrapper">
                    <input
                      type="email"
                      required
                      className={`input-field ${formErrors.email ? "error" : ""}`}
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                    {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                  </div>

                  <div className="input-wrapper">
                    <input
                      type="tel"
                      required
                      className={`input-field ${formErrors.phoneNumber ? "error" : ""}`}
                      placeholder="Phone Number (09XXXXXXXXX)"
                      value={phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      maxLength={11}
                    />
                    {formErrors.phoneNumber && <div className="error-message">{formErrors.phoneNumber}</div>}
                  </div>

                  <div className="input-wrapper">
                    <input
                      type="text"
                      required
                      className={`input-field ${formErrors.username ? "error" : ""}`}
                      placeholder="Username"
                      value={username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                    />
                    {formErrors.username && <div className="error-message">{formErrors.username}</div>}
                  </div>

                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className={`input-field ${formErrors.password ? "error" : ""}`}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? "👁️‍🗨️" : "👁️"}
                    </button>
                    {formErrors.password && <div className="error-message">{formErrors.password}</div>}
                  </div>

                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className={`input-field ${formErrors.confirmPassword ? "error" : ""}`}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
                    </button>
                    {formErrors.confirmPassword && <div className="error-message">{formErrors.confirmPassword}</div>}
                  </div>
                </div>
              </>
            ) : (
              // Sign In Form
              <div className="input-group">
                <div className="input-wrapper">
                  <input
                    type="text"
                    required
                    className="input-field input-top"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="password-wrapper">
                  <input
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
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="submit-wrapper">
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? (isSignUp ? "Creating Account..." : "Signing in...") : isSignUp ? "Sign Up" : "Sign in"}
              </button>
            </div>

            {!isSignUp && (
              <div className="submit-wrapper">
                <button type="button" onClick={toggleMode} className="signup-button">
                  Sign Up
                </button>
              </div>
            )}

            <div className="submit-wrapper">
              <button type="button" className="google-button" disabled>
                <span className="google-icon">🔍</span>
                Continue with Google
              </button>
              <p className="google-note">Coming soon...</p>
            </div>

            {isSignUp && (
              <div className="toggle-mode">
                <p>
                  Already have an account?{" "}
                  <button type="button" onClick={toggleMode} className="toggle-link">
                    Sign In
                  </button>
                </p>
              </div>
            )}

            <div className="customer-view-section">
              <button type="button" onClick={handleCustomerView} className="customer-view-button">
                <span className="eye-icon">👁️</span>
                View Available Parking (Guest)
              </button>
              <p className="customer-view-note">No login required for viewing parking availability</p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default LoginForm
