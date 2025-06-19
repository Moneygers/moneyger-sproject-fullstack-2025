"use client"

import type React from "react"
import { useState } from "react"
import { apiService } from "../../services/api"
import { UserPlus, Eye, EyeOff, Save } from "lucide-react"

const CreateAccounts: React.FC = () => {
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      await apiService.createUser(formData)
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
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Failed to create user account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create User Accounts</h1>
        <p className="text-gray-600">Create new clerk and admin accounts for the system</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <UserPlus className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-medium text-gray-900">New User Account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.first_name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.last_name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.username ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter username"
                  />
                  {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="09123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="clerk">Parking Clerk</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.password ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
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
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? "Creating..." : "Create Account"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateAccounts
