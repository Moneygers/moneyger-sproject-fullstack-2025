"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import {
  ArrowLeft,
  Building2,
  Car,
  CircleAlert,
  MapPin,
  Star,
  TriangleAlert,
  Accessibility,
  Sun,
  X,
  Eye,
} from "lucide-react"
import Footer from "../../components/Footer"
import "../../styles/customer/CustomerView.css"
import BASE_URL from "../../config"

const CustomerView = () => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showActiveReservationModal, setShowActiveReservationModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [reservationForm, setReservationForm] = useState({
    name: "",
    plateNumber: "",
    contactNumber: "",
  })
  const [formErrors, setFormErrors] = useState({})
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingReservation, setPendingReservation] = useState(null)
  const [loadingPending, setLoadingPending] = useState(false)

  // OTP verification states
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpCountdown, setOtpCountdown] = useState(0)

  // Search parking states
  const [searchPlateNumber, setSearchPlateNumber] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searchError, setSearchError] = useState("")

  // Search modal states
  const [showSearchResultModal, setShowSearchResultModal] = useState(false)
  const [showSearchErrorModal, setShowSearchErrorModal] = useState(false)

  useEffect(() => {
    fetchAvailableSlots()
    if (isAuthenticated && user && user.role === "customer") {
      fetchPendingReservation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

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
      console.log("Fetching slots from:", `${BASE_URL}/api/slots/`)
      const response = await fetch(`${BASE_URL}/api/slots/`)

      if (response.ok) {
        const data = await response.json()
        console.log("Slots fetched successfully:", data.length, "slots")
        setSlots(data)
      } else {
        console.error("Failed to fetch slots - Status:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error fetching slots:", error)
      console.error("This might be a network connectivity issue or CORS problem")
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingReservation = async () => {
    if (!isAuthenticated || !user || user.role !== "customer") {
      return
    }

    setLoadingPending(true)
    try {
      console.log("Fetching reservations from:", `${BASE_URL}/api/reservations/`)
      const response = await fetch(`${BASE_URL}/api/reservations/`)

      if (response.ok) {
        const data = await response.json()
        console.log("Reservations fetched successfully:", data.length, "reservations")
        const userReservation = data.find(
          (reservation) =>
            reservation.user === user.id &&
            (reservation.status === "pending" || reservation.status === "approved" || reservation.status === "arrived"),
        )
        console.log("User reservation found:", userReservation ? "Yes" : "No")
        setPendingReservation(userReservation || null)
      } else {
        console.error("Failed to fetch reservations - Status:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error fetching pending reservation:", error)
      console.error("This might be a network connectivity issue or CORS problem")
    } finally {
      setLoadingPending(false)
    }
  }

  const checkForActiveReservation = async () => {
    if (!isAuthenticated || !user || user.role !== "customer") {
      return null
    }

    try {
      const response = await fetch(`${BASE_URL}/api/reservations/`)
      if (response.ok) {
        const data = await response.json()
        const activeReservation = data.find(
          (reservation) =>
            reservation.user === user.id &&
            (reservation.status === "pending" || reservation.status === "approved" || reservation.status === "arrived"),
        )
        return activeReservation || null
      }
    } catch (error) {
      console.error("Error checking for active reservation:", error)
    }
    return null
  }

  const handleCancelReservation = async () => {
    if (!pendingReservation) return

    const confirmCancel = window.confirm("Are you sure you want to cancel this reservation?")
    if (!confirmCancel) return

    try {
      const response = await fetch(`${BASE_URL}/api/reservations/${pendingReservation.id}/cancel/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        await response.json()
        alert("Reservation cancelled successfully")
        setShowPendingModal(false)
        setPendingReservation(null)
        fetchAvailableSlots()
      } else {
        const errorData = await response.json()
        alert(`Failed to cancel reservation: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      alert("Failed to cancel reservation")
    }
  }

  const handleViewPendingReservation = () => {
    if (!isAuthenticated || !user || user.role !== "customer") {
      setShowLoginPrompt(true)
      return
    }

    fetchPendingReservation()
    setShowPendingModal(true)
  }

  const getFloorSlots = (floor) => {
    return slots
      .filter((slot) => {
        const floorNumber = Number.parseInt(slot.structure.replace("FLOOR", ""))
        return floorNumber === floor
      })
      .filter((slot) => slot.status === "available")
  }

  const getTotalFloorSlots = (floor) => {
    return slots
      .filter((slot) => {
        const floorNumber = Number.parseInt(slot.structure.replace("FLOOR", ""))
        return floorNumber === floor
      })
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
    if (slot.slot_type === "disabled") return <Accessibility size={16} />
    if (slot.slot_type === "vip") return <Star size={16} />
    return <Car size={16} />
  }

  const getSectionTitle = (section) => {
    const sectionMap = {
      A: "Section A",
      B: "Section B",
      C: "Section C",
    }
    return sectionMap[section] || section
  }

  const handleSlotClick = async (slot) => {
    if (slot.status === "available") {
      if (!isAuthenticated || !user || user.role !== "customer") {
        setSelectedSlot(slot)
        setShowLoginPrompt(true)
        return
      }

      const activeReservation = await checkForActiveReservation()
      if (activeReservation) {
        setSelectedSlot(slot)
        setShowActiveReservationModal(true)
        return
      }

      setSelectedSlot(slot)
      setShowReservationModal(true)
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

  const closeActiveReservationModal = () => {
    setShowActiveReservationModal(false)
    setSelectedSlot(null)
  }

  const closeModal = () => {
    setShowReservationModal(false)
    resetReservationForm()
  }

  const closeOTPModal = () => {
    setShowOTPModal(false)
    setOtpCode("")
    setOtpError("")
  }

  const validateName = (name) => {
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

    if (field === "name") {
      processedValue = value.replace(/[^a-zA-Z\s.]/g, "")
    } else if (field === "contactNumber") {
      processedValue = value.replace(/[^0-9]/g, "")
      if (processedValue.length > 11) {
        processedValue = processedValue.slice(0, 11)
      }
    } else if (field === "plateNumber") {
      processedValue = value.toUpperCase()
    }

    setReservationForm((prev) => ({ ...prev, [field]: processedValue }))

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const errors = {}

    const nameError = validateName(reservationForm.name)
    if (nameError) errors.name = nameError

    const contactError = validateContactNumber(reservationForm.contactNumber)
    if (contactError) errors.contactNumber = contactError

    const plateError = validatePlateNumber(reservationForm.plateNumber)
    if (plateError) errors.plateNumber = plateError

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const calculateDuration = (startTime) => {
    if (!startTime) return "N/A"
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const calculateFee = (startTime, slotType, parkingRates) => {
    if (!startTime || !parkingRates) return 0

    const start = new Date(startTime)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60))

    const initialFee = getInitialFee(slotType, parkingRates)
    const hourlyRate = parkingRates[slotType] || parkingRates.regular

    const additionalFee = diffMinutes * hourlyRate
    return initialFee + additionalFee
  }

  const getInitialFee = (slotType, parkingRates) => {
    if (!parkingRates) return 0

    if (slotType === "vip") return parkingRates.vip
    if (slotType === "disabled") return parkingRates.disabled
    return parkingRates.regular
  }

  const [parkingRates, setParkingRates] = useState(null)

  useEffect(() => {
    const fetchParkingRates = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/settings/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const settings = await response.json()
          const rates = {
            regular: Number(settings.regularHourlyRate),
            vip: Number(settings.vipHourlyRate),
            disabled: Number(settings.disabledHourlyRate),
          }
          setParkingRates(rates)
        }
      } catch (error) {
        console.error("Failed to fetch parking rates", error)
      }
    }

    fetchParkingRates()
  }, [])

  const handleReservationSubmit = async () => {
    if (!validateForm()) {
      return
    }

    if (!selectedSlot) {
      alert("No slot selected")
      return
    }

    if (!otpVerified) {
      const phoneError = validateContactNumber(reservationForm.contactNumber)
      if (phoneError) {
        setFormErrors((prev) => ({ ...prev, contactNumber: phoneError }))
        return
      }

      setShowOTPModal(true)
      return
    }

    await submitReservationAfterOTP()
  }

  const sendOTP = async () => {
    if (!reservationForm.contactNumber.trim()) {
      setOtpError("Please enter your contact number first")
      return
    }

    const phoneError = validateContactNumber(reservationForm.contactNumber)
    if (phoneError) {
      setOtpError(phoneError)
      return
    }

    setOtpLoading(true)
    setOtpError("")

    try {
      const response = await fetch(`${BASE_URL}/api/otp/send/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: reservationForm.contactNumber.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setOtpSent(true)
        setOtpCountdown(120)
        alert("OTP sent successfully! Please check your phone.")

        const timer = setInterval(() => {
          setOtpCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setOtpError(data.message || "Failed to send OTP")
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      setOtpError("Failed to send OTP. Please try again.")
    } finally {
      setOtpLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!otpCode.trim()) {
      setOtpError("Please enter the OTP code")
      return
    }

    if (otpCode.length !== 6) {
      setOtpError("OTP must be 6 digits")
      return
    }

    setOtpLoading(true)
    setOtpError("")

    try {
      const response = await fetch(`${BASE_URL}/api/otp/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: reservationForm.contactNumber.trim(),
          otp_code: otpCode.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.verified) {
        setOtpVerified(true)
        setShowOTPModal(false)
        alert("Phone number verified successfully!")
        await submitReservationAfterOTP()
      } else {
        setOtpError(data.message || "Invalid OTP code")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      setOtpError("Failed to verify OTP. Please try again.")
    } finally {
      setOtpLoading(false)
    }
  }

  const submitReservationAfterOTP = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/reservations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          park_slot: selectedSlot.id,
          user: user.id,
          name: reservationForm.name.trim(),
          plate_no: reservationForm.plateNumber.trim(),
          mobileNo: reservationForm.contactNumber.trim(),
          date: new Date().toISOString().split("T")[0],
        }),
      })

      if (response.ok) {
        await response.json()
        alert(
          `Reservation created successfully for slot F${Number.parseInt(selectedSlot.structure.replace("FLOOR", ""))}-${selectedSlot.section}-${selectedSlot.slotNo}`,
        )
        setShowReservationModal(false)
        resetReservationForm()
        fetchAvailableSlots()
        fetchPendingReservation()
      } else {
        const errorData = await response.json()
        alert(`Failed to create reservation: ${errorData.detail || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error creating reservation:", error)
      alert("Failed to create reservation")
    }
  }

  const resetReservationForm = () => {
    setReservationForm({ name: "", plateNumber: "", contactNumber: "" })
    setFormErrors({})
    setSelectedSlot(null)
    setOtpCode("")
    setOtpSent(false)
    setOtpVerified(false)
    setOtpError("")
    setOtpCountdown(0)
  }

  const handleSearchParking = async () => {
    if (!searchPlateNumber.trim()) {
      setSearchError("Please enter a plate number")
      setShowSearchErrorModal(true)
      return
    }

    setSearchLoading(true)
    setSearchError("")
    setSearchResults(null)

    try {
      const response = await fetch(`${BASE_URL}/api/search-parking/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plate_number: searchPlateNumber.trim().toUpperCase(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (data.found) {
          setSearchResults(data.data)
          setShowSearchResultModal(true)
        } else {
          setSearchError(data.message)
          setShowSearchErrorModal(true)
        }
      } else {
        setSearchError(data.message || "Failed to search for parking details")
        setShowSearchErrorModal(true)
      }
    } catch (error) {
      console.error("Error searching parking:", error)
      setSearchError("Failed to search for parking details. Please try again.")
      setShowSearchErrorModal(true)
    } finally {
      setSearchLoading(false)
    }
  }

  const resetSearch = () => {
    setSearchPlateNumber("")
    setSearchResults(null)
    setSearchError("")
    setSearchLoading(false)
    setShowSearchResultModal(false)
    setShowSearchErrorModal(false)
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
  const availableCount = currentFloorSlots.length

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
                <ArrowLeft size={20} className="back-icon" />
                <span>Back to Login</span>
              </button>
            )}
            <div className="header-divider"></div>
            <div className="brand-section">
              <div className="brand-icon">
                <img src="/favicon.png" alt="Park Moneyger Logo" className="logo-image" />
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
        {/* Search Bar Section - Only visible for guests */}
        {(!isAuthenticated || user?.role !== "customer") && (
          <div className="search-parking-section">
            <div className="search-container">
              <div className="search-info">
                <h3 className="search-title">🔍 Search for Your Parking Slot</h3>
                <p className="search-subtitle">
                  Enter your plate number to quickly find your assigned slot and parking details
                </p>
              </div>
              <div className="search-form">
                <input
                  type="text"
                  placeholder="Enter plate number (e.g., ABC-1234)"
                  value={searchPlateNumber}
                  onChange={(e) => setSearchPlateNumber(e.target.value.toUpperCase())}
                  className="search-input"
                  maxLength={15}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && searchPlateNumber.trim()) {
                      handleSearchParking()
                    }
                  }}
                />
                <button
                  onClick={handleSearchParking}
                  className="search-button"
                  disabled={searchLoading || !searchPlateNumber.trim()}
                >
                  {searchLoading ? "Searching..." : "Search for Slot"}
                </button>
                <button onClick={resetSearch} className="search-button search-clear-button">
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

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
                  <span className="floor-icon">
                    {floor === 1 ? <Building2 size={20} /> : floor === 4 ? <Sun size={20} /> : <Car size={20} />}
                  </span>
                  <span className="floor-name">
                    {floor === 1 ? "Floor 1" : floor === 4 ? "Floor 4" : `Floor ${floor}`}
                  </span>
                </div>
                <div className="floor-available-count">
                  {getFloorSlots(floor).length} available
                </div>
              </button>
            ))}
            {isAuthenticated && user?.role === "customer" && (
              <button onClick={handleViewPendingReservation} className="view-pending-button" disabled={loadingPending}>
                <Eye size={20} className="pending-icon" />
                <span>{loadingPending ? "Loading..." : "View Active Reservation"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Floor Layout */}
        <div className="customer-floor-layout">
          <div className="floor-layout-header">
            <h2 className="floor-layout-title">
              <Building2 size={24} style={{ marginRight: "8px", display: "inline" }} />
              {selectedFloor === 1 ? "Floor 1" : selectedFloor === 4 ? "Floor 4" : `Floor ${selectedFloor}`}
            </h2>
            <p className="floor-layout-subtitle">
              {availableCount} available slots out of {getTotalFloorSlots(selectedFloor).length} total
            </p>
            <p className="click-instruction">
              {isAuthenticated && user?.role === "customer"
                ? "Click on any available slot to make a reservation"
                : "Login as a customer to make reservations"}
            </p>
          </div>

          {Object.keys(sectionedSlots).length === 0 ? (
            <div className="no-available-slots">
              <div className="no-slots-icon">
                <Car size={48} />
              </div>
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
            <div className="info-icon">
              <MapPin size={32} />
            </div>
            <div className="info-text">
              <h3 className="info-title">Need to Park?</h3>
              <p className="info-description">
                {isAuthenticated && user?.role === "customer"
                  ? "Click on any available slot above to make a reservation, or visit our front desk for immediate parking."
                  : "Login as a customer to make reservations, or visit our front desk for immediate parking."}
              </p>
              <div className="info-details">
                <p>• Payment accepted: Cash, GCash</p>
                <p>• Per-minute rates apply based on slot type</p>
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
              <h3 className="modal-title">Login Required!</h3>
              <button onClick={closeLoginPrompt} className="modal-close">
                ✕
              </button>
            </div>

            <div className="login-prompt-content">
              <h4>
                <CircleAlert size={20} className="login-prompt-icon" />
                Customer Login Required!
              </h4>
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

      {/* Only One Reservation Modal */}
      {showActiveReservationModal && selectedSlot && (
        <div className="modal-overlay">
          <div className="reservation-modal">
            <div className="modal-header">
              <h3 className="modal-title">Reservation Limit Reached</h3>
              <button onClick={closeActiveReservationModal} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="login-prompt-content">
              <h4>
                <TriangleAlert size={20} className="login-prompt-icon" />
                Only One Reservation Allowed
              </h4>
              <p>You already have an active reservation. Only one reservation can be made at a time.</p>
              <p>
                You tried to reserve slot{" "}
                {`F${Number.parseInt(selectedSlot.structure.replace("FLOOR", ""))}-${selectedSlot.section}-${selectedSlot.slotNo}`}
                , but you need to cancel your current reservation first.
              </p>
              <p>
                You can view and manage your current reservation by clicking the "View Pending Reservation" button
                above.
              </p>
            </div>

            <div className="modal-actions">
              <button onClick={closeActiveReservationModal} className="modal-cancel">
                Close
              </button>
              <button
                onClick={() => {
                  closeActiveReservationModal()
                  handleViewPendingReservation()
                }}
                className="modal-submit"
              >
                View My Reservation
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
                <X size={20} />
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
                  className={`modal-input ${formErrors.name ? "error" : ""}`}
                  value={reservationForm.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  style={{ backgroundColor: "#111", color: "#fff" }}
                />
                {formErrors.name && <div className="error-message">{formErrors.name}</div>}
                <div className="input-hint">Auto-filled from your account. You may edit if needed.</div>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">
                  Contact Number
                  {otpVerified && <span style={{ color: "#22c55e", marginLeft: "8px" }}>✓ Verified</span>}
                </label>
                <input
                  type="tel"
                  className={`modal-input ${formErrors.contactNumber ? "error" : ""} ${otpVerified ? "verified" : ""}`}
                  value={reservationForm.contactNumber}
                  onChange={(e) => {
                    handleInputChange("contactNumber", e.target.value)
                    if (otpVerified) {
                      setOtpVerified(false)
                      setOtpSent(false)
                    }
                  }}
                  style={{ backgroundColor: "#111", color: "#fff" }}
                />
                {formErrors.contactNumber && <div className="error-message">{formErrors.contactNumber}</div>}
                <div className="input-hint">
                  {otpVerified
                    ? "Phone number verified. You can proceed with reservation."
                    : "Auto-filled from your account. You may edit if needed."}
                </div>
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
                  style={{ backgroundColor: "#111", color: "#fff" }}
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
                disabled={!reservationForm.plateNumber || !reservationForm.name || !reservationForm.contactNumber}
                className="modal-submit"
              >
                {otpVerified ? "Reserve Slot" : "Verify Phone & Reserve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="modal-overlay">
          <div className="reservation-modal">
            <div className="modal-header">
              <h3 className="modal-title">Verify Phone Number</h3>
              <button onClick={closeOTPModal} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="otp-verification-content">
              <div className="otp-info">
                <p>We need to verify your phone number before proceeding with the reservation.</p>
                <p>
                  <strong>Phone: {reservationForm.contactNumber}</strong>
                </p>
              </div>

              {!otpSent ? (
                <div className="otp-send-section">
                  <p>Click the button below to receive a verification code via SMS.</p>
                  <button onClick={sendOTP} disabled={otpLoading} className="otp-send-button">
                    {otpLoading ? "Sending..." : "Send Verification Code"}
                  </button>
                </div>
              ) : (
                <div className="otp-verify-section">
                  <p>Enter the 6-digit code sent to your phone:</p>
                  <div className="otp-input-group">
                    <input
                      type="text"
                      className="otp-input"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "")
                        if (value.length <= 6) {
                          setOtpCode(value)
                          setOtpError("")
                        }
                      }}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      style={{
                        backgroundColor: "#111",
                        color: "#fff",
                        textAlign: "center",
                        fontSize: "18px",
                        letterSpacing: "4px",
                      }}
                    />
                  </div>

                  <div className="otp-actions">
                    <button
                      onClick={verifyOTP}
                      disabled={otpLoading || otpCode.length !== 6}
                      className="otp-verify-button"
                    >
                      {otpLoading ? "Verifying..." : "Verify Code"}
                    </button>

                    <button onClick={sendOTP} disabled={otpLoading || otpCountdown > 0} className="otp-resend-button">
                      {otpCountdown > 0
                        ? `Resend in ${Math.floor(otpCountdown / 60)}:${String(otpCountdown % 60).padStart(2, "0")}`
                        : "Resend Code"}
                    </button>
                  </div>
                </div>
              )}

              {otpError && (
                <div className="error-message" style={{ marginTop: "10px", textAlign: "center" }}>
                  {otpError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Your Reservation Modal */}
      {showPendingModal && (
        <div className="modal-overlay">
          <div className="reservation-modal">
            <div className="modal-header">
              <h3 className="modal-title">Your Reservation</h3>
              <button onClick={() => setShowPendingModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {loadingPending ? (
              <div className="loading-content">
                <div className="spinner"></div>
                <p>Loading your reservation...</p>
              </div>
            ) : pendingReservation ? (
              <>
                <div className="slot-details">
                  <div className="slot-details-title">
                    <strong>Reservation Details:</strong>
                  </div>
                  <div className="slot-details-info">
                    Slot:{" "}
                    {pendingReservation.park_slot_details
                      ? `F${Number.parseInt(pendingReservation.park_slot_details.structure.replace("FLOOR", ""))}-${pendingReservation.park_slot_details.section}-${pendingReservation.park_slot_details.slotNo}`
                      : "N/A"}{" "}
                    • Status:{" "}
                    <span className={`status-badge status-${pendingReservation.status}`}>
                      {pendingReservation.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="reservation-info">
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{pendingReservation.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Plate Number:</span>
                    <span className="info-value">{pendingReservation.plate_no}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Contact:</span>
                    <span className="info-value">{pendingReservation.mobileNo}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{new Date(pendingReservation.date).toLocaleDateString()}</span>
                  </div>
                  {pendingReservation.arrival_time && (
                    <div className="info-row">
                      <span className="info-label">Arrival Time:</span>
                      <span className="info-value">{new Date(pendingReservation.arrival_time).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Duration:</span>
                    <span className="info-value">{calculateDuration(pendingReservation.arrival_time)}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Ongoing Fee:</span>
                    <span className="info-value">
                      ₱
                      {parkingRates
                        ? calculateFee(
                            pendingReservation.arrival_time,
                            pendingReservation.slot_type,
                            parkingRates,
                          ).toFixed(2)
                        : "Loading..."}
                    </span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button onClick={() => setShowPendingModal(false)} className="modal-cancel">
                    Close
                  </button>
                  {(pendingReservation.status === "pending" || pendingReservation.status === "approved") && (
                    <button onClick={handleCancelReservation} className="modal-delete">
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="no-reservation-content">
                <div className="no-reservation-icon">📋</div>
                <h4>No Active Reservations</h4>
                <p>You don't have any active/pending reservations at the moment.</p>
                <div className="modal-actions">
                  <button onClick={() => setShowPendingModal(false)} className="modal-submit">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Result Success Modal - Full Screen Popup */}
      {showSearchResultModal && searchResults && (
        <div className="modal-overlay">
          <div className="search-result-modal">
            <div className="modal-header">
              <h3 className="modal-title search-success-title">✅ Vehicle Found</h3>
              <button onClick={() => setShowSearchResultModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="search-result-content">
              <div className="search-result-info">
                <div className="info-row">
                  <span className="info-label">Assigned Slot:</span>
                  <span className="info-value highlight">{searchResults.assigned_slot}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Plate Number:</span>
                  <span className="info-value">{searchResults.plate_number}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Arrival Time:</span>
                  <span className="info-value">{searchResults.arrival_time}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Duration of Stay:</span>
                  <span className="info-value">{searchResults.duration}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ongoing Parking Fee:</span>
                  <span className="info-value highlight">{searchResults.ongoing_fee}</span>
                </div>
                {searchResults.customer_name && (
                  <div className="info-row">
                    <span className="info-label">Customer Name:</span>
                    <span className="info-value">{searchResults.customer_name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowSearchResultModal(false)} className="modal-submit">
                Close
              </button>
              <button onClick={resetSearch} className="modal-cancel">
                Search Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Result Error Modal - Full Screen Popup */}
      {showSearchErrorModal && (
        <div className="modal-overlay">
          <div className="search-result-modal">
            <div className="modal-header">
              <h3 className="modal-title search-error-title">❌ No Vehicle Found</h3>
              <button onClick={() => setShowSearchErrorModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="search-result-content">
              <div className="search-error-info">
                <p className="error-message-text">{searchError}</p>
                <p className="error-help-text">
                  Please check the plate number and try again, or contact the front desk for assistance.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowSearchErrorModal(false)} className="modal-submit">
                Close
              </button>
              <button onClick={resetSearch} className="modal-cancel">
                Try Again
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
