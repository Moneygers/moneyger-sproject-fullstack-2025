"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../components/AdminLayout"
import "../../styles/admin/ManageUsers.css"

const ManageUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Mock users data
  const mockUsers = [
    {
      id: 1,
      username: "admin",
      email: "admin@parkmanager.com",
      first_name: "John",
      last_name: "Doe",
      role: "admin",
    },
    {
      id: 2,
      username: "clerk1",
      email: "clerk1@parkmanager.com",
      first_name: "Jane",
      last_name: "Smith",
      role: "clerk",
    },
    {
      id: 3,
      username: "clerk2",
      email: "clerk2@parkmanager.com",
      first_name: "Bob",
      last_name: "Johnson",
      role: "clerk",
    },
    {
      id: 4,
      username: "customer1",
      email: "customer1@example.com",
      first_name: "Alice",
      last_name: "Brown",
      role: "customer",
    },
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(mockUsers)
      setLoading(false)
    }, 1000)
  }, [])

  const handleEdit = (user) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        setUsers((prev) => prev.filter((user) => user.id !== userId))
        alert("User deleted successfully")
      } catch (error) {
        console.error("Error deleting user:", error)
        alert("Failed to delete user")
      }
    }
  }

  const handleUpdateUser = async (updatedUser) => {
    try {
      setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
      setShowEditModal(false)
      setEditingUser(null)
      alert("User updated successfully")
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user")
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      case "customer":
        return "role-badge customer"
      default:
        return "role-badge default"
    }
  }

  // Edit User Modal Component
  const EditUserModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({ ...user })

    const handleInputChange = (e) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
      e.preventDefault()
      onSave(formData)
    }

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3 className="modal-title">Edit User</h3>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="form-select">
                <option value="admin">Administrator</option>
                <option value="clerk">Clerk</option>
                <option value="customer">Customer</option>
              </select>
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
              <div className="summary-icon admin">🔴</div>
              <div className="summary-info">
                <div className="summary-label">Administrators</div>
                <div className="summary-value">{users.filter((u) => u.role === "admin").length}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon clerk">🔵</div>
              <div className="summary-info">
                <div className="summary-label">Clerks</div>
                <div className="summary-value">{users.filter((u) => u.role === "clerk").length}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon total">👥</div>
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
              <label className="filter-label">Search Users</label>
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Filter by Role</label>
              <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="clerk">Clerks</option>
                <option value="customer">Customers</option>
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
              <div className="no-users-icon">👥</div>
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
                {filteredUsers.map((user) => (
                  <div key={user.id} className="table-row">
                    <div className="table-cell user-cell">
                      <div className="user-avatar">
                        {user.first_name.charAt(0)}
                        {user.last_name.charAt(0)}
                      </div>
                      <div className="user-info">
                        <div className="user-name">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="user-id">ID: {user.id}</div>
                      </div>
                    </div>
                    <div className="table-cell">
                      <span className={getRoleClass(user.role)}>{user.role.toUpperCase()}</span>
                    </div>
                    <div className="table-cell">{user.email}</div>
                    <div className="table-cell">{user.username}</div>
                    <div className="table-cell actions-cell">
                      <button onClick={() => handleEdit(user)} className="edit-button">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
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
      </div>
    </AdminLayout>
  )
}

export default ManageUsers
