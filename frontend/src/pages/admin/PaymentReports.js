"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../components/AdminLayout"
import "../../styles/admin/PaymentReports.css"

const PaymentReports = () => {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    transactions: 0,
    avgTransaction: 0,
    peakHour: "",
    dailyData: [],
  })

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/reports/payments/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Payment reports data:", data)
        setReportData(data)
      } else {
        console.error("Failed to fetch payment reports:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error fetching payment reports:", error)
    } finally {
      setLoading(false)
    }
  }

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
                <div className="summary-value">₱{reportData.totalRevenue?.toLocaleString() || "0"}</div>
                <div className="summary-change positive">+12% from last week</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon blue">📈</div>
              <div className="summary-info">
                <div className="summary-label">Transactions</div>
                <div className="summary-value">{reportData.transactions || 0}</div>
                <div className="summary-change positive">+8% from last week</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon purple">📊</div>
              <div className="summary-info">
                <div className="summary-label">Avg. Transaction</div>
                <div className="summary-value">₱{reportData.avgTransaction?.toLocaleString() || 0}</div>
                <div className="summary-change positive">+3% from last week</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon orange">💳</div>
              <div className="summary-info">
                <div className="summary-label">Peak Hour</div>
                <div className="summary-value">{reportData.peakHour || "N/A"}</div>
                <div className="summary-change">Highest revenue period</div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="chart-section">
          <h3 className="chart-title">Daily Revenue</h3>
          <div className="chart-container">
            {reportData.dailyData?.length > 0 ? (
              reportData.dailyData.map((day, index) => (
                <div key={index} className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{
                      height: `${Math.max((day.revenue / Math.max(...reportData.dailyData.map((d) => d.revenue))) * 200, 10)}px`,
                    }}
                  ></div>
                  <div className="chart-label">{day.name}</div>
                  <div className="chart-value">₱{day.revenue}</div>
                </div>
              ))
            ) : (
              <div className="no-chart-data">
                <p>No revenue data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default PaymentReports
