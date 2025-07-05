"use client"

import { useState, useEffect } from "react"
import "../../styles/clerk/UpdateSlots.css"
import Layout from "../../components/Layout"

const UpdateSlots = () => {
  const [slots, setSlots] = useState([])
  const [filteredSlots, setFilteredSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [floorFilter, setFloorFilter] = useState("all")
  const [showPlateModal, setShowPlateModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [plateNumber, setPlateNumber] = useState("")

  useEffect(() => {
    fetchSlots()
  }, [])

  useEffect(() => {
    filterSlots()
  }, [slots, searchTerm, statusFilter, floorFilter])

  const fetchSlots = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/slots/", {
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

  const handleSlotClick = (slot) => {
    if (slot.status === "available") {
      setSelectedSlot(slot)
      setShowPlateModal(true)
      setPlateNumber("")
    } else if (slot.status === "occupied") {
      alert(`go to checkout page to release slot ${getSlotDisplayId(slot)}`)
    }
  }

  const handleAssignSlot = async () => {
    if (!selectedSlot || !plateNumber.trim()) return

    try {
      const response = await fetch(`http://localhost:8000/api/slots/${selectedSlot.id}/assign/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          license_plate: plateNumber.trim(),
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Update the slots list with the new slot data
        setSlots((prev) => prev.map((slot) => (slot.id === selectedSlot.id ? result.slot : slot)))

        setShowPlateModal(false)
        setSelectedSlot(null)
        setPlateNumber("")

        alert(
          `Slot ${getSlotDisplayId(selectedSlot)} assigned to vehicle ${plateNumber}.\nPayment record created with amount ₱${result.payment.amount}`,
        )
      } else {
        const errorData = await response.json()
        alert(`Failed to assign slot: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error assigning slot:", error)
      alert("Failed to assign slot")
    }
  }

  const getSlotColor = (status, slotType) => {
    if (status === "occupied") return "slot-occupied"
    if (status === "reserved") return "slot-reserved"
    if (slotType === "vip") return "slot-vip"
    if (slotType === "disabled") return "slot-disabled"
    return "slot-available"
  }

  const getSlotIcon = (status, slotType) => {
    if (slotType === "disabled") return "♿"
    if (slotType === "vip") return "⭐"
    return status === "occupied" ? "🚗" : "🅿️"
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
            <span className="refresh-icon">🔄</span>
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
              <div className="no-slots-icon">🚗</div>
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
                  placeholder="ABC-1234"
                  className="plate-input"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && handleAssignSlot()}
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowPlateModal(false)} className="modal-cancel">
                  Cancel
                </button>
                <button onClick={handleAssignSlot} disabled={!plateNumber.trim()} className="modal-assign">
                  Assign Vehicle
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
