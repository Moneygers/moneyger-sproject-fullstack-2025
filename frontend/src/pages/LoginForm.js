"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Footer from "../components/Footer"
import "../styles/LoginForm.css"
import { LogIn, UserPlus, Eye, EyeOff, Mail } from "lucide-react"
import BASE_URL from "../config"

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
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const googleBtnRef = useRef(null)

  // Google OAuth Client ID
  const GOOGLE_CLIENT_ID = "793231314826-duihujnitj4ch5s0n04mkejiaqnmutiv.apps.googleusercontent.com"

  // Load Google Identity Services
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogleSignIn()
        return
      }
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignIn
      document.head.appendChild(script)
    }
    const initializeGoogleSignIn = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 300,
        })
      }
    }
    loadGoogleScript()
  }, [])

  // Handle Google OAuth response
  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true)
    setError("")

    try {
      // Send the credential token to your backend
      const res = await fetch(`${BASE_URL}/api/auth/google/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Store token and user data
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))

        // Update auth context directly (do not call login API again)
        if (typeof login === "function") {
          login({
            username: data.user.username,
            password: undefined, // Not needed for OAuth
            role: data.user.role,
            email: data.user.email,
            user: data.user,
            token: data.token,
            isOAuth: true,
          })
        }

        // Redirect based on role
        if (data.user.role === "admin") navigate("/admin/payment-reports")
        else if (data.user.role === "clerk") navigate("/dashboard")
        else if (data.user.role === "customer") navigate("/")
        else navigate("/customer-view")
      } else {
        setError(data.message || "Google sign-in failed")
      }
    } catch (err) {
      console.error("Google sign-in error:", err)
      setError("Network error during Google sign-in. Please try again.")
    } finally {
      setGoogleLoading(false)
    }
  }

  // Validation helpers
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhoneNumber = (phone) => /^09\d{9}$/.test(phone)
  const validateName = (name) => /^[a-zA-Z\s.]+$/.test(name) && name.trim().length >= 2

  const checkProfanity = async (text) => {
    try {
      const res = await fetch(`${BASE_URL}/api/profanity/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      return data.profanity ? data.detected || ["Inappropriate content"] : []
    } catch (err) {
      console.error("Profanity check failed:", err)
      return []
    }
  }

  const handleInputChange = async (field, value) => {
    let processedValue = value

    if (field === "firstName" || field === "lastName") {
      processedValue = value.replace(/[^a-zA-Z\s.]/g, "")
    } else if (field === "phoneNumber") {
      processedValue = value.replace(/[^0-9]/g, "")
      if (processedValue.length > 11) {
        processedValue = processedValue.slice(0, 11)
      }
    }

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

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }

    const fieldsToCheck = ["firstName", "lastName", "email", "username", "password", "confirmPassword"]
    if (fieldsToCheck.includes(field) && processedValue.trim()) {
      const detected = await checkProfanity(processedValue.trim())
      if (detected.length > 0) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: `Inappropriate word detected: ${detected.join(", ")}`,
        }))
      }
    }
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

    const combinedErrors = { ...formErrors, ...errors }

    setFormErrors(combinedErrors)

    return Object.values(combinedErrors).every((val) => !val)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError("")
    if (!validateSignUpForm()) return
    setLoading(true)

    try {
      const res = await fetch(`${BASE_URL}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const data = await res.json()
      if (res.ok) {
        alert("Account created successfully! You can now sign in.")
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
        setError(data.username?.[0] || data.email?.[0] || data.message || "Failed to create account")
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
      const res = await fetch(`${BASE_URL}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (res.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))

        await login({
          username,
          password,
          role: data.user.role,
          email: data.user.email,
        })

        if (data.user.role === "admin") navigate("/admin/payment-reports")
        else if (data.user.role === "clerk") navigate("/dashboard")
        else if (data.user.role === "customer") navigate("/")
        else navigate("/customer-view")
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

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError("")
    setFormErrors({})
    setUsername("")
    setPassword("")
    setConfirmPassword("")
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhoneNumber("")
  }

  const handleCustomerView = () => navigate("/")

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
                        onBlur={(e) => handleInputChange("firstName", e.target.value)}
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
                        onBlur={(e) => handleInputChange("lastName", e.target.value)}
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
                      onBlur={(e) => handleInputChange("username", e.target.value)}
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
                      onBlur={(e) => handleInputChange("password", e.target.value)}
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                      onBlur={(e) => handleInputChange("confirmPassword", e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {formErrors.confirmPassword && <div className="error-message">{formErrors.confirmPassword}</div>}
                  </div>
                </div>
              </>
            ) : (
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="submit-wrapper">
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? (
                  isSignUp ? (
                    "Creating Account..."
                  ) : (
                    "Signing in..."
                  )
                ) : isSignUp ? (
                  <>
                    <UserPlus size={18} style={{ marginRight: 8 }} />
                    Sign Up
                  </>
                ) : (
                  <>
                    <LogIn size={18} style={{ marginRight: 8 }} />
                    Sign in
                  </>
                )}
              </button>
            </div>

            {!isSignUp && (
              <div className="submit-wrapper">
                <button type="button" onClick={toggleMode} className="signup-button">
                  <UserPlus size={18} className="signup-icon" />
                  Sign Up
                </button>
              </div>
            )}

            <div className="submit-wrapper">
              <div ref={googleBtnRef} id="google-signin-btn" style={{ display: "flex", justifyContent: "center" }}></div>
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
      <Footer />
    </div>
  )
}

export default LoginForm
