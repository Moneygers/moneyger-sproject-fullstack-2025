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

  // Mock transaction data
  const mockTransactions = [
    {
      id: 1,
      allocation: 1,
      amount: 150,
      transaction_type: "parking_fee",
      payment_method: "cash",
      created_at: "2024-01-15T10:30:00Z",
      receipt_number: "RCP-001",
    },
    {
      id: 2,
      allocation: 2,
      amount: 200,
      transaction_type: "parking_fee",
      payment_method: "card",
      created_at: "2024-01-15T11:15:00Z",
      receipt_number: "RCP-002",
    },
    {
      id: 3,
      allocation: 3,
      amount: 50,
      transaction_type: "reservation_fee",
      payment_method: "gcash",
      created_at: "2024-01-15T12:00:00Z",
      receipt_number: "RCP-003",
    },
    {
      id: 4,
      allocation: 4,
      amount: 300,
      transaction_type: "parking_fee",
      payment_method: "card",
      created_at: "2024-01-15T14:30:00Z",
      receipt_number: "RCP-004",
    },
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTransactions(mockTransactions)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payment_method.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || transaction.transaction_type === typeFilter

    return matchesSearch && matchesType
  })

  const getPaymentMethodIcon = (method) => {
    switch (method) {
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
      case "parking_fee":
        return "transaction-type parking-fee"
      case "reservation_fee":
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

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0)
  const parkingFees = transactions
    .filter((t) => t.transaction_type === "parking_fee")
    .reduce((sum, t) => sum + t.amount, 0)
  const reservationFees = transactions
    .filter((t) => t.transaction_type === "reservation_fee")
    .reduce((sum, t) => sum + t.amount, 0)

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
                <div className="summary-value">₱{totalRevenue.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon blue">🧾</div>
              <div className="summary-info">
                <div className="summary-label">Parking Fees</div>
                <div className="summary-value">₱{parkingFees.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon purple">📈</div>
              <div className="summary-info">
                <div className="summary-label">Reservation Fees</div>
                <div className="summary-value">₱{reservationFees.toFixed(2)}</div>
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
                  placeholder="Receipt number or payment method..."
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
                <option value="parking_fee">Parking Fees</option>
                <option value="reservation_fee">Reservation Fees</option>
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

        {/* Transactions List */}
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
            <div className="transactions-list">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-content">
                    <div className="transaction-info">
                      <div className="payment-method-icon">{getPaymentMethodIcon(transaction.payment_method)}</div>
                      <div className="transaction-details">
                        <div className="transaction-header">
                          <h3 className="receipt-number">{transaction.receipt_number}</h3>
                          <span className={getTransactionTypeClass(transaction.transaction_type)}>
                            {transaction.transaction_type.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <p className="payment-method">
                          {transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1)}{" "}
                          payment
                        </p>
                        <p className="transaction-time">{new Date(transaction.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="transaction-meta">
                      <div className="meta-item">
                        <div className="meta-label">Plate Number</div>
                        <div className="meta-value">ABC-{transaction.id}123</div>
                      </div>

                      <div className="meta-item">
                        <div className="meta-label">Duration</div>
                        <div className="meta-value">
                          {Math.floor(Math.random() * 5) + 1}h {Math.floor(Math.random() * 60)}m
                        </div>
                      </div>

                      <div className="meta-item amount">
                        <div className="amount-value">₱{transaction.amount.toFixed(2)}</div>
                        <div className="amount-status">Completed</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default ReviewTransactions
