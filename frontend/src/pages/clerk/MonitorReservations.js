"use client"

import { useState, useEffect } from "react"
import "../../styles/clerk/MonitorReservations.css"
import Layout from "../../components/Layout"

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

      const response = await fetch(`http://127.0.0.1:8000/api/reservations/?${params}`, {
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
      const response = await fetch(`http://127.0.0.1:8000/api/reservations/${reservationId}/arrival/`, {
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
        fetchReservations() // Refresh the list
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
      let endpoint = `http://127.0.0.1:8000/api/reservations/${reservationId}/`
      let method = "PATCH"
      let body = JSON.stringify({ status: newStatus })

      if (newStatus === "completed") {
        endpoint = `http://127.0.0.1:8000/api/reservations/${reservationId}/complete/`
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
        fetchReservations() // Refresh the list
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
        return "⏰"
      case "arrived":
        return "🚗"
      case "completed":
        return "✅"
      case "rejected":
        return "❌"
      case "pending":
        return "⏳"
      default:
        return "📅"
    }
  }

  const formatParkingDuration = (minutes) => {
    if (!minutes) return "Not arrived"

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const isReservationActive = (reservation) => {
    return reservation.status === "arrived" && reservation.arrival_time
  }

  const isReservationUpcoming = (reservation) => {
    if (!reservation.reserved_date || !reservation.reserved_time) return false

    const reservationDateTime = new Date(`${reservation.reserved_date}T${reservation.reserved_time}`)
    const now = new Date()

    return reservationDateTime > now && reservation.status === "approved" && !reservation.arrival_time
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
  const completedReservations = reservations.filter((r) => r.status === "completed").length
  const upcomingReservations = reservations.filter((r) => isReservationUpcoming(r)).length
  const currentlyParked = reservations.filter((r) => isReservationActive(r)).length

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
              <div className="summary-icon">📅</div>
              <div className="summary-info">
                <div className="summary-label">Active Reservations</div>
                <div className="summary-value">{activeReservations}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">🚗</div>
              <div className="summary-info">
                <div className="summary-label">Arrived</div>
                <div className="summary-value">{arrivedReservations}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">⏰</div>
              <div className="summary-info">
                <div className="summary-label">Upcoming Today</div>
                <div className="summary-value">{upcomingReservations}</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">✅</div>
              <div className="summary-info">
                <div className="summary-label">Completed</div>
                <div className="summary-value">{completedReservations}</div>
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

        {/* Reservations List */}
        <div className="reservations-section">
          <div className="section-header">
            <h2 className="section-title">Reservations ({filteredReservations.length})</h2>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="no-reservations">
              <div className="no-reservations-icon">📅</div>
              <h3 className="no-reservations-title">No reservations found</h3>
              <p className="no-reservations-text">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="reservations-list">
              {filteredReservations.map((reservation) => (
                <div key={reservation.id} className="reservation-item">
                  <div className="reservation-content">
                    <div className="reservation-info">
                      <div className="reservation-icon">📅</div>
                      <div className="reservation-details">
                        <div className="reservation-header">
                          <h3 className="slot-id">{reservation.slot}</h3>
                          <span className={`status-badge ${getStatusColor(reservation.status)}`}>
                            <span className="status-icon">{getStatusIcon(reservation.status)}</span>
                            <span>{reservation.status?.toUpperCase()}</span>
                          </span>
                          {reservation.status === "arrived" && <span className="parked-badge">PARKED</span>}
                          {!hasArrived(reservation) && reservation.status === "approved" && (
                            <span className="waiting-badge">WAITING</span>
                          )}
                        </div>
                        <p className="customer-info">
                          <span className="customer-icon">👤</span>
                          {reservation.customer_name} • <span className="phone-icon">📞</span>
                          {reservation.phone_number}
                        </p>
                        <div className="reservation-times">
                          <p>
                            Reserved:{" "}
                            {reservation.reserved_date && reservation.reserved_time
                              ? new Date(`${reservation.reserved_date}T${reservation.reserved_time}`).toLocaleString()
                              : "N/A"}
                          </p>
                          {hasArrived(reservation) ? (
                            <p>
                              <span className="duration-icon">⏰</span>
                              Parked for: {formatParkingDuration(reservation.parking_duration)}
                            </p>
                          ) : (
                            <p>
                              <span className="duration-icon">⏰</span>
                              Expected duration: {reservation.duration_hours || 0}h
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="reservation-actions">
                      {reservation.status === "approved" && !hasArrived(reservation) && (
                        <button onClick={() => handleArrival(reservation.id)} className="arrive-button">
                          <span className="button-icon">📍</span>
                          <span>Arrive</span>
                        </button>
                      )}

                      {reservation.status === "arrived" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(reservation.id, "completed")}
                            className="complete-button"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleStatusChange(reservation.id, "rejected")}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {reservation.status === "completed" && <span className="completed-text">✓ Completed</span>}

                      {reservation.status === "rejected" && <span className="cancelled-text">✗ Cancelled</span>}
                    </div>
                  </div>

                  {/* Additional Info for Clerks */}
                  <div className="additional-info">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Slot Type:</span>
                        <div className="info-value">{reservation.slot_type || "Regular"}</div>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Floor:</span>
                        <div className="info-value">
                          {reservation.slot ? `Floor ${reservation.slot.charAt(1)}` : "N/A"}
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Duration:</span>
                        <div className="info-value">{reservation.duration_hours || 0}h</div>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <div className="info-value">{reservation.status}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default MonitorReservations
