"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../components/AdminLayout"
import { Users, Shield, UserCheck, Search, Filter, Edit, Trash2, Eye, EyeOff, AlertTriangle, X } from "lucide-react"
import "../../styles/admin/ManageUsers.css"

const ManageUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/users/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        console.error("Failed to fetch users")
        alert("Failed to fetch users. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      alert("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser({ ...user })
    setShowEditModal(true)
  }

  const handleDeleteClick = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`http://localhost:8000/api/users/${userToDelete.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id))
        alert(`User "${userToDelete.first_name} ${userToDelete.last_name}" deleted successfully`)
      } else {
        const errorData = await response.json()
        alert(`Failed to delete user: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Network error. Failed to delete user.")
    } finally {
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const handleUpdateUser = async (updatedUser) => {
    try {
      // Prepare data for backend
      const userData = {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        phone_no: updatedUser.phone_no || "",
      }

      // Only include password if it was provided
      if (updatedUser.password && updatedUser.password.trim()) {
        userData.password = updatedUser.password
      }

      console.log("Sending update data:", userData)

      const response = await fetch(`http://localhost:8000/api/users/${updatedUser.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const result = await response.json()
        setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? result : user)))
        setShowEditModal(false)
        setEditingUser(null)
        alert("User updated successfully")
      } else {
        const errorData = await response.json()
        console.error("Update error response:", errorData)

        let errorMessage = "Failed to update user"

        if (errorData.username) {
          errorMessage = `Username error: ${errorData.username[0]}`
        } else if (errorData.email) {
          errorMessage = `Email error: ${errorData.email[0]}`
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0]
        }

        alert(errorMessage)
      }
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Network error. Failed to update user.")
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleClass = (role) => {
    switch (role) {
      case "admin":
        return "role-badge admin"
      case "clerk":
        return "role-badge clerk"
      default:
        return "role-badge default"
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return Shield
      case "clerk":
        return UserCheck
      default:
        return Users
    }
  }

  // Edit User Modal Component
  const EditUserModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      ...user,
      password: "",
      confirmPassword: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

      if (!formData.username?.trim()) {
        newErrors.username = "Username is required"
      }

      if (!formData.email?.trim()) {
        newErrors.email = "Email is required"
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          newErrors.email = "Please enter a valid email address"
        }
      }

      if (!formData.first_name?.trim()) {
        newErrors.first_name = "First name is required"
      }

      if (!formData.last_name?.trim()) {
        newErrors.last_name = "Last name is required"
      }

      // Password validation (only if password is provided)
      if (formData.password && formData.password.trim()) {
        if (formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters long"
        }

        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match"
        }
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e) => {
      e.preventDefault()

      if (!validateForm()) {
        return
      }

      // Create clean data object
      const updateData = {
        id: formData.id,
        first_name: formData.first_name?.trim(),
        last_name: formData.last_name?.trim(),
        username: formData.username?.trim(),
        email: formData.email?.trim(),
        role: formData.role,
        phone_no: formData.phone_no?.trim() || "",
      }

      // Only include password if it was provided and is not empty
      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password.trim()
      }

      onSave(updateData)
    }

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3 className="modal-title">Edit User - {user.username}</h3>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ""}
                  onChange={handleInputChange}
                  className={`form-input ${errors.first_name ? "error" : ""}`}
                />
                {errors.first_name && <p className="error-message">{errors.first_name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ""}
                  onChange={handleInputChange}
                  className={`form-input ${errors.last_name ? "error" : ""}`}
                />
                {errors.last_name && <p className="error-message">{errors.last_name}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username || ""}
                onChange={handleInputChange}
                className={`form-input ${errors.username ? "error" : ""}`}
              />
              {errors.username && <p className="error-message">{errors.username}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? "error" : ""}`}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone_no"
                value={formData.phone_no || ""}
                onChange={handleInputChange}
                className="form-input"
                placeholder="09123456789"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role *</label>
              <select name="role" value={formData.role || ""} onChange={handleInputChange} className="form-select">
                <option value="admin">Admin</option>
                <option value="clerk">Clerk</option>
              </select>
            </div>

            {/* Password Section */}
            <div className="form-section">
              <h4 className="section-title">Change Password (Optional)</h4>
              <div className="modal-form-grid">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password || ""}
                      onChange={handleInputChange}
                      className={`form-input ${errors.password ? "error" : ""}`}
                      placeholder="Leave blank to keep current password"
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="error-message">{errors.password}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword || ""}
                      onChange={handleInputChange}
                      className={`form-input ${errors.confirmPassword ? "error" : ""}`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <button type="submit" className="save-button">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Delete Confirmation Modal
  const DeleteConfirmModal = ({ user, onClose, onConfirm }) => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Confirm Delete</h3>
        <div className="delete-confirmation">
          <div className="warning-icon">
            <AlertTriangle size={48} color="#ff0033" />
          </div>
          <p>Are you sure you want to delete the user:</p>
          <div className="user-details">
            <strong>
              {user.first_name} {user.last_name}
            </strong>
            <br />
            <span>Username: {user.username}</span>
            <br />
            <span>Role: {user.role}</span>
          </div>
          <p className="warning-text">This action cannot be undone.</p>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="delete-confirm-button">
            Delete User
          </button>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="manage-users-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="manage-users-container">
        <div className="manage-users-header">
          <h1 className="main-title">Manage User Accounts</h1>
          <p className="subtitle">View, edit, and manage user accounts in the system</p>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon admin">
                <Shield size={20} />
              </div>
              <div className="summary-info">
                <div className="summary-label">Administrators</div>
                <div className="summary-value">{users.filter((u) => u.role === "admin").length}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon clerk">
                <UserCheck size={20} />
              </div>
              <div className="summary-info">
                <div className="summary-label">Clerks</div>
                <div className="summary-value">{users.filter((u) => u.role === "clerk").length}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon total">
                <Users size={20} />
              </div>
              <div className="summary-info">
                <div className="summary-label">Total Users</div>
                <div className="summary-value">{users.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <Search size={16} style={{ marginRight: "8px" }} />
                Search Users
              </label>
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <Filter size={16} style={{ marginRight: "8px" }} />
                Filter by Role
              </label>
              <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="clerk">Clerk</option>
              </select>
            </div>

            <div className="filter-group">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setRoleFilter("all")
                }}
                className="clear-filters-button"
              >
                <X size={16} style={{ marginRight: "8px" }} />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-section">
          <div className="section-header">
            <h2 className="section-title">Users ({filteredUsers.length})</h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <div className="no-users-icon">
                <Users size={48} />
              </div>
              <h3 className="no-users-title">No users found</h3>
              <p className="no-users-text">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="users-table">
              <div className="table-header">
                <div className="table-cell">User</div>
                <div className="table-cell">Role</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Username</div>
                <div className="table-cell">Actions</div>
              </div>
              <div className="table-body">
                {filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role)
                  return (
                    <div key={user.id} className="table-row">
                      <div className="table-cell user-cell">
                        <div className="user-avatar">
                          {user.first_name?.charAt(0) || ""}
                          {user.last_name?.charAt(0) || ""}
                        </div>
                        <div className="user-info">
                          <div className="user-name">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="user-id">ID: {user.id}</div>
                        </div>
                      </div>
                      <div className="table-cell">
                        <span className={getRoleClass(user.role)}>
                          <RoleIcon size={14} style={{ marginRight: "4px" }} />
                          {user.role?.toUpperCase()}
                        </span>
                      </div>
                      <div className="table-cell">{user.email}</div>
                      <div className="table-cell">{user.username}</div>
                      <div className="table-cell actions-cell">
                        <button onClick={() => handleEdit(user)} className="edit-button">
                          <Edit size={14} style={{ marginRight: "4px" }} />
                          Edit
                        </button>
                        <button onClick={() => handleDeleteClick(user)} className="delete-button">
                          <Trash2 size={14} style={{ marginRight: "4px" }} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => {
              setShowEditModal(false)
              setEditingUser(null)
            }}
            onSave={handleUpdateUser}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <DeleteConfirmModal
            user={userToDelete}
            onClose={() => {
              setShowDeleteModal(false)
              setUserToDelete(null)
            }}
            onConfirm={confirmDelete}
          />
        )}
      </div>
    </AdminLayout>
  )
}

export default ManageUsers
