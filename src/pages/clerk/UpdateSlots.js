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
      // Mock data - replace with actual API call
      const mockSlots = [
        { id: "F1-A1-01", floor: 1, section: "A", status: "available", slot_type: "regular", current_allocation: null },
        {
          id: "F1-A1-02",
          floor: 1,
          section: "A",
          status: "occupied",
          slot_type: "regular",
          current_allocation: { license_plate: "ABC-123" },
        },
        { id: "F1-A1-03", floor: 1, section: "A", status: "available", slot_type: "vip", current_allocation: null },
        {
          id: "F1-A1-04",
          floor: 1,
          section: "A",
          status: "available",
          slot_type: "disabled",
          current_allocation: null,
        },
        {
          id: "F1-B1-01",
          floor: 1,
          section: "B",
          status: "occupied",
          slot_type: "regular",
          current_allocation: { license_plate: "XYZ-789" },
        },
        { id: "F2-A1-01", floor: 2, section: "A", status: "available", slot_type: "regular", current_allocation: null },
        { id: "F2-A1-02", floor: 2, section: "A", status: "reserved", slot_type: "vip", current_allocation: null },
        { id: "F3-A1-01", floor: 3, section: "A", status: "available", slot_type: "regular", current_allocation: null },
        { id: "F4-A1-01", floor: 4, section: "A", status: "available", slot_type: "regular", current_allocation: null },
      ]
      setSlots(mockSlots)
    } catch (error) {
      console.error("Error fetching slots:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterSlots = () => {
    let filtered = slots

    if (searchTerm) {
      filtered = filtered.filter((slot) => slot.id.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((slot) => slot.status === statusFilter)
    }

    if (floorFilter !== "all") {
      filtered = filtered.filter((slot) => slot.floor.toString() === floorFilter)
    }

    setFilteredSlots(filtered)
  }

  const handleSlotClick = (slot) => {
    if (slot.status === "available" && slot.slot_type !== "disabled") {
      setSelectedSlot(slot)
      setShowPlateModal(true)
      setPlateNumber("")
    } else if (slot.status === "occupied") {
      handleReleaseSlot(slot.id)
    }
  }

  const handleAssignSlot = async () => {
    if (!selectedSlot || !plateNumber.trim()) return

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === selectedSlot.id
            ? { ...slot, status: "occupied", current_allocation: { license_plate: plateNumber.trim() } }
            : slot,
        ),
      )

      setShowPlateModal(false)
      setSelectedSlot(null)
      setPlateNumber("")
      alert(`Slot ${selectedSlot.id} assigned to vehicle ${plateNumber}`)
    } catch (error) {
      console.error("Error assigning slot:", error)
      alert("Failed to assign slot")
    }
  }

  const handleReleaseSlot = async (slotId) => {
    if (window.confirm("Release this parking slot?")) {
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        setSlots((prev) =>
          prev.map((slot) => (slot.id === slotId ? { ...slot, status: "available", current_allocation: null } : slot)),
        )

        alert(`Slot ${slotId} has been released`)
      } catch (error) {
        console.error("Error releasing slot:", error)
        alert("Failed to release slot")
      }
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
                  placeholder="Slot ID (e.g., F1-A1-01)"
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
                <div className="slot-id">{slot.id}</div>
                <div className="slot-icon">{getSlotIcon(slot.status, slot.slot_type)}</div>
                {slot.current_allocation?.license_plate && (
                  <div className="slot-plate">{slot.current_allocation.license_plate}</div>
                )}
              </div>
            ))}
          </div>

          {filteredSlots.length === 0 && (
            <div className="no-slots">
              <div className="no-slots-icon">🚗</div>
              <h3 className="no-slots-title">No slots found</h3>
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
              <span className="legend-text">VIP/Reserved</span>
            </div>
            <div className="legend-item">
              <div className="legend-color slot-disabled"></div>
              <span className="legend-text">Disabled Access</span>
            </div>
            <div className="legend-instruction">Click available slots to assign • Click occupied to release</div>
          </div>
        </div>

        {/* Plate Number Modal */}
        {showPlateModal && selectedSlot && (
          <div className="modal-overlay">
            <div className="plate-modal">
              <h3 className="modal-title">Enter Plate No.</h3>

              <div className="modal-input-group">
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
                  Assign
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
