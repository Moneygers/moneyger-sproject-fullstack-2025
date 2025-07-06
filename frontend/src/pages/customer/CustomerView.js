"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import Footer from "../../components/Footer"
import "../../styles/customer/CustomerView.css"

const CustomerView = () => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [reservationForm, setReservationForm] = useState({
    name: "",
    plateNumber: "",
    contactNumber: "",
  })
  const [formErrors, setFormErrors] = useState({})
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    fetchAvailableSlots()
  }, [])

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    if (user && isAuthenticated && user.role === "customer") {
      setReservationForm((prev) => ({
        ...prev,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "",
        contactNumber: user.phone_no || "",
      }))
    }
  }, [user, isAuthenticated])

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
      // Check if user is authenticated and has customer role
      if (!isAuthenticated || !user || user.role !== "customer") {
        setSelectedSlot(slot)
        setShowLoginPrompt(true)
        return
      }

      // User is authenticated as customer, proceed with reservation
      setSelectedSlot(slot)
      setShowReservationModal(true)
      // Auto-populate form with user data and reset only plate number
      setReservationForm({
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "",
        plateNumber: "",
        contactNumber: user.phone_no || "",
      })
      setFormErrors({})
    }
  }

  const handleLoginRedirect = () => {
    navigate("/login")
  }

  const closeLoginPrompt = () => {
    setShowLoginPrompt(false)
    setSelectedSlot(null)
  }

  // Validation functions
  const validateName = (name) => {
    // Allow letters, spaces, and periods (for middle initials like "John M. Doe")
    const nameRegex = /^[a-zA-Z\s.]+$/
    if (!name.trim()) {
      return "Full name is required"
    }
    if (!nameRegex.test(name.trim())) {
      return "Name should contain only letters, spaces, and periods"
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long"
    }
    // Check for excessive periods (more than 3 periods might be suspicious)
    const periodCount = (name.match(/\./g) || []).length
    if (periodCount > 3) {
      return "Too many periods in name"
    }
    return ""
  }

  const validatePlateNumber = (plateNumber) => {
    if (!plateNumber.trim()) {
      return "Plate number is required"
    }
    if (plateNumber.trim().length < 3) {
      return "Plate number must be at least 3 characters long"
    }
    return ""
  }

  const validateContactNumber = (contactNumber) => {
    const phoneRegex = /^09\d{9}$/
    if (!contactNumber.trim()) {
      return "Contact number is required"
    }
    if (!phoneRegex.test(contactNumber.trim())) {
      return "Please enter a valid Philippine mobile number (09XXXXXXXXX)"
    }
    return ""
  }

  const handleInputChange = (field, value) => {
    let processedValue = value

    // Process input based on field type
    if (field === "name") {
      // Allow only letters, spaces, and periods for name (for middle initials)
      processedValue = value.replace(/[^a-zA-Z\s.]/g, "")
    } else if (field === "contactNumber") {
      // Allow only numbers for contact number
      processedValue = value.replace(/[^0-9]/g, "")
      // Limit to 11 digits
      if (processedValue.length > 11) {
        processedValue = processedValue.slice(0, 11)
      }
    } else if (field === "plateNumber") {
      // Convert to uppercase for plate number
      processedValue = value.toUpperCase()
    }

    setReservationForm((prev) => ({ ...prev, [field]: processedValue }))

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const errors = {}

    const plateError = validatePlateNumber(reservationForm.plateNumber)
    if (plateError) errors.plateNumber = plateError

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleReservationSubmit = async () => {
    if (!validateForm()) {
      return
    }

    if (!selectedSlot) {
      alert("No slot selected")
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
          name: reservationForm.name.trim(),
          plate_no: reservationForm.plateNumber.trim(),
          mobileNo: reservationForm.contactNumber.trim(),
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
        setFormErrors({})
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

  const closeModal = () => {
    setShowReservationModal(false)
    setReservationForm({ name: "", plateNumber: "", contactNumber: "" })
    setFormErrors({})
    setSelectedSlot(null)
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
            {isAuthenticated && user?.role === "customer" ? (
              <button
                onClick={() => {
                  logout()
                  navigate("/login")
                }}
                className="back-to-login"
              >
                <span className="back-icon">←</span>
                <span>Logout</span>
              </button>
            ) : (
              <button onClick={() => navigate("/login")} className="back-to-login">
                <span className="back-icon">←</span>
                <span>Back to Login</span>
              </button>
            )}
            <div className="header-divider"></div>
            <div className="brand-section">
              <div className="brand-icon">
                <img src="/favicon2.png" alt="Park Moneyger Logo" className="logo-image" />
              </div>
              <div className="brand-info">
                <h1 className="brand-title">ParkMoneyger</h1>
                <p className="brand-subtitle">
                  {isAuthenticated && user?.role === "customer"
                    ? `Welcome, ${user.first_name || user.username}! - Available Parking Slots`
                    : "Customer View - Available Parking Slots (Guest Mode)"}
                </p>
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
            <p className="click-instruction">
              {isAuthenticated && user?.role === "customer"
                ? "Click on any available slot to make a reservation"
                : "Login as a customer to make reservations"}
            </p>
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
                          {slot.slot_type === "vip" ? "VIP" : slot.slot_type === "disabled" ? "PWD" : "AVAILABLE"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="customer-info-card">
          <div className="info-card-content">
            <div className="info-icon">📍</div>
            <div className="info-text">
              <h3 className="info-title">Need to Park?</h3>
              <p className="info-description">
                {isAuthenticated && user?.role === "customer"
                  ? "Click on any available slot above to make a reservation, or visit our front desk for immediate parking."
                  : "Login as a customer to make reservations, or visit our front desk for immediate parking."}
              </p>
              <div className="info-details">
                <p>• Payment accepted: Cash, GCash</p>
                <p>• Hourly rates apply based on slot type</p>
                <p>• VIP slots include premium amenities</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && selectedSlot && (
        <div className="modal-overlay">
          <div className="reservation-modal">
            <div className="modal-header">
              <h3 className="modal-title">Login Required</h3>
              <button onClick={closeLoginPrompt} className="modal-close">
                ✕
              </button>
            </div>

            <div className="login-prompt-content">
              <div className="login-prompt-icon">🔒</div>
              <h4>Customer Login Required</h4>
              <p>
                To reserve slot{" "}
                {`F${Number.parseInt(selectedSlot.structure.replace("FLOOR", ""))}-${selectedSlot.section}-${selectedSlot.slotNo}`}
                , you need to login as a customer.
              </p>
              <p>Don't have an account? You can create one on the login page.</p>
            </div>

            <div className="modal-actions">
              <button onClick={closeLoginPrompt} className="modal-cancel">
                Cancel
              </button>
              <button onClick={handleLoginRedirect} className="modal-submit">
                Login / Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && selectedSlot && (
        <div className="modal-overlay">
          <div className="reservation-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                Reserve Slot{" "}
                {`F${Number.parseInt(selectedSlot.structure.replace("FLOOR", ""))}-${selectedSlot.section}-${selectedSlot.slotNo}`}
              </h3>
              <button onClick={closeModal} className="modal-close">
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
                    ? " PWD Slot"
                    : " Regular Slot"}
              </div>
            </div>

            <div className="modal-form">
              <div className="modal-form-group">
                <label className="modal-label">Full Name</label>
                <input
                  type="text"
                  className="modal-input readonly"
                  value={reservationForm.name}
                  readOnly
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                />
                <div className="input-hint">Auto-filled from your account</div>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Contact Number</label>
                <input
                  type="tel"
                  className="modal-input readonly"
                  value={reservationForm.contactNumber}
                  readOnly
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                />
                <div className="input-hint">Auto-filled from your account</div>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Plate Number *</label>
                <input
                  type="text"
                  placeholder="ABC-1234"
                  className={`modal-input ${formErrors.plateNumber ? "error" : ""}`}
                  value={reservationForm.plateNumber}
                  onChange={(e) => handleInputChange("plateNumber", e.target.value)}
                  maxLength={8}
                />
                {formErrors.plateNumber && <div className="error-message">{formErrors.plateNumber}</div>}
                <div className="input-hint">Enter your vehicle's license plate number</div>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={closeModal} className="modal-cancel">
                Cancel
              </button>
              <button
                onClick={handleReservationSubmit}
                disabled={!reservationForm.plateNumber}
                className="modal-submit"
              >
                Reserve Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default CustomerView
