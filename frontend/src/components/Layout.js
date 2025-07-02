"use client"

import NavBar from "./NavBar"
import Sidebar from "./Sidebar"
import "../styles/components/Layout.css"

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <NavBar />
        <main className="content">{children}</main>
      </div>
    </div>
  )
}

export default Layout
