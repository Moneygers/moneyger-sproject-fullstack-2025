"use client"

import { useState, useEffect } from "react"
import Layout from "../../components/Layout"
import "../../styles/clerk/Dashboard.css"

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSlots: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    reservations: 0,
    todayRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockSlots = [
        { id: "F1-A1-01", status: "available" },
        { id: "F1-A1-02", status: "occupied" },
        { id: "F1-A1-03", status: "available" },
        { id: "F1-B1-01", status: "occupied" },
        { id: "F2-A1-01", status: "available" },
        { id: "F2-A1-02", status: "reserved" },
        { id: "F3-A1-01", status: "available" },
        { id: "F4-A1-01", status: "available" },
      ]

      const mockReservations = [
        { id: 1, status: "active" },
        { id: 2, status: "active" },
        { id: 3, status: "completed" },
        { id: 4, status: "active" },
      ]

      const mockTransactions = [
        { id: 1, amount: "150.00", created_at: new Date().toISOString() },
        { id: 2, amount: "200.00", created_at: new Date().toISOString() },
        { id: 3, amount: "75.00", created_at: new Date().toISOString() },
      ]

      const totalSlots = mockSlots.length
      const availableSlots = mockSlots.filter((slot) => slot.status === "available").length
      const occupiedSlots = mockSlots.filter((slot) => slot.status === "occupied").length
      const reservations = mockReservations.filter((res) => res.status === "active").length

      // Calculate today's revenue
      const today = new Date().toISOString().split("T")[0]
      const todayTransactions = mockTransactions.filter((trans) => trans.created_at.startsWith(today))
      const todayRevenue = todayTransactions.reduce((sum, trans) => sum + Number.parseFloat(trans.amount), 0)

      setStats({
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservations,
        todayRevenue,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </Layout>
    )
  }

  const occupancyRate = stats.totalSlots > 0 ? Math.round((stats.occupiedSlots / stats.totalSlots) * 100) : 0

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="main-title">Dashboard</h1>
          <p className="subtitle">Overview of parking management system</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon available">
                <span className="icon">🚗</span>
              </div>
              <div className="stat-info">
                <div className="stat-label">Available Slots</div>
                <div className="stat-value">
                  {stats.availableSlots} / {stats.totalSlots}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon occupied">
                <span className="icon">🚗</span>
              </div>
              <div className="stat-info">
                <div className="stat-label">Occupied Slots</div>
                <div className="stat-value">{stats.occupiedSlots}</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon reservations">
                <span className="icon">📅</span>
              </div>
              <div className="stat-info">
                <div className="stat-label">Active Reservations</div>
                <div className="stat-value">{stats.reservations}</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon revenue">
                <span className="icon">💰</span>
              </div>
              <div className="stat-info">
                <div className="stat-label">Today's Revenue</div>
                <div className="stat-value">₱{stats.todayRevenue.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="occupancy-section">
          <div className="occupancy-card">
            <h3 className="occupancy-title">Occupancy Rate</h3>
            <div className="occupancy-content">
              <div className="occupancy-header">
                <div className="occupancy-label">
                  <span className="occupancy-badge">Occupied</span>
                </div>
                <div className="occupancy-percentage">{occupancyRate}%</div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${occupancyRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <div className="actions-card">
            <h3 className="actions-title">Quick Actions</h3>
            <div className="actions-grid">
              <button className="action-button" onClick={() => (window.location.href = "/clerk/update-slots")}>
                <span className="action-icon">🚗</span>
                <span className="action-text">Update Slots</span>
              </button>
              <button className="action-button" onClick={() => (window.location.href = "/clerk/monitor-reservations")}>
                <span className="action-icon">📅</span>
                <span className="action-text">Monitor Reservations</span>
              </button>
              <button className="action-button" onClick={() => (window.location.href = "/clerk/checkout-vehicle")}>
                <span className="action-icon">💳</span>
                <span className="action-text">Checkout Vehicle</span>
              </button>
              <button className="action-button" onClick={() => (window.location.href = "/clerk/approve-reservations")}>
                <span className="action-icon">✅</span>
                <span className="action-text">Approve Reservations</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard
