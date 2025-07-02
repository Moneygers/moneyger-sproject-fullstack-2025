import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import LoginForm from "./pages/LoginForm"
import CustomerView from "./pages/customer/CustomerView"

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
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<CustomerView />} />

          {/* Clerk routes */}
          <Route path="/clerk/update-slots" element={<UpdateSlots />} />
          <Route path="/clerk/checkout-vehicle" element={<CheckoutVehicle />} />
          <Route path="/clerk/monitor-reservations" element={<MonitorReservations />} />
          <Route path="/clerk/approve-reservations" element={<ApproveReservations />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Admin routes */}
          <Route path="/admin/payment-reports" element={<PaymentReports />} />
          <Route path="/admin/review-transactions" element={<ReviewTransactions />} />
          <Route path="/admin/create-accounts" element={<CreateAccounts />} />
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/system-settings" element={<SystemSettings />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
