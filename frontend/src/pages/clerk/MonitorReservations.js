"use client"

import { useState, useEffect } from "react"
import { Calendar, Car, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import "../../styles/clerk/MonitorReservations.css"
import Layout from "../../components/Layout"
import BASE_URL from '../../config';

const MonitorReservations = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchReservations()
  }, [statusFilter])

  const fetchReservations = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`${BASE_URL}/api/reservations/?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReservations(data)
      } else {
        console.error("Failed to fetch reservations")
      }
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleArrival = async (reservationId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/reservations/${reservationId}/arrival/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        const data = await response.json()
        setReservations((prev) => prev.map((res) => (res.id === reservationId ? data.reservation : res)))
        alert("Customer arrival recorded successfully!")
        fetchReservations()
      } else {
        const errorData = await response.json()
        alert(`Failed to record arrival: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error recording arrival:", error)
      alert("Failed to record arrival")
    }
  }

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      let endpoint = `${BASE_URL}/api/reservations/${reservationId}/`
      let method = "PATCH"
      let body = JSON.stringify({ status: newStatus })

      if (newStatus === "completed") {
        endpoint = `${BASE_URL}/api/reservations/${reservationId}/complete/`
        method = "POST"
        body = JSON.stringify({})
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: body,
      })

      if (response.ok) {
        const data = await response.json()
        setReservations((prev) => prev.map((res) => (res.id === reservationId ? data.reservation || data : res)))
        alert(`Reservation ${newStatus} successfully`)
        fetchReservations()
      } else {
        const errorData = await response.json()
        alert(`Failed to update reservation: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error updating reservation:", error)
      alert("Failed to update reservation")
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      searchTerm === "" ||
      reservation.slot?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone_number?.includes(searchTerm)

    return matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "status-active"
      case "arrived":
        return "status-arrived"
      case "completed":
        return "status-completed"
      case "rejected":
        return "status-cancelled"
      case "pending":
        return "status-pending"
      default:
        return "status-default"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <Clock size={16} />
      case "arrived":
        return <Car size={16} />
      case "completed":
        return <CheckCircle size={16} />
      case "rejected":
        return <XCircle size={16} />
      case "pending":
        return <AlertTriangle size={16} />
      default:
        return <Calendar size={16} />
    }
  }

  const hasArrived = (reservation) => {
    return reservation.arrival_time !== undefined && reservation.arrival_time !== null
  }

  if (loading) {
    return (
      <Layout>
        <div className="monitor-reservations-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </Layout>
    )
  }

  const activeReservations = reservations.filter((r) => r.status === "approved").length
  const arrivedReservations = reservations.filter((r) => r.status === "arrived").length

  return (
    <Layout>
      <div className="monitor-reservations-container">
        <div className="monitor-reservations-header">
          <h1 className="main-title">Monitor Reservations</h1>
          <p className="subtitle">Track customer reservations and manage arrivals</p>
        </div>

        {/* Reservation Summary */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <Calendar size={24} />
              </div>
              <div className="summary-info">
                <div className="summary-label">Active Reservations</div>
                <div className="summary-value">{activeReservations}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <Car size={24} />
              </div>
              <div className="summary-info">
                <div className="summary-label">Arrived</div>
                <div className="summary-value">{arrivedReservations}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Slot, customer name, or phone..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="arrived">Arrived</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
                className="clear-filters-button"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Reservations Table */}
        <div className="reservations-section">
          <div className="section-header">
            <h2 className="section-title">Reservations ({filteredReservations.length})</h2>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="no-reservations">
              <div className="no-reservations-icon">
                <Calendar size={48} />
              </div>
              <h3 className="no-reservations-title">No reservations found</h3>
              <p className="no-reservations-text">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="reservations-table">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <div className="slot-info">
                          <span className="slot-id">{reservation.slot}</span>
                        </div>
                      </td>
                      <td>
                        <div className="customer-info">
                          <span className="customer-name">{reservation.customer_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="phone-number">{reservation.phone_number}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusColor(reservation.status)}`}>
                          <span className="status-icon">{getStatusIcon(reservation.status)}</span>
                          <span>{reservation.status?.toUpperCase()}</span>
                        </span>
                        {reservation.status === "arrived" && <span className="parked-badge">PARKED</span>}
                        {!hasArrived(reservation) && reservation.status === "approved" && (
                          <span className="waiting-badge">WAITING</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {reservation.status === "approved" && !hasArrived(reservation) && (
                            <button onClick={() => handleArrival(reservation.id)} className="arrive-button">
                              Arrive
                            </button>
                          )}

                          {reservation.status === "completed" && (
                            <span className="completed-text">
                              <CheckCircle size={16} /> Completed
                            </span>
                          )}

                          {reservation.status === "rejected" && (
                            <span className="cancelled-text">
                              <XCircle size={16} /> Cancelled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default MonitorReservations
