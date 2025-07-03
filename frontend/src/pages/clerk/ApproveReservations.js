"use client"

import { useState, useEffect } from "react"
import Layout from "../../components/Layout"
import "../../styles/clerk/ApproveReservations.css"

const ApproveReservations = () => {
  const [pendingReservations, setPendingReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPendingReservations()
  }, [])

  const fetchPendingReservations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("http://127.0.0.1:8000/api/reservations/?status=pending", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPendingReservations(data)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to fetch pending reservations")
        console.error("Failed to fetch pending reservations:", errorData)
      }
    } catch (error) {
      setError("Network error occurred while fetching reservations")
      console.error("Error fetching pending reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (reservationId, approved) => {
    try {
      const endpoint = approved ? "approve" : "reject"
      const response = await fetch(`http://127.0.0.1:8000/api/reservations/${reservationId}/${endpoint}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        alert(
          result.message || (approved ? "Reservation approved successfully!" : "Reservation rejected successfully!"),
        )

        // Remove from pending list
        setPendingReservations((prev) => prev.filter((res) => res.id !== reservationId))
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to process reservation")
      }
    } catch (error) {
      console.error("Error processing reservation:", error)
      alert("Network error occurred while processing reservation")
    }
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="approve-reservations-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading pending reservations...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="approve-reservations-container">
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Reservations</h3>
            <p>{error}</p>
            <button onClick={fetchPendingReservations} className="retry-button">
              Try Again
            </button>
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
          <button onClick={fetchPendingReservations} className="refresh-button">
            🔄 Refresh
          </button>
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
                    <div className="reservation-info">
                      <div className="reservation-icon">📅</div>
                      <div className="reservation-details">
                        <div className="reservation-header">
                          <h3 className="slot-id">{reservation.slot || `Slot ${reservation.park_slot}`}</h3>
                          <span className="status-badge pending">PENDING APPROVAL</span>
                        </div>
                        <div className="customer-info">
                          <div className="info-item">
                            <span className="info-icon">👤</span>
                            <span>{reservation.customer_name || reservation.name}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-icon">🚗</span>
                            <span>{reservation.plate_no}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-icon">📞</span>
                            <span>{reservation.phone_number || reservation.mobileNo}</span>
                          </div>
                        </div>
                        <div className="reservation-time">
                          <span className="info-icon">📅</span>
                          <span>Reserved for: {formatDate(reservation.reserved_date || reservation.date)}</span>
                        </div>
                        {reservation.fee && (
                          <div className="reservation-fee">
                            <span className="info-icon">💰</span>
                            <span>Fee: ₱{Number.parseFloat(reservation.fee).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="reservation-created">
                          <span className="info-icon">🕒</span>
                          <span>Requested: {formatDateTime(reservation.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="reservation-actions">
                      <button
                        onClick={() => handleApproval(reservation.id, true)}
                        className="approve-button"
                        title="Approve this reservation"
                      >
                        <span className="button-icon">✅</span>
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleApproval(reservation.id, false)}
                        className="reject-button"
                        title="Reject this reservation"
                      >
                        <span className="button-icon">❌</span>
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="reservation-details-card">
                    <h4 className="details-title">Reservation Details</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Reservation Date:</span>
                        <div className="detail-value">{formatDate(reservation.reserved_date || reservation.date)}</div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Slot Type:</span>
                        <div className="detail-value">{reservation.slot_type || "Regular"}</div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <div className="detail-value">
                          <span className="status-badge pending">{reservation.status}</span>
                        </div>
                      </div>
                      {reservation.park_slot_details && (
                        <div className="detail-item">
                          <span className="detail-label">Slot Details:</span>
                          <div className="detail-value">
                            {reservation.park_slot_details.structure} - Section {reservation.park_slot_details.section}
                          </div>
                        </div>
                      )}
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
