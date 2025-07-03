"use client"

import AdminNavBar from "./AdminNavBar"
import AdminSidebar from "./AdminSidebar"
import "../styles/components/AdminLayout.css"

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main-content">
        <AdminNavBar />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
