"use client"

import type React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import LoginForm from "./Components/Auth/LoginForm"
import Navbar from "./Components/Layout/NavBar"
import Sidebar from "./Components/Layout/Sidebar"
import Dashboard from "./Components/Dashboard/Dashboard"
import CustomerView from "./Components/Customer/CustomerView"

// Customer Components
import MonitorAvailability from "./Components/Customer/MonitorAvailability"
import MakeReservation from "./Components/Customer/MakerReservations"

// Clerk Components
import UpdateSlots from "./Components/Clerk/UpdateSlots"
import CheckoutVehicle from "./Components/Clerk/CheckoutVehicle"
import HandlePayments from "./Components/Clerk/HandlePayments"
import PrintTicket from "./Components/Clerk/PrintTicket"
import MonitorReservations from "./Components/Clerk/MonitorReservations"

// Admin Components
import ApproveReservations from "./Components/Admin/ApproveReservations"
import ReviewTransactions from "./Components/Admin/ReviewTransactions"
import PaymentReports from "./Components/Admin/PaymentReports"
import SystemSettings from "./Components/Admin/SystemSettings"
import CreateAccounts from "./Components/Admin/CreateAccounts"
import ManageUsers from "./Components/Admin/ManageUsers"

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

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />

          {/* Public Customer Routes - No Authentication Required */}
          <Route path="/customer-view" element={<CustomerView />} />
          <Route path="/view" element={<CustomerView />} />
          <Route path="/parking" element={<CustomerView />} />
          <Route
            path="/monitor-availability"
            element={
              <PublicLayout>
                <MonitorAvailability />
              </PublicLayout>
            }
          />
          <Route
            path="/parking-availability"
            element={
              <PublicLayout>
                <MonitorAvailability />
              </PublicLayout>
            }
          />

          {/* Customer Routes that require authentication */}
          <Route
            path="/make-reservation"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <AppLayout>
                  <MakeReservation />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Clerk Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["clerk", "admin"]}>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-slots"
            element={
              <ProtectedRoute allowedRoles={["clerk", "admin"]}>
                <AppLayout>
                  <UpdateSlots />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout-vehicle"
            element={
              <ProtectedRoute allowedRoles={["clerk", "admin"]}>
                <AppLayout>
                  <CheckoutVehicle />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/handle-payments"
            element={
              <ProtectedRoute allowedRoles={["clerk", "admin"]}>
                <AppLayout>
                  <HandlePayments />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/print-ticket"
            element={
              <ProtectedRoute allowedRoles={["clerk", "admin"]}>
                <AppLayout>
                  <PrintTicket />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitor-reservations"
            element={
              <ProtectedRoute allowedRoles={["clerk", "admin"]}>
                <AppLayout>
                  <MonitorReservations />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/approve-reservations"
            element={
              <ProtectedRoute allowedRoles={["clerk", "admin"]}>
                <AppLayout>
                  <ApproveReservations />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/review-transactions"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppLayout>
                  <ReviewTransactions />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppLayout>
                  <PaymentReports />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/system-settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppLayout>
                  <SystemSettings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-accounts"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppLayout>
                  <CreateAccounts />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppLayout>
                  <ManageUsers />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/customer-view" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
