"use client"

import { useState } from "react"
import AdminLayout from "../../components/AdminLayout"
import "../../styles/admin/CreateAccounts.css"

const CreateAccounts = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    role: "clerk",
    phone_number: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) newErrors.username = "Username is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.password) newErrors.password = "Password is required"
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required"
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required"

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password strength validation
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          phone_number: formData.phone_number,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${formData.role} account created successfully for ${formData.first_name} ${formData.last_name}`)

        // Reset form
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          first_name: "",
          last_name: "",
          role: "clerk",
          phone_number: "",
        })
      } else {
        const errorData = await response.json()
        alert(`Failed to create user account: ${errorData.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Failed to create user account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="create-accounts-container">
        <div className="create-accounts-header">
          <h1 className="main-title">Create User Accounts</h1>
          <p className="subtitle">Create new clerk and admin accounts for the system</p>
        </div>

        <div className="form-container">
          <div className="form-card">
            <div className="form-header">
              <span className="form-icon">👥</span>
              <h2 className="form-title">New User Account</h2>
            </div>

            <form onSubmit={handleSubmit} className="account-form">
              {/* Personal Information */}
              <div className="form-section">
                <h3 className="section-title">Personal Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={`form-input ${errors.first_name ? "error" : ""}`}
                      placeholder="Enter first name"
                    />
                    {errors.first_name && <p className="error-message">{errors.first_name}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className={`form-input ${errors.last_name ? "error" : ""}`}
                      placeholder="Enter last name"
                    />
                    {errors.last_name && <p className="error-message">{errors.last_name}</p>}
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="form-section">
                <h3 className="section-title">Account Information</h3>
                <div className="form-fields">
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`form-input ${errors.username ? "error" : ""}`}
                      placeholder="Enter username"
                    />
                    {errors.username && <p className="error-message">{errors.username}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-input ${errors.email ? "error" : ""}`}
                      placeholder="Enter email address"
                    />
                    {errors.email && <p className="error-message">{errors.email}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="09123456789"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="form-select">
                      <option value="clerk">Clerk</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password Information */}
              <div className="form-section">
                <h3 className="section-title">Password</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <div className="password-input-container">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`form-input ${errors.password ? "error" : ""}`}
                        placeholder="Enter password"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {errors.password && <p className="error-message">{errors.password}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <div className="password-input-container">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`form-input ${errors.confirmPassword ? "error" : ""}`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      username: "",
                      email: "",
                      password: "",
                      confirmPassword: "",
                      first_name: "",
                      last_name: "",
                      role: "clerk",
                      phone_number: "",
                    })
                    setErrors({})
                  }}
                  className="clear-button"
                >
                  Clear Form
                </button>
                <button type="submit" disabled={loading} className="submit-button">
                  <span className="button-icon">💾</span>
                  <span>{loading ? "Creating..." : "Create Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default CreateAccounts
