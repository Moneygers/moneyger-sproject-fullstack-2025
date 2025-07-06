"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../components/AdminLayout"
import { DollarSign, Receipt, TrendingUp, Search, Filter, X, CreditCard, Banknote, Smartphone } from "lucide-react"
import "../../styles/admin/ReviewTransactions.css"

const ReviewTransactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    fetchTransactions()
  }, [dateFilter, typeFilter])

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        date_filter: dateFilter,
        type_filter: typeFilter,
      })

      const response = await fetch(`/api/transactions/?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else {
        console.error("Failed to fetch transactions")
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "cash":
        return <Banknote size={32} />
      case "card":
        return <CreditCard size={32} />
      case "gcash":
        return <Smartphone size={32} />
      default:
        return <DollarSign size={32} />
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

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  const parkingFees = transactions
    .filter((t) => t.transaction_type === "parking_fee")
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  const reservationFees = transactions
    .filter((t) => t.transaction_type === "reservation_fee")
    .reduce((sum, t) => sum + (t.amount || 0), 0)

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
              <div className="summary-icon green">
                <DollarSign size={24} />
              </div>
              <div className="summary-info">
                <div className="summary-label">Total Revenue</div>
                <div className="summary-value">₱{totalRevenue.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon blue">
                <Receipt size={24} />
              </div>
              <div className="summary-info">
                <div className="summary-label">Parking Fees</div>
                <div className="summary-value">₱{parkingFees.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon purple">
                <TrendingUp size={24} />
              </div>
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
              <label className="filter-label">
                <Search size={16} style={{ marginRight: "8px" }} />
                Search
              </label>
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
              <label className="filter-label">
                <Filter size={16} style={{ marginRight: "8px" }} />
                Date Range
              </label>
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
                <X size={16} style={{ marginRight: "8px" }} />
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
              <div className="no-transactions-icon">
                <Receipt size={48} />
              </div>
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
                            {transaction.transaction_type?.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <p className="payment-method">
                          {transaction.payment_method?.charAt(0).toUpperCase() + transaction.payment_method?.slice(1)}{" "}
                          payment
                        </p>
                        <p className="transaction-time">{new Date(transaction.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="transaction-meta">
                      <div className="meta-item">
                        <div className="meta-label">Plate Number</div>
                        <div className="meta-value">{transaction.license_plate || "N/A"}</div>
                      </div>

                      <div className="meta-item">
                        <div className="meta-label">Duration</div>
                        <div className="meta-value">{transaction.duration || "N/A"}</div>
                      </div>

                      <div className="meta-item amount">
                        <div className="amount-value">₱{transaction.amount?.toFixed(2) || "0.00"}</div>
                        <div className="amount-status">{transaction.status || "Completed"}</div>
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
