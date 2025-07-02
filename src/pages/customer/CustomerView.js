"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../../styles/customer/CustomerView.css"

const CustomerView = () => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [reservationForm, setReservationForm] = useState({
    name: "",
    plateNumber: "",
    contactNumber: "",
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchAvailableSlots()
  }, [])

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/slots/")

      if (response.ok) {
        const data = await response.json()
        setSlots(data)
      } else {
        console.error("Failed to fetch slots")
      }
    } catch (error) {
      console.error("Error fetching slots:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFloorSlots = (floor) => {
    return slots
      .filter((slot) => {
        const floorNumber = Number.parseInt(slot.structure.replace("FLOOR", ""))
        return floorNumber === floor
      })
      .filter((slot) => slot.status === "available")
  }

  const getSlotsBySection = (floorSlots) => {
    const sections = {}
    floorSlots.forEach((slot) => {
      if (!sections[slot.section]) {
        sections[slot.section] = []
      }
      sections[slot.section].push(slot)
    })
    return sections
  }

  const getSlotColor = (slot) => {
    if (slot.status === "available") {
      if (slot.slot_type === "vip") return "customer-slot-vip"
      if (slot.slot_type === "disabled") return "customer-slot-disabled"
      return "customer-slot-available"
    }
    return "customer-slot-occupied"
  }

  const getSlotIcon = (slot) => {
    if (slot.slot_type === "disabled") return "♿"
    if (slot.slot_type === "vip") return "⭐"
    return "🅿️"
  }

  const getSectionTitle = (section) => {
    const sectionMap = {
      A: "Section A",
      B: "Section B",
      C: "Section C",
    }
    return sectionMap[section] || section
  }

  const handleSlotClick = (slot) => {
    if (slot.status === "available") {
      setSelectedSlot(slot)
      setShowReservationModal(true)
    }
  }

  const handleReservationSubmit = async () => {
    if (!selectedSlot || !reservationForm.name || !reservationForm.plateNumber || !reservationForm.contactNumber) {
      alert("Please fill in all fields")
      return
    }

    try {
      const response = await fetch("http://localhost:8000/api/reservations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          park_slot: selectedSlot.id,
          name: reservationForm.name,
          plate_no: reservationForm.plateNumber,
          mobileNo: reservationForm.contactNumber,
          date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(
          `Reservation created successfully for slot F${Number.parseInt(selectedSlot.structure.replace("FLOOR", ""))}-${selectedSlot.section}-${selectedSlot.slotNo}`,
        )
        setShowReservationModal(false)
        setReservationForm({ name: "", plateNumber: "", contactNumber: "" })
        setSelectedSlot(null)
        fetchAvailableSlots() // Refresh slots
      } else {
        const errorData = await response.json()
        alert(`Failed to create reservation: ${errorData.detail || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error creating reservation:", error)
      alert("Failed to create reservation")
    }
  }

  if (loading) {
    return (
      <div className="customer-view-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  const currentFloorSlots = getFloorSlots(selectedFloor)
  const sectionedSlots = getSlotsBySection(currentFloorSlots)
  const availableCount = currentFloorSlots.filter((slot) => slot.status === "available").length

  return (
    <div className="customer-view-container">
      {/* Header */}
      <div className="customer-header">
        <div className="customer-header-content">
          <div className="header-left">
            <button onClick={() => navigate("/login")} className="back-to-login">
              <span className="back-icon">←</span>
              <span>Back to Login</span>
            </button>
            <div className="header-divider"></div>
            <div className="brand-section">
              <div className="brand-icon">🚗</div>
              <div className="brand-info">
                <h1 className="brand-title">ParkManager</h1>
                <p className="brand-subtitle">Customer View - Available Parking Slots</p>
              </div>
            </div>
          </div>

          <div className="available-counter">
            <div className="counter-number">{availableCount}</div>
            <div className="counter-label">Available Slots</div>
          </div>
        </div>
      </div>

      <div className="customer-content">
        {/* Floor Selector */}
        <div className="customer-floor-selector">
          <div className="floor-selector-content">
            {[1, 2, 3, 4].map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`customer-floor-button ${selectedFloor === floor ? "active" : ""}`}
              >
                <div className="floor-button-content">
                  <span className="floor-icon">{floor === 1 ? "🏢" : floor === 4 ? "☀️" : "🅿️"}</span>
                  <span className="floor-name">
                    {floor === 1 ? "Floor 1" : floor === 4 ? "Floor 4" : `Floor ${floor}`}
                  </span>
                </div>
                <div className="floor-available-count">
                  {getFloorSlots(floor).filter((s) => s.status === "available").length} available
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Floor Layout */}
        <div className="customer-floor-layout">
          <div className="floor-layout-header">
            <h2 className="floor-layout-title">
              {selectedFloor === 1 ? "🏢 Floor 1" : selectedFloor === 4 ? "🏢 Floor 4" : `🏢 Floor ${selectedFloor}`}
            </h2>
            <p className="floor-layout-subtitle">
              {availableCount} available slots out of {currentFloorSlots.length} total
            </p>
            <p className="click-instruction">Click on any available slot to make a reservation</p>
          </div>

          {Object.keys(sectionedSlots).length === 0 ? (
            <div className="no-available-slots">
              <div className="no-slots-icon">🚗</div>
              <h3 className="no-slots-title">No Available Slots</h3>
              <p className="no-slots-text">All slots on this floor are currently occupied.</p>
            </div>
          ) : (
            <div className="customer-sections">
              {Object.entries(sectionedSlots).map(([section, sectionSlots]) => (
                <div key={section} className="customer-section">
                  <div className="customer-section-header">
                    <span className="section-title">{getSectionTitle(section)}</span>
                    <span className="section-count">({sectionSlots.length} slots available)</span>
                  </div>

                  <div className="customer-slots-grid">
                    {sectionSlots.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className={`customer-slot ${getSlotColor(slot)} ${
                          slot.status === "available" ? "clickable" : ""
                        }`}
                      >
                        <div className="customer-slot-id">{`F${Number.parseInt(slot.structure.replace("FLOOR", ""))}-${slot.section}-${slot.slotNo}`}</div>
                        <div className="customer-slot-icon">{getSlotIcon(slot)}</div>
                        <div className="customer-slot-type">
                          {slot.slot_type === "vip" ? "VIP" : slot.slot_type === "disabled" ? "DISABLED" : "AVAILABLE"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="customer-legend">
          <h3 className="legend-title">Legend</h3>
          <div className="legend-grid">
            <div className="legend-item">
              <div className="legend-color customer-slot-available"></div>
              <span className="legend-text">Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-color customer-slot-vip"></div>
              <span className="legend-text">VIP Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-color customer-slot-disabled"></div>
              <span className="legend-text">Disabled Access</span>
            </div>
            <div className="legend-item">
              <div className="legend-color customer-slot-occupied"></div>
              <span className="legend-text">Occupied</span>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="customer-info-card">
          <div className="info-card-content">
            <div className="info-icon">📍</div>
            <div className="info-text">
              <h3 className="info-title">Need to Park?</h3>
              <p className="info-description">
                Click on any available slot above to make a reservation, or visit our front desk for immediate parking.
              </p>
              <div className="info-details">
                <p>• Payment accepted: Cash, Card, GCash, PayMaya</p>
                <p>• Hourly rates apply based on slot type</p>
                <p>• VIP slots include premium amenities</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && selectedSlot && (
        <div className="modal-overlay">
          <div className="reservation-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                Reserve Slot{" "}
                {`F${Number.parseInt(selectedSlot.structure.replace("FLOOR", ""))}-${selectedSlot.section}-${selectedSlot.slotNo}`}
              </h3>
              <button
                onClick={() => {
                  setShowReservationModal(false)
                  setReservationForm({ name: "", plateNumber: "", contactNumber: "" })
                  setSelectedSlot(null)
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="slot-details">
              <div className="slot-details-title">
                <strong>Slot Details:</strong>
              </div>
              <div className="slot-details-info">
                Floor {Number.parseInt(selectedSlot.structure.replace("FLOOR", ""))} • Section {selectedSlot.section} •
                {selectedSlot.slot_type === "vip"
                  ? " VIP Slot"
                  : selectedSlot.slot_type === "disabled"
                    ? " Disabled Access"
                    : " Regular Slot"}
              </div>
            </div>

            <div className="modal-form">
              <div className="modal-form-group">
                <label className="modal-label">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="modal-input"
                  value={reservationForm.name}
                  onChange={(e) => setReservationForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Plate Number *</label>
                <input
                  type="text"
                  placeholder="ABC-1234"
                  className="modal-input"
                  value={reservationForm.plateNumber}
                  onChange={(e) =>
                    setReservationForm((prev) => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))
                  }
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Contact Number *</label>
                <input
                  type="tel"
                  placeholder="09123456789"
                  className="modal-input"
                  value={reservationForm.contactNumber}
                  onChange={(e) => setReservationForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowReservationModal(false)
                  setReservationForm({ name: "", plateNumber: "", contactNumber: "" })
                  setSelectedSlot(null)
                }}
                className="modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleReservationSubmit}
                disabled={!reservationForm.name || !reservationForm.plateNumber || !reservationForm.contactNumber}
                className="modal-submit"
              >
                Reserve Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerView
