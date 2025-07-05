"use client"

import { useAuth } from "../contexts/AuthContext"
import NotFound from "../pages/NotFound"

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin, isClerk, isCustomer } = useAuth()

  // If not authenticated and trying to access protected routes
  if (!isAuthenticated) {
    return <NotFound />
  }

  // Check if user has the exact required role (strict role separation)
  const hasAccess = () => {
    switch (requiredRole) {
      case "admin":
        return isAdmin
      case "clerk":
        return isClerk
      case "customer":
        return isCustomer
      default:
        return false
    }
  }

  if (!hasAccess()) {
    return <NotFound />
  }

  return children
}

export default ProtectedRoute
