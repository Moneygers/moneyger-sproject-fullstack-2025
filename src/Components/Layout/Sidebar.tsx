"use client"

import type React from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { LayoutDashboard, Car, Calendar, Receipt, Users, Search, Eye } from "lucide-react"

const Sidebar: React.FC = () => {
  const { isAdmin, isClerk, isCustomer } = useAuth()

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "clerk"],
    },
    {
      name: "Parking Slots",
      href: "/slots",
      icon: Car,
      roles: ["admin", "clerk"],
    },
    {
      name: "Reservations",
      href: "/reservations",
      icon: Calendar,
      roles: ["admin", "clerk"],
    },
    {
      name: "Transactions",
      href: "/transactions",
      icon: Receipt,
      roles: ["admin", "clerk"],
    },
    {
      name: "Search License",
      href: "/search",
      icon: Search,
      roles: ["admin", "clerk"],
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "View Parking",
      href: "/view",
      icon: Eye,
      roles: ["customer"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => {
    if (isAdmin) return item.roles.includes("admin")
    if (isClerk) return item.roles.includes("clerk")
    if (isCustomer) return item.roles.includes("customer")
    return false
  })

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <nav className="space-y-2">
        {filteredNavItems.map((item) => (
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
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
