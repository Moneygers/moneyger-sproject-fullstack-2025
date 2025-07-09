import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import LoginForm from "./pages/LoginForm"
import CustomerView from "./pages/customer/CustomerView"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"
import APITestPage from "./pages/APITestPage"

// Clerk pages
import UpdateSlots from "./pages/clerk/UpdateSlots"
import CheckoutVehicle from "./pages/clerk/CheckoutVehicle"
import MonitorReservations from "./pages/clerk/MonitorReservations"
import ApproveReservations from "./pages/clerk/ApproveReservations"
import Dashboard from "./pages/clerk/Dashboard"

// Admin pages
import PaymentReports from "./pages/admin/PaymentReports"
import ReviewTransactions from "./pages/admin/ReviewTransactions"
import CreateAccounts from "./pages/admin/CreateAccounts"
import ManageUsers from "./pages/admin/ManageUsers"
import SystemSettings from "./pages/admin/SystemSettings"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<CustomerView />} />
          <Route path="/api-test" element={<APITestPage />} />

          {/* Clerk routes - accessible by clerks only */}
          <Route
            path="/clerk/update-slots"
            element={
              <ProtectedRoute requiredRole="clerk">
                <UpdateSlots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clerk/checkout-vehicle"
            element={
              <ProtectedRoute requiredRole="clerk">
                <CheckoutVehicle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clerk/monitor-reservations"
            element={
              <ProtectedRoute requiredRole="clerk">
                <MonitorReservations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clerk/approve-reservations"
            element={
              <ProtectedRoute requiredRole="clerk">
                <ApproveReservations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="clerk">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin routes - accessible by admins only */}
          <Route
            path="/admin/payment-reports"
            element={
              <ProtectedRoute requiredRole="admin">
                <PaymentReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/review-transactions"
            element={
              <ProtectedRoute requiredRole="admin">
                <ReviewTransactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-accounts"
            element={
              <ProtectedRoute requiredRole="admin">
                <CreateAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-users"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system-settings"
            element={
              <ProtectedRoute requiredRole="admin">
                <SystemSettings />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-all route - MUST be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
