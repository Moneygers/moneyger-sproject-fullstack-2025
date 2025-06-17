"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { ParkingSlot } from "../../types"
import { Car, MapPin, ArrowLeft, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

const CustomerView: React.FC = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)
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
      const response = await apiService.getAvailableSlots()
      setSlots(response.results || [])
    } catch (error) {
      console.error("Error fetching available slots:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFloorSlots = (floor: number) => {
    return slots.filter((slot) => slot.floor === floor)
  }

  const getSlotsBySection = (floorSlots: ParkingSlot[]) => {
    const sections: { [key: string]: ParkingSlot[] } = {}
    floorSlots.forEach((slot) => {
      if (!sections[slot.section]) {
        sections[slot.section] = []
      }
      sections[slot.section].push(slot)
    })
    return sections
  }

  const getSlotColor = (slot: ParkingSlot) => {
    if (slot.status === "available") {
      if (slot.slot_type === "vip") return "bg-yellow-500"
      if (slot.slot_type === "disabled") return "bg-purple-500"
      return "bg-green-500"
    }
    return "bg-gray-400"
  }

  const getSlotIcon = (slot: ParkingSlot) => {
    if (slot.slot_type === "disabled") return "♿"
    if (slot.slot_type === "vip") return "⭐"
    return "🅿️"
  }

  const getSectionTitle = (section: string) => {
    const sectionMap: { [key: string]: string } = {
      A: "Section A",
      B: "Section B",
      C: "Section C",
    }
    return sectionMap[section] || section
  }

  const handleSlotClick = (slot: ParkingSlot) => {
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
      alert(`Reservation created for slot ${selectedSlot.id}`)
      setShowReservationModal(false)
      setReservationForm({ name: "", plateNumber: "", contactNumber: "" })
      setSelectedSlot(null)
    } catch (error) {
      console.error("Error creating reservation:", error)
      alert("Failed to create reservation")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentFloorSlots = getFloorSlots(selectedFloor)
  const sectionedSlots = getSlotsBySection(currentFloorSlots)
  const availableCount = currentFloorSlots.filter((slot) => slot.status === "available").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Login</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <Car className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ParkManager</h1>
                  <p className="text-sm text-gray-600">Customer View - Available Parking Slots</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{availableCount}</div>
              <div className="text-sm text-gray-600">Available Slots</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Floor Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4].map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedFloor === floor ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{floor === 1 ? "🏢" : floor === 4 ? "☀️" : "🅿️"}</span>
                  <span>{floor === 1 ? "Ground Floor" : floor === 4 ? "Rooftop" : `Floor ${floor}`}</span>
                </div>
                <div className="text-xs mt-1">
                  {getFloorSlots(floor).filter((s) => s.status === "available").length} available
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Floor Layout */}
        <div className="bg-slate-700 rounded-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {selectedFloor === 1
                ? "🏢 Ground Floor - Main Level"
                : selectedFloor === 4
                  ? "☀️ Rooftop Level - Open Air"
                  : `🏢 Floor ${selectedFloor}`}
            </h2>
            <p className="text-white opacity-75">
              {availableCount} available slots out of {currentFloorSlots.length} total
            </p>
            <p className="text-white opacity-75 text-sm mt-2">Click on any available slot to make a reservation</p>
          </div>

          {Object.keys(sectionedSlots).length === 0 ? (
            <div className="text-center py-12">
              <Car className="mx-auto h-16 w-16 text-white opacity-50 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Available Slots</h3>
              <p className="text-white opacity-75">All slots on this floor are currently occupied.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(sectionedSlots).map(([section, sectionSlots]) => (
                <div
                  key={section}
                  className="bg-black bg-opacity-10 rounded-lg p-6 border-2 border-dashed border-white border-opacity-20"
                >
                  <div className="text-white text-lg font-semibold mb-4 flex items-center gap-3">
                    <span>{getSectionTitle(section)}</span>
                    <span className="text-sm opacity-75">({sectionSlots.length} slots available)</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                    {sectionSlots.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className={`
                          ${getSlotColor(slot)} text-white rounded-lg p-3 cursor-pointer
                          flex flex-col items-center justify-center min-h-[80px]
                          transition-all duration-200 transform hover:scale-105
                          border-2 border-white
                        `}
                      >
                        <div className="text-xs font-medium mb-1">{slot.id}</div>
                        <div className="text-xl mb-1">{getSlotIcon(slot)}</div>
                        <div className="text-xs text-center">
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
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">Available</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">VIP Available</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-700">Disabled Access</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-400 rounded"></div>
              <span className="text-sm text-gray-700">Occupied</span>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <div className="flex items-start space-x-3">
            <MapPin className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Need to Park?</h3>
              <p className="text-blue-800 mb-3">
                Click on any available slot above to make a reservation, or visit our front desk for immediate parking.
              </p>
              <div className="text-sm text-blue-700">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reserve Slot {selectedSlot.id}</h3>
              <button
                onClick={() => {
                  setShowReservationModal(false)
                  setReservationForm({ name: "", plateNumber: "", contactNumber: "" })
                  setSelectedSlot(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Slot Details:</strong>
              </div>
              <div className="text-sm text-blue-700">
                Floor {selectedSlot.floor} • Section {selectedSlot.section} •
                {selectedSlot.slot_type === "vip"
                  ? " VIP Slot"
                  : selectedSlot.slot_type === "disabled"
                    ? " Disabled Access"
                    : " Regular Slot"}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reservationForm.name}
                  onChange={(e) => setReservationForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
                <input
                  type="text"
                  placeholder="ABC-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reservationForm.plateNumber}
                  onChange={(e) =>
                    setReservationForm((prev) => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <input
                  type="tel"
                  placeholder="09123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reservationForm.contactNumber}
                  onChange={(e) => setReservationForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowReservationModal(false)
                  setReservationForm({ name: "", plateNumber: "", contactNumber: "" })
                  setSelectedSlot(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReservationSubmit}
                disabled={!reservationForm.name || !reservationForm.plateNumber || !reservationForm.contactNumber}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
