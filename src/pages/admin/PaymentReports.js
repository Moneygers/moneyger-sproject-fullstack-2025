"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../components/AdminLayout"
import "../../styles/admin/PaymentReports.css"

const PaymentReports = () => {
  const [loading, setLoading] = useState(true)

  // Mock data for charts
  const dailyData = [
    { name: "Mon", revenue: 1200 },
    { name: "Tue", revenue: 1900 },
    { name: "Wed", revenue: 800 },
    { name: "Thu", revenue: 2400 },
    { name: "Fri", revenue: 3200 },
    { name: "Sat", revenue: 2800 },
    { name: "Sun", revenue: 2100 },
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="payment-reports-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="payment-reports-container">
        <div className="payment-reports-header">
          <h1 className="main-title">Payment Reports</h1>
          <p className="subtitle">View payment analytics and revenue insights</p>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon green">💰</div>
              <div className="summary-info">
                <div className="summary-label">Total Revenue</div>
                <div className="summary-value">₱14,500</div>
                <div className="summary-change positive">+12% from last week</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon blue">📈</div>
              <div className="summary-info">
                <div className="summary-label">Transactions</div>
                <div className="summary-value">127</div>
                <div className="summary-change positive">+8% from last week</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon purple">📊</div>
              <div className="summary-info">
                <div className="summary-label">Avg. Transaction</div>
                <div className="summary-value">₱114</div>
                <div className="summary-change positive">+3% from last week</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon orange">💳</div>
              <div className="summary-info">
                <div className="summary-label">Peak Hour</div>
                <div className="summary-value">2-4 PM</div>
                <div className="summary-change">₱2,400 revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="chart-section">
          <h3 className="chart-title">Daily Revenue</h3>
          <div className="chart-container">
            {dailyData.map((day, index) => (
              <div key={index} className="chart-bar-container">
                <div className="chart-bar" style={{ height: `${(day.revenue / 3200) * 200}px` }}></div>
                <div className="chart-label">{day.name}</div>
                <div className="chart-value">₱{day.revenue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default PaymentReports
