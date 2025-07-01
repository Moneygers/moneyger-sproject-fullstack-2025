"use client"

import { useState, useEffect } from "react"
import Layout from "../../components/Layout"
import "../../styles/clerk/ApproveReservations.css"

const ApproveReservations = () => {
  const [pendingReservations, setPendingReservations] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock pending reservations data
  const mockPendingReservations = [
    {
      id: 5,
      slot: "F1-A1-05",
      customer_name: "Alice Brown",
      phone_number: "09777888999",
      reserved_date: "2024-01-17",
      reserved_time: "15:00",
      duration_hours: 3,
      status: "pending",
    },
    {
      id: 6,
      slot: "F1-A1-06",
      customer_name: "Bob Wilson",
      phone_number: "09666777888",
      reserved_date: "2024-01-18",
      reserved_time: "10:30",
      duration_hours: 2,
      status: "pending",
    },
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPendingReservations(mockPendingReservations)
      setLoading(false)
    }, 1000)
  }, [])

  const handleApproval = async (reservationId, approved) => {
    try {
      if (approved) {
        alert("Reservation approved successfully!")
      } else {
        alert("Reservation rejected successfully!")
      }

      // Remove from pending list
      setPendingReservations((prev) => prev.filter((res) => res.id !== reservationId))
    } catch (error) {
      console.error("Error processing reservation:", error)
      alert("Failed to process reservation")
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="approve-reservations-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="approve-reservations-container">
        <div className="approve-reservations-header">
          <h1 className="main-title">Approve Parking Reservations</h1>
          <p className="subtitle">Review and approve pending parking reservations</p>
        </div>

        {/* Summary */}
        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">⏰</div>
            <div className="summary-info">
              <div className="summary-label">Pending Approvals</div>
              <div className="summary-value">{pendingReservations.length}</div>
            </div>
          </div>
        </div>

        {/* Pending Reservations */}
        <div className="reservations-section">
          <div className="section-header">
            <h2 className="section-title">Pending Reservations</h2>
          </div>

          {pendingReservations.length === 0 ? (
            <div className="no-reservations">
              <div className="no-reservations-icon">✅</div>
              <h3 className="no-reservations-title">No pending reservations</h3>
              <p className="no-reservations-text">All reservations have been processed.</p>
            </div>
          ) : (
            <div className="reservations-list">
              {pendingReservations.map((reservation) => (
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
                          <div className="info-value">{reservation.duration_hours}h</div>
                        </div>

                        <div className="info-field">
                          <div className="info-label">Status</div>
                          <span className="status-badge pending">PENDING APPROVAL</span>
                        </div>
                      </div>
                    </div>

                    <div className="reservation-actions">
                      <button onClick={() => handleApproval(reservation.id, true)} className="approve-button">
                        ✅ Approve
                      </button>
                      <button onClick={() => handleApproval(reservation.id, false)} className="reject-button">
                        ❌ Reject
                      </button>
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

export default ApproveReservations
