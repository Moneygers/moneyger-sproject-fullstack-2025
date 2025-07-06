"use client"

import { useState, useEffect } from "react"
import { Clock, CheckCircle, AlertTriangle, RotateCcw } from "lucide-react"
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
            <div className="error-icon">
              <AlertTriangle size={48} />
            </div>
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
            <RotateCcw size={16} /> Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">
              <Clock size={24} />
            </div>
            <div className="summary-info">
              <div className="summary-label">Pending Approvals</div>
              <div className="summary-value">{pendingReservations.length}</div>
            </div>
          </div>
        </div>

        {/* Pending Reservations Table */}
        <div className="reservations-section">
          <div className="section-header">
            <h2 className="section-title">Pending Reservations</h2>
          </div>

          {pendingReservations.length === 0 ? (
            <div className="no-reservations">
              <div className="no-reservations-icon">
                <CheckCircle size={48} />
              </div>
              <h3 className="no-reservations-title">No pending reservations</h3>
              <p className="no-reservations-text">All reservations have been processed.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="reservations-table">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Plate No</th>
                    <th>Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <div className="slot-info">
                          <span className="slot-id">{reservation.slot || `Slot ${reservation.park_slot}`}</span>
                        </div>
                      </td>
                      <td>
                        <div className="customer-info">
                          <span className="customer-name">{reservation.customer_name || reservation.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="phone-number">{reservation.phone_number || reservation.mobileNo}</span>
                      </td>
                      <td>
                        <span className="plate-number">{reservation.plate_no}</span>
                      </td>
                      <td>
                        <div className="reservation-details">
                          <div className="detail-item">
                            <span className="detail-label">Reservation Date:</span>
                            <span className="detail-value">
                              {formatDate(reservation.reserved_date || reservation.date)}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Slot Type:</span>
                            <span className="detail-value">{reservation.slot_type || "Regular"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Status:</span>
                            <span className="detail-value">
                              <span className="status-badge pending">{reservation.status}</span>
                            </span>
                          </div>
                          {reservation.park_slot_details && (
                            <div className="detail-item">
                              <span className="detail-label">Slot Details:</span>
                              <span className="detail-value">
                                {reservation.park_slot_details.structure} - Section{" "}
                                {reservation.park_slot_details.section}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleApproval(reservation.id, true)}
                            className="approve-button"
                            title="Approve this reservation"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproval(reservation.id, false)}
                            className="reject-button"
                            title="Reject this reservation"
                          >
                            Reject
                          </button>
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

export default ApproveReservations
