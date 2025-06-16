"use client"

import type React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import LoginForm from "./Components/Auth/LoginForm"
import Navbar from "./Components/Layout/NavBar"
import Sidebar from "./Components/Layout/Sidebar"
import Dashboard from "./Components/Dashboard/Dashboard"
import ParkingSlotsManager from "./Components/ParkingSlots/ParkingSlotsManager"
import LicensePlateSearch from "./Components/Search/LicensePlateSearch"
import CustomerView from "./Components/Customer/CustomerView"
import "./App.css"

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles = [],
}) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/customer-view" element={<CustomerView />} />
          <Route path="/view" element={<CustomerView />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "clerk"]}>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/slots"
            element={
              <ProtectedRoute allowedRoles={["admin", "clerk"]}>
                <AppLayout>
                  <ParkingSlotsManager />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute allowedRoles={["admin", "clerk"]}>
                <AppLayout>
                  <LicensePlateSearch />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
