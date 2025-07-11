"use client"

import { useState, useEffect } from "react"
import { Car, RotateCcw, Star, Accessibility, Printer } from 'lucide-react'
import "../../styles/clerk/UpdateSlots.css"
import Layout from "../../components/Layout"
import BASE_URL from "../../config"

const UpdateSlots = () => {
  const [slots, setSlots] = useState([])
  const [filteredSlots, setFilteredSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [floorFilter, setFloorFilter] = useState("1")
  const [showPlateModal, setShowPlateModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [plateNumber, setPlateNumber] = useState("")
  const [plateError, setPlateError] = useState("")
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [assignmentResult, setAssignmentResult] = useState(null)

  useEffect(() => {
    fetchSlots()
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    filterSlots()
  }, [slots, searchTerm, statusFilter, floorFilter])

  const fetchSlots = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/slots/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Fetched slots data:", data) // Debug log
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

  const filterSlots = () => {
    let filtered = slots

    if (searchTerm) {
      filtered = filtered.filter(
        (slot) =>
          getSlotDisplayId(slot).toLowerCase().includes(searchTerm.toLowerCase()) ||
          slot.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((slot) => slot.status === statusFilter)
    }

    if (floorFilter !== "all") {
      const floorNumber = Number.parseInt(floorFilter)
      filtered = filtered.filter((slot) => {
        const slotFloor = slot.structure ? Number.parseInt(slot.structure.replace("FLOOR", "")) : slot.floor
        return slotFloor === floorNumber
      })
    }

    setFilteredSlots(filtered)
  }

  const getSlotDisplayId = (slot) => {
    if (slot.structure && slot.section && slot.slotNo) {
      // Use CustomerView.js format
      return `F${Number.parseInt(slot.structure.replace("FLOOR", ""))}-${slot.section}-${slot.slotNo}`
    } else if (slot.floor && slot.section && slot.slot_number) {
      // Fallback format
      return `F${slot.floor}-${slot.section}-${slot.slot_number}`
    } else if (slot.display_id) {
      return slot.display_id
    }
    return `Slot ${slot.id}`
  }

  const getSlotPlateNumber = (slot) => {
    // Check multiple possible locations for license plate
    if (slot.current_allocation?.license_plate) {
      return slot.current_allocation.license_plate
    }
    if (slot.license_plate) {
      return slot.license_plate
    }
    if (slot.current_vehicle?.license_plate) {
      return slot.current_vehicle.license_plate
    }
    return null
  }

  const validateLicensePlate = (plate) => {
    // Remove spaces and convert to uppercase
    const cleanPlate = plate.replace(/\s/g, "").toUpperCase()

    // Check length (3-8 characters)
    if (cleanPlate.length < 3) {
      return { isValid: false, error: "License plate must be at least 3 characters" }
    }
    if (cleanPlate.length > 8) {
      return { isValid: false, error: "License plate cannot exceed 8 characters" }
    }

    // Check format: only letters, numbers, and hyphens allowed
    const validFormat = /^[A-Z0-9-]+$/.test(cleanPlate)
    if (!validFormat) {
      return { isValid: false, error: "Only letters, numbers, and hyphens allowed" }
    }

    // Check for valid patterns (at least one letter and one number, or all letters, or all numbers)
    const hasLetter = /[A-Z]/.test(cleanPlate)
    const hasNumber = /[0-9]/.test(cleanPlate)
    const hasOnlyHyphens = /^-+$/.test(cleanPlate)

    if (hasOnlyHyphens) {
      return { isValid: false, error: "License plate cannot contain only hyphens" }
    }

    return { isValid: true, error: "" }
  }

  const handlePlateNumberChange = (e) => {
    let value = e.target.value.toUpperCase()

    // Remove invalid characters in real-time
    value = value.replace(/[^A-Z0-9-\s]/g, "")

    // Limit to 8 characters
    if (value.length > 8) {
      value = value.substring(0, 8)
    }

    setPlateNumber(value)

    // Validate and show error
    if (value.trim()) {
      const validation = validateLicensePlate(value)
      setPlateError(validation.error)
    } else {
      setPlateError("")
    }
  }

  const handleSlotClick = (slot) => {
    if (slot.status === "available") {
      setSelectedSlot(slot)
      setShowPlateModal(true)
      setPlateNumber("")
      setPlateError("")
    } else if (slot.status === "occupied") {
      alert(`Please go to "Checkout Page" to the release slot ${getSlotDisplayId(slot)}`)
    }
  }

  const handleAssignSlot = async () => {
    if (!selectedSlot || !plateNumber.trim()) return

    // Final validation before assignment
    const validation = validateLicensePlate(plateNumber)
    if (!validation.isValid) {
      setPlateError(validation.error)
      return
    }

    try {
      const cleanPlateNumber = plateNumber.replace(/\s/g, "").toUpperCase()

      const response = await fetch(`${BASE_URL}/api/slots/${selectedSlot.id}/assign/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          license_plate: cleanPlateNumber,
          mark_as_arrived: true, // Mark as arrived for manual assignments
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Update the slots list with the new slot data
        setSlots((prev) => prev.map((slot) => (slot.id === selectedSlot.id ? result.slot : slot)))

        setShowPlateModal(false)
        setPlateNumber("")
        setPlateError("")

        // Store assignment result and show print modal
        setAssignmentResult({
          slot: result.slot,
          slotDisplayId: getSlotDisplayId(selectedSlot),
          plateNumber: cleanPlateNumber,
          entryTime: new Date().toISOString(),
          slotType: selectedSlot.slot_type || "regular",
        })
        setShowPrintModal(true)

        alert(`Slot ${getSlotDisplayId(selectedSlot)} assigned to vehicle ${cleanPlateNumber} and marked as arrived.`)
      } else {
        const errorData = await response.json()
        alert(`Failed to assign slot: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error assigning slot:", error)
      alert("Failed to assign slot")
    }
  }

  const printInitialTicket = () => {
    if (!assignmentResult) return

    const ticketContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Parking Entry Ticket</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
    .ticket { border: 2px solid #333; padding: 20px; text-align: center; }
    .header { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .logo { width: 60px; height: 60px; margin: 0 auto 10px; display: block; }
    .info { text-align: left; margin: 10px 0; }
    .info strong { display: inline-block; width: 120px; }
  </style>
</head>
<body>
  <div class="ticket">
    <img src="/favicon.png" alt="ParkManager Logo" class="logo" />
    <div class="header">ParkManager</div>
    <div>Parking Entry Ticket</div>
    
    <div class="info"><strong>Slot:</strong> ${assignmentResult.slotDisplayId}</div>
    <div class="info"><strong>License Plate:</strong> ${assignmentResult.plateNumber}</div>
    <div class="info"><strong>Slot Type:</strong> ${assignmentResult.slotType?.toUpperCase() || "REGULAR"}</div>
    <div class="info"><strong>Entry Time:</strong> ${new Date(assignmentResult.entryTime).toLocaleString()}</div>
    
    <div style="margin-top: 20px; font-size: 12px;">
      <p>Welcome to ParkManager!</p>
      <p>Keep this ticket for checkout.</p>
    </div>
  </div>
</body>
</html>
`

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(ticketContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const completePrintProcess = (shouldPrint) => {
    if (shouldPrint) {
      printInitialTicket()
    }

    setShowPrintModal(false)
    setAssignmentResult(null)
    setSelectedSlot(null)
  }

  const getSlotColor = (status, slotType) => {
    if (status === "occupied") return "slot-occupied"
    if (status === "reserved") return "slot-reserved"
    if (slotType === "vip") return "slot-vip"
    if (slotType === "disabled") return "slot-disabled"
    return "slot-available"
  }

  const getSlotIcon = (status, slotType) => {
    if (slotType === "disabled") return <Accessibility size={20} />
    if (slotType === "vip") return <Star size={20} />
    return status === "occupied" ? <Car size={20} /> : <Car size={20} />
  }

  const isAssignButtonDisabled = () => {
    if (!plateNumber.trim()) return true
    const validation = validateLicensePlate(plateNumber)
    return !validation.isValid
  }

  if (loading) {
    return (
      <div className="update-slots-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="update-slots-container">
        <div className="update-slots-header">
          <div className="header-content">
            <h1 className="main-title">Update Slot Availability</h1>
            <p className="subtitle">Click available slots to assign vehicles, click occupied slots to release</p>
          </div>
          <button onClick={fetchSlots} className="refresh-button">
            <span className="refresh-icon">
              <RotateCcw size={16} />
            </span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Search Slot</label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Slot ID (e.g., F1-A-1)"
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
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Floor</label>
              <select className="filter-select" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
                <option value="all">All Floors</option>
                <option value="1">Floor 1</option>
                <option value="2">Floor 2</option>
                <option value="3">Floor 3</option>
                <option value="4">Floor 4</option>
              </select>
            </div>

            <div className="filter-group">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setFloorFilter("all")
                }}
                className="clear-filters-button"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Slots Grid */}
        <div className="slots-section">
          <div className="slots-grid">
            {filteredSlots.map((slot) => (
              <div
                key={slot.id}
                className={`slot-item ${getSlotColor(slot.status, slot.slot_type)} ${
                  slot.slot_type === "disabled" ? "disabled" : "clickable"
                }`}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="slot-id">{getSlotDisplayId(slot)}</div>
                <div className="slot-icon">{getSlotIcon(slot.status, slot.slot_type)}</div>
                {getSlotPlateNumber(slot) && <div className="slot-plate">{getSlotPlateNumber(slot)}</div>}
              </div>
            ))}
          </div>

          {filteredSlots.length === 0 && (
            <div className="no-slots">
              <div className="no-slots-icon">
                <Car size={48} />
              </div>
              <h3 className="no-slots-title">NO SLOTS FOUND!</h3>
              <p className="no-slots-text">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="legend-section">
          <h3 className="legend-title">Legend</h3>
          <div className="legend-grid">
            <div className="legend-item">
              <div className="legend-color slot-available"></div>
              <span className="legend-text">Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-color slot-occupied"></div>
              <span className="legend-text">Occupied</span>
            </div>
            <div className="legend-item">
              <div className="legend-color slot-reserved"></div>
              <span className="legend-text">Reserved</span>
            </div>
            <div className="legend-item">
              <div className="legend-color slot-vip"></div>
              <span className="legend-text">VIP</span>
            </div>
            <div className="legend-item">
              <div className="legend-color slot-disabled"></div>
              <span className="legend-text">PWD Slot</span>
            </div>
            <div className="legend-instruction">Click available slots to assign • Click occupied to release</div>
          </div>
        </div>

        {/* Plate Number Modal */}
        {showPlateModal && selectedSlot && (
          <div className="modal-overlay">
            <div className="plate-modal">
              <h3 className="modal-title">Assign Vehicle to Slot {getSlotDisplayId(selectedSlot)}</h3>

              <div className="slot-info">
                <p>
                  <strong>Slot Type:</strong> {selectedSlot.slot_type?.toUpperCase()}
                </p>
                <p>
                  <strong>Floor:</strong>{" "}
                  {selectedSlot.structure
                    ? Number.parseInt(selectedSlot.structure.replace("FLOOR", ""))
                    : selectedSlot.floor}
                </p>
                <p>
                  <strong>Section:</strong> {selectedSlot.section}
                </p>
              </div>

              <div className="modal-input-group">
                <label className="input-label">License Plate Number</label>
                <input
                  type="text"
                  placeholder="ABC-1234 (3-8 characters)"
                  className={`plate-input ${plateError ? "error" : ""}`}
                  value={plateNumber}
                  onChange={handlePlateNumberChange}
                  onKeyPress={(e) => e.key === "Enter" && !isAssignButtonDisabled() && handleAssignSlot()}
                  autoFocus
                />
                {plateError && (
                  <div className="error-message" style={{ color: "#ff4444", fontSize: "12px", marginTop: "5px" }}>
                    {plateError}
                  </div>
                )}
                <div className="input-help" style={{ fontSize: "11px", color: "#666", marginTop: "5px" }}>
                  Format: Letters, numbers, and hyphens only (3-8 characters)
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowPlateModal(false)} className="modal-cancel">
                  Cancel
                </button>
                <button
                  onClick={handleAssignSlot}
                  disabled={isAssignButtonDisabled()}
                  className="modal-assign"
                  style={{
                    opacity: isAssignButtonDisabled() ? 0.5 : 1,
                    cursor: isAssignButtonDisabled() ? "not-allowed" : "pointer",
                  }}
                >
                  Assign Vehicle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Ticket Modal */}
        {showPrintModal && assignmentResult && (
          <div className="modal-overlay">
            <div className="plate-modal">
              <h3 className="modal-title">Vehicle Assigned Successfully</h3>

              <div className="slot-info">
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{ fontSize: "48px", color: "#00fff7", marginBottom: "10px" }}>🚗</div>
                  <p>
                    Vehicle <strong>{assignmentResult.plateNumber}</strong> has been assigned to slot{" "}
                    <strong>{assignmentResult.slotDisplayId}</strong> and marked as arrived.
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(0, 255, 247, 0.1)",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <h4 style={{ color: "#00fff7", marginBottom: "10px" }}>Entry Ticket Details:</h4>
                  <p>
                    <strong>Slot:</strong> {assignmentResult.slotDisplayId}
                  </p>
                  <p>
                    <strong>License Plate:</strong> {assignmentResult.plateNumber}
                  </p>
                  <p>
                    <strong>Slot Type:</strong> {assignmentResult.slotType?.toUpperCase() || "REGULAR"}
                  </p>
                  <p>
                    <strong>Entry Time:</strong> {new Date(assignmentResult.entryTime).toLocaleString()}
                  </p>
                </div>

                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <Printer size={24} style={{ color: "#00fff7", marginBottom: "10px" }} />
                  <p>Would you like to print the entry ticket now?</p>
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => completePrintProcess(false)} className="modal-cancel">
                  Skip Printing
                </button>
                <button onClick={() => completePrintProcess(true)} className="modal-assign">
                  Print Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default UpdateSlots
