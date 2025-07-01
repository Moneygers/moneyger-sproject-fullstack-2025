"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Mock user data - replace with actual authentication logic
    const mockUser = {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      role: "clerk",
      email: "john.doe@example.com",
    }
    setUser(mockUser)
    setIsAuthenticated(true)
  }, [])

  const login = async (credentials) => {
    // Mock login logic
    const mockUser = {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      role: credentials.role || "clerk",
      email: credentials.email || "john.doe@example.com",
    }
    setUser(mockUser)
    setIsAuthenticated(true)
    return mockUser
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  const isAdmin = user?.role === "admin"
  const isClerk = user?.role === "clerk"
  const isCustomer = user?.role === "customer"

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    isAdmin,
    isClerk,
    isCustomer,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
