"use client"

import { NavLink } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { BarChart3, Receipt, UserPlus, Users, Settings } from "lucide-react"
import "../styles/components/AdminSidebar.css"

const AdminSidebar = () => {
  const { user } = useAuth()

  const adminNavItems = [
    {
      name: "Payment Reports",
      href: "/admin/payment-reports",
      icon: BarChart3,
      description: "View revenue analytics",
    },
    {
      name: "Review Transactions",
      href: "/admin/review-transactions",
      icon: Receipt,
      description: "Monitor payments",
    },
    {
      name: "Create Accounts",
      href: "/admin/create-accounts",
      icon: UserPlus,
      description: "Add new users",
    },
    {
      name: "Manage Users",
      href: "/admin/manage-users",
      icon: Users,
      description: "Edit user accounts",
    },
    {
      name: "System Settings",
      href: "/admin/system-settings",
      icon: Settings,
      description: "Configure system",
    },
  ]

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header" style={{ backgroundImage: "url('/favicon.png')" }}>
        <div className="admin-sidebar-avatar">
          <span className="admin-avatar-text">
            {user?.first_name?.charAt(0)}
            {user?.last_name?.charAt(0)}
          </span>
        </div>
        <div className="admin-sidebar-user-info">
          <h2 className="admin-sidebar-title">Administrator</h2>
          <p className="admin-sidebar-user">
            {user?.first_name} {user?.last_name}
          </p>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <div className="admin-nav-section">
          <h3 className="admin-nav-section-title">Administration</h3>
          {adminNavItems.map((item) => {
            const IconComponent = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `admin-sidebar-link ${isActive ? "active" : ""}`}
              >
                <IconComponent className="admin-sidebar-icon" size={20} />
                <div className="admin-sidebar-link-content">
                  <span className="admin-sidebar-text">{item.name}</span>
                  <span className="admin-sidebar-description">{item.description}</span>
                </div>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default AdminSidebar
