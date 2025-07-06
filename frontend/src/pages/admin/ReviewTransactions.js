"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../components/AdminLayout"
import "../../styles/admin/ReviewTransactions.css"

const ReviewTransactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [typeFilter, setTypeFilter] = useState("all")
  const [reportData, setReportData] = useState({
    totalPayment: 0,
    totalReservation: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    fetchReportData()
    fetchTransactions()
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
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [dateFilter, typeFilter])

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        date_filter: dateFilter,
        type_filter: typeFilter,
      })

      const response = await fetch(`http://localhost:8000/api/reports/transactions/?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Transactions data:", data)
        setTransactions(data)
      } else {
        console.error("Failed to fetch transactions:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSlotDisplayId = (transaction) => {
    if (transaction.type === 'payment') {
      return transaction.slot_details?.display_id || "N/A"
    } else if (transaction.type === 'reservation') {
      return transaction.park_slot_details?.display_id || transaction.slot || "N/A"
    }
    return "N/A"
  }

  const getFeeAmount = (transaction) => {
    // For payments, use 'amount', for reservations, use 'fee'
    let amount = 0
    
    if (transaction.type === 'payment') {
      amount = transaction.amount || 0
    } else if (transaction.type === 'reservation') {
      amount = transaction.fee || 0
    } else {
      amount = transaction.amount || transaction.fee || 0
    }
    
    // Ensure we return a number
    const numericAmount = parseFloat(amount)
    return isNaN(numericAmount) ? 0 : numericAmount
  }

  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    const slotId = getSlotDisplayId(transaction)
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      slotId?.toLowerCase().includes(search) ||
      (transaction.plate_no || "").toLowerCase().includes(search) ||
      (transaction.mode_of_payment || "").toLowerCase().includes(search)

    // Type filter
    let matchesType = true
    if (typeFilter !== "all") {
      matchesType = transaction.type === typeFilter
    }

    // Date filter
    let matchesDate = true
    if (dateFilter !== "all" && transaction.created_at) {
      const txDate = new Date(transaction.created_at)
      const now = new Date()
      if (dateFilter === "today") {
        matchesDate = txDate.toDateString() === now.toDateString()
      } else if (dateFilter === "week") {
        // Get start of week (Sunday)
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0,0,0,0)
        // Get end of week (Saturday)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23,59,59,999)
        matchesDate = txDate >= startOfWeek && txDate <= endOfWeek
      } else if (dateFilter === "month") {
        matchesDate = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
      }
    }

    return matchesSearch && matchesType && matchesDate
  })

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case "cash":
        return "💵"
      case "card":
        return "💳"
      case "gcash":
        return "📱"
      default:
        return "💰"
    }
  }

  const getTransactionTypeClass = (type) => {
    switch (type) {
      case "payment":
        return "transaction-type parking-fee"
      case "reservation":
        return "transaction-type reservation-fee"
      default:
        return "transaction-type default"
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="review-transactions-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + getFeeAmount(t), 0)
  const parkingFees = filteredTransactions
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + getFeeAmount(t), 0)
  const reservationFees = filteredTransactions
    .filter((t) => t.type === "reservation")
    .reduce((sum, t) => sum + getFeeAmount(t), 0)

  return (
    <AdminLayout>
      <div className="review-transactions-container">
        <div className="review-transactions-header">
          <h1 className="main-title">Review Payment Transactions</h1>
          <p className="subtitle">Monitor and review all payment transactions</p>
        </div>

        {/* Revenue Summary */}
        <div className="revenue-summary">
          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon green">💰</div>
              <div className="summary-info">
                <div className="summary-label">Total Revenue</div>
                <div className="summary-value">₱{reportData.totalRevenue?.toLocaleString() || "0"}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon blue">🧾</div>
              <div className="summary-info">
                <div className="summary-label">Parking Fees</div>
                <div className="summary-value">₱{reportData.totalPayment?.toLocaleString() || "0"}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon purple">📈</div>
              <div className="summary-info">
                <div className="summary-label">Reservation Fees</div>
                <div className="summary-value">₱{reportData.totalReservation?.toLocaleString() || "0"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Slot, plate number, or payment method..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <select className="filter-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Transaction Type</label>
              <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="payment">Parking Fees</option>
                <option value="reservation">Reservation Fees</option>
              </select>
            </div>

            <div className="filter-group">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setDateFilter("today")
                  setTypeFilter("all")
                }}
                className="clear-filters-button"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="transactions-section">
          <div className="section-header">
            <h2 className="section-title">Transactions ({filteredTransactions.length})</h2>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="no-transactions">
              <div className="no-transactions-icon">🧾</div>
              <h3 className="no-transactions-title">No transactions found</h3>
              <p className="no-transactions-text">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Plate Number</th>
                    <th>Fee</th>
                    <th>Mode of Payment</th>
                    <th>Date</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="transaction-row">
                      <td className="slot-cell">
                        <div className="slot-info">
                          <span className="slot-number">{getSlotDisplayId(transaction)}</span>
                        </div>
                      </td>
                      <td className="plate-cell">
                        <span className="plate-number">{transaction.plate_no || "N/A"}</span>
                      </td>
                      <td className="fee-cell">
                        <span className="fee-amount">₱{getFeeAmount(transaction).toFixed(2)}</span>
                      </td>
                      <td className="payment-cell">
                        <div className="payment-method">
                          <span className="payment-icon">{getPaymentMethodIcon(transaction.mode_of_payment)}</span>
                          <span className="payment-text">
                            {transaction.mode_of_payment?.charAt(0).toUpperCase() + transaction.mode_of_payment?.slice(1) || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="date-cell">
                        <span className="transaction-date">
                          {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : "N/A"}
                        </span>
                        <span className="transaction-time">
                          {transaction.created_at ? new Date(transaction.created_at).toLocaleTimeString() : ""}
                        </span>
                      </td>
                      <td className="type-cell">
                        <span className={getTransactionTypeClass(transaction.type)}>
                          {transaction.type?.toUpperCase() || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default ReviewTransactions