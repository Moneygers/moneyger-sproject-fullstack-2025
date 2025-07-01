"use client"

import { useState, useEffect } from "react"
import "../../styles/clerk/MonitorReservations.css"
import Layout from "../../components/Layout"

const MonitorReservations = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock reservation data
  const mockReservations = [
    {
      id: 1,
      slot: "F1-A1-05",
      customer_name: "John Doe",
      phone_number: "09123456789",
      reserved_date: "2024-01-16",
      reserved_time: "14:00",
      duration_hours: 2,
      status: "active",
      arrival_time: "2024-01-16T14:15:00",
      parking_duration: 45,
    },
    {
      id: 2,
      slot: "F1-A1-06",
      customer_name: "Jane Smith",
      phone_number: "09987654321",
      reserved_date: "2024-01-16",
      reserved_time: "16:30",
      duration_hours: 3,
      status: "active",
      arrival_time: "2024-01-16T16:25:00",
      parking_duration: 120,
    },
    {
      id: 3,
      slot: "F2-B1-03",
      customer_name: "Mike Johnson",
      phone_number: "09111222333",
      reserved_date: "2024-01-15",
      reserved_time: "10:00",
      duration_hours: 4,
      status: "completed",
      arrival_time: "2024-01-15T10:00:00",
      parking_duration: 240,
    },
    {
      id: 4,
      slot: "F1-A1-07",
      customer_name: "Sarah Wilson",
      phone_number: "09444555666",
      reserved_date: "2024-01-17",
      reserved_time: "09:00",
      duration_hours: 1,
      status: "active",
    },
    {
      id: 5,
      slot: "F2-A1-02",
      customer_name: "David Brown",
      phone_number: "09777888999",
      reserved_date: "2024-01-16",
      reserved_time: "18:00",
      duration_hours: 2,
      status: "active",
    },
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReservations(mockReservations)
      setLoading(false)
    }, 1000)
  }, [])

  const handleArrival = async (reservationId) => {
    try {
      const currentTime = new Date().toISOString()

      setReservations((prev) =>
        prev.map((res) =>
          res.id === reservationId ? { ...res, arrival_time: currentTime, parking_duration: 0 } : res,
        ),
      )

      alert("Customer arrival recorded successfully!")
    } catch (error) {
      console.error("Error recording arrival:", error)
      alert("Failed to record arrival")
    }
  }

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      setReservations((prev) => prev.map((res) => (res.id === reservationId ? { ...res, status: newStatus } : res)))

      alert(`Reservation ${newStatus} successfully`)
    } catch (error) {
      console.error("Error updating reservation:", error)
      alert("Failed to update reservation")
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.slot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone_number.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
    return reservation.status === "active" && reservation.arrival_time
  }

  const hasArrived = (reservation) => {
    return reservation.arrival_time !== undefined
  }

  if (loading) {
    return (
      <div className="monitor-reservations-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  const activeReservations = reservations.filter((r) => r.status === "active").length
  const completedReservations = reservations.filter((r) => r.status === "completed").length
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
              <div className="summary-icon">📍</div>
              <div className="summary-info">
                <div className="summary-label">Currently Parked</div>
                <div className="summary-value">{currentlyParked}</div>
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
              <input
                type="text"
                placeholder="Slot, customer name, or phone..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
                    <div className="reservation-main-info">
                      <div className="reservation-icon">📅</div>

                      <div className="reservation-info-row">
                        <div className="info-field">
                          <div className="info-label">Slot</div>
                          <div className="info-value slot-id">{reservation.slot}</div>
                        </div>

                        <div className="info-field">
                          <div className="info-label">Customer</div>
                          <div className="info-value customer-name">{reservation.customer_name}</div>
                        </div>

                        <div className="info-field">
                          <div className="info-label">Phone</div>
                          <div className="info-value phone">{reservation.phone_number}</div>
                        </div>

                        <div className="info-field">
                          <div className="info-label">Date & Time</div>
                          <div className="info-value">
                            {new Date(`${reservation.reserved_date}T${reservation.reserved_time}`).toLocaleString()}
                          </div>
                        </div>

                        <div className="info-field">
                          <div className="info-label">Duration</div>
                          <div className="info-value">
                            {hasArrived(reservation)
                              ? formatParkingDuration(reservation.parking_duration)
                              : `${reservation.duration_hours}h expected`}
                          </div>
                        </div>

                        <div className="info-field">
                          <div className="info-label">Status</div>
                          <div className="status-badges">
                            <span className={`status-badge status-${reservation.status}`}>{reservation.status}</span>
                            {isReservationActive(reservation) && <span className="parked-badge">PARKED</span>}
                            {!hasArrived(reservation) && reservation.status === "active" && (
                              <span className="waiting-badge">WAITING</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="reservation-actions">
                      {reservation.status === "active" && !hasArrived(reservation) && (
                        <button onClick={() => handleArrival(reservation.id)} className="arrive-button">
                          Arrive
                        </button>
                      )}

                      {reservation.status === "active" && hasArrived(reservation) && (
                        <>
                          <button
                            onClick={() => handleStatusChange(reservation.id, "completed")}
                            className="complete-button"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleStatusChange(reservation.id, "cancelled")}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {reservation.status === "completed" && <span className="completed-text">✓ Completed</span>}
                      {reservation.status === "cancelled" && <span className="cancelled-text">✗ Cancelled</span>}
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
