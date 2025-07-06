"use client"

import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  Eye,
  Calendar,
  BarChart3,
  CheckCircle,
  Car,
  LogOut,
  Receipt,
  FileText,
  UserPlus,
  Users,
  Settings,
} from "lucide-react"
import "../styles/components/Sidebar.css"

const Sidebar = () => {
  const { isAuthenticated, user, isAdmin, isClerk, isCustomer, logout } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) return null

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Define navigation items based on use case diagram
  const getNavItems = () => {
    const items = []

    // Customer/Motorist access
    if (isCustomer) {
      items.push(
        {
          name: "Monitor Parking",
          href: "/monitor-availability",
          icon: Eye,
          description: "View available slots",
          roles: ["customer"],
        },
        {
          name: "Make Reservations",
          href: "/make-reservation",
          icon: Calendar,
          description: "Reserve parking slots",
          roles: ["customer"],
        },
      )
    }

    // Parking Clerk access
    if (isClerk && !isAdmin) {
      items.push(
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: BarChart3,
          description: "Overview and stats",
          roles: ["clerk"],
        },
        {
          name: "Monitor Reservations",
          href: "/clerk/monitor-reservations",
          icon: Calendar,
          description: "Track reservations",
          roles: ["clerk"],
        },
        {
          name: "Approve Reservations",
          href: "/clerk/approve-reservations",
          icon: CheckCircle,
          description: "Review requests",
          roles: ["clerk"],
        },
        {
          name: "Update Slot Availability",
          href: "/clerk/update-slots",
          icon: Car,
          description: "Manage parking slots",
          roles: ["clerk"],
        },
        {
          name: "Check-out Vehicle",
          href: "/clerk/checkout-vehicle",
          icon: LogOut,
          description: "Process payments",
          roles: ["clerk"],
        },
      )
    }

    // Owner/Admin access (has access to everything)
    if (isAdmin) {
      items.push(
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: BarChart3,
          description: "System overview",
          roles: ["admin"],
        },
        {
          name: "Monitor Reservations",
          href: "/clerk/monitor-reservations",
          icon: Calendar,
          description: "Track all reservations",
          roles: ["admin"],
        },
        {
          name: "Approve Reservations",
          href: "/clerk/approve-reservations",
          icon: CheckCircle,
          description: "Review requests",
          roles: ["admin"],
        },
        {
          name: "Update Slot Availability",
          href: "/clerk/update-slots",
          icon: Car,
          description: "Manage parking slots",
          roles: ["admin"],
        },
        {
          name: "Check-out Vehicle",
          href: "/clerk/checkout-vehicle",
          icon: LogOut,
          description: "Process payments",
          roles: ["admin"],
        },
        {
          name: "Review Transactions",
          href: "/admin/review-transactions",
          icon: Receipt,
          description: "Monitor payments",
          roles: ["admin"],
        },
        {
          name: "Payment Reports",
          href: "/admin/payment-reports",
          icon: FileText,
          description: "View revenue analytics",
          roles: ["admin"],
        },
        {
          name: "Create Accounts",
          href: "/admin/create-accounts",
          icon: UserPlus,
          description: "Add new users",
          roles: ["admin"],
        },
        {
          name: "Manage Users",
          href: "/admin/manage-users",
          icon: Users,
          description: "Edit user accounts",
          roles: ["admin"],
        },
        {
          name: "System Settings",
          href: "/admin/system-settings",
          icon: Settings,
          description: "Configure system",
          roles: ["admin"],
        },
      )
    }

    return items
  }

  const navItems = getNavItems()

  // Group items by category
  const getGroupedItems = () => {
    if (isCustomer) {
      return {
        "Customer Services": navItems,
      }
    }

    if (isClerk && !isAdmin) {
      return {
        "Clerk Operations": navItems,
      }
    }

    if (isAdmin) {
      const clerkItems = navItems.filter((item) => item.href.includes("/clerk/") || item.href === "/dashboard")
      const adminItems = navItems.filter((item) => item.href.includes("/admin/"))

      return {
        Operations: clerkItems,
        Administration: adminItems,
      }
    }

    return {}
  }

  const groupedItems = getGroupedItems()

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ backgroundImage: "url('/favicon.png')" }}>
        <div className="sidebar-avatar">
          <span className="avatar-text">
            {user?.first_name?.charAt(0)}
            {user?.last_name?.charAt(0)}
          </span>
        </div>
        <div className="sidebar-user-info">
          <h2 className="sidebar-title">{isAdmin ? "Administrator" : isClerk ? "Parking Clerk" : "Customer"}</h2>
          <p className="sidebar-user">
            {user?.first_name} {user?.last_name}
          </p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <div key={groupName} className="nav-section">
            <h3 className="nav-section-title">{groupName}</h3>
            {items.map((item) => {
              const IconComponent = item.icon
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                >
                  <IconComponent className="sidebar-icon" size={20} />
                  <div className="sidebar-link-content">
                    <span className="sidebar-text">{item.name}</span>
                    <span className="sidebar-description">{item.description}</span>
                  </div>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
