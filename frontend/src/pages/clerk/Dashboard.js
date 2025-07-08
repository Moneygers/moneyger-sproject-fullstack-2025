"use client"

import { useState, useEffect } from "react"
import { Car, Calendar, DollarSign, BarChart3 } from "lucide-react"
import Layout from "../../components/Layout"
import "../../styles/clerk/Dashboard.css"
import BASE_URL from '../../config';

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
      const response = await fetch(`${BASE_URL}/api/dashboard/stats/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error("Failed to fetch dashboard data", response.status, response.statusText)
      }
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
                <span className="icon">
                  <Car size={24} />
                </span>
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
                <span className="icon">
                  <Car size={24} />
                </span>
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
                <span className="icon">
                  <Calendar size={24} />
                </span>
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
                <span className="icon">
                  <DollarSign size={24} />
                </span>
              </div>
              <div className="stat-info">
                <div className="stat-label">Today's Revenue</div>
                <div className="stat-value">₱{stats.todayRevenue?.toFixed(2) || "0.00"}</div>
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
                <span className="action-icon">
                  <Car size={20} />
                </span>
                <span className="action-text">Update Slots</span>
              </button>
              <button className="action-button" onClick={() => (window.location.href = "/clerk/monitor-reservations")}>
                <span className="action-icon">
                  <Calendar size={20} />
                </span>
                <span className="action-text">Monitor Reservations</span>
              </button>
              <button className="action-button" onClick={() => (window.location.href = "/clerk/checkout-vehicle")}>
                <span className="action-icon">
                  <BarChart3 size={20} />
                </span>
                <span className="action-text">Checkout Vehicle</span>
              </button>
              <button className="action-button" onClick={() => (window.location.href = "/clerk/approve-reservations")}>
                <span className="action-icon">
                  <Calendar size={20} />
                </span>
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
