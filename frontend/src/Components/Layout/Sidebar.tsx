"use client"

import type React from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import {
  LayoutDashboard,
  Car,
  Calendar,
  Receipt,
  Users,
  Eye,
  Settings,
  CreditCard,
  FileText,
  UserPlus,
  CheckSquare,
  Printer,
} from "lucide-react"

const Sidebar: React.FC = () => {
  const { isAuthenticated, user, isAdmin, isClerk, isCustomer } = useAuth()

  if (!isAuthenticated) return null

  // Define navigation items based on use case diagram
  const getNavItems = () => {
    const items = []

    // Customer/Motorist access
    if (isCustomer) {
      items.push(
        { name: "Monitor Parking", href: "/monitor-availability", icon: Eye, roles: ["customer"] },
        { name: "Make Reservations", href: "/make-reservation", icon: Calendar, roles: ["customer"] },
      )
    }

    // Parking Clerk access
    if (isClerk && !isAdmin) {
      items.push(
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["clerk"] },
        { name: "Monitor Availability", href: "/monitor-availability", icon: Eye, roles: ["clerk"] },
        { name: "Monitor Reservations", href: "/monitor-reservations", icon: Calendar, roles: ["clerk"] },
        { name: "Approve Reservations", href: "/approve-reservations", icon: CheckSquare, roles: ["clerk"] },
        { name: "Update Slot Availability", href: "/update-slots", icon: Car, roles: ["clerk"] },
        { name: "Check-out Vehicle", href: "/checkout-vehicle", icon: CheckSquare, roles: ["clerk"] },
        { name: "Handle Payments", href: "/handle-payments", icon: CreditCard, roles: ["clerk"] },
        { name: "Print Parking Ticket", href: "/print-ticket", icon: Printer, roles: ["clerk"] },
      )
    }

    // Owner/Admin access (has access to everything)
    if (isAdmin) {
      items.push(
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin"] },
        { name: "Monitor Availability", href: "/monitor-availability", icon: Eye, roles: ["admin"] },
        { name: "Monitor Reservations", href: "/monitor-reservations", icon: Calendar, roles: ["admin"] },
        { name: "Approve Reservations", href: "/approve-reservations", icon: CheckSquare, roles: ["admin"] },
        { name: "Review Transactions", href: "/review-transactions", icon: Receipt, roles: ["admin"] },
        { name: "Payment Reports", href: "/payment-reports", icon: FileText, roles: ["admin"] },
        { name: "Manage System Settings", href: "/system-settings", icon: Settings, roles: ["admin"] },
        { name: "Create Accounts", href: "/create-accounts", icon: UserPlus, roles: ["admin"] },
        { name: "Update Accounts", href: "/manage-users", icon: Users, roles: ["admin"] },
      )
    }

    return items
  }

  const navItems = getNavItems()

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-center">
          {isAdmin ? "Admin Panel" : isClerk ? "Clerk Panel" : "Customer Panel"}
        </h2>
        <p className="text-sm text-gray-400 text-center mt-1">
          {user?.first_name} {user?.last_name}
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
