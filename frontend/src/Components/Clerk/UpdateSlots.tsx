"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { ParkingSlot } from "../../types"
import { Car, Search, RefreshCw } from "lucide-react"

const UpdateSlots: React.FC = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [filteredSlots, setFilteredSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [floorFilter, setFloorFilter] = useState("all")
  const [showPlateModal, setShowPlateModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)
  const [plateNumber, setPlateNumber] = useState("")

  useEffect(() => {
    fetchSlots()
  }, [])

  useEffect(() => {
    filterSlots()
  }, [slots, searchTerm, statusFilter, floorFilter])

  const fetchSlots = async () => {
    try {
      const response = await apiService.getAllSlots()
      setSlots(response.results || [])
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

  const handleSlotClick = (slot: ParkingSlot) => {
    if (slot.status === "available" && slot.slot_type !== "disabled") {
      setSelectedSlot(slot)
      setShowPlateModal(true)
      setPlateNumber("")
    } else if (slot.status === "occupied") {
      // Release the slot
      handleReleaseSlot(slot.id)
    }
  }

  const handleAssignSlot = async () => {
    if (!selectedSlot || !plateNumber.trim()) return

    try {
      await apiService.allocateSlot(selectedSlot.id, {
        license_plate: plateNumber.trim(),
        customer_name: "",
        phone_number: "",
      })
      setShowPlateModal(false)
      setSelectedSlot(null)
      setPlateNumber("")
      fetchSlots()
    } catch (error) {
      console.error("Error assigning slot:", error)
      alert("Failed to assign slot")
    }
  }

  const handleReleaseSlot = async (slotId: string) => {
    if (confirm("Release this parking slot?")) {
      try {
        await apiService.releaseSlot(slotId)
        fetchSlots()
      } catch (error) {
        console.error("Error releasing slot:", error)
        alert("Failed to release slot")
      }
    }
  }

  const getSlotColor = (status: string, slotType: string) => {
    if (status === "occupied") return "bg-red-500"
    if (status === "reserved") return "bg-yellow-500"
    if (slotType === "vip") return "bg-yellow-500"
    if (slotType === "disabled") return "bg-purple-500"
    return "bg-green-500"
  }

  const getSlotIcon = (status: string, slotType: string) => {
    if (slotType === "disabled") return "♿"
    if (slotType === "vip") return "⭐"
    return status === "occupied" ? "🚗" : "🅿️"
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Update Slot Availability</h1>
          <p className="text-gray-600">Click available slots to assign vehicles, click occupied slots to release</p>
        </div>
        <button
          onClick={fetchSlots}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Slot</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Slot ID (e.g., F1-A1-01)"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
            >
              <option value="all">All Floors</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3</option>
              <option value="4">Floor 4</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setFloorFilter("all")
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 xl:grid-cols-20 gap-1">
          {filteredSlots.map((slot) => (
            <div
              key={slot.id}
              className={`
          ${getSlotColor(slot.status, slot.slot_type)} text-white rounded-md p-1
          cursor-pointer hover:opacity-80 transition-all duration-200
          flex flex-col items-center justify-center min-h-[50px] text-xs
          ${slot.slot_type === "disabled" ? "cursor-not-allowed" : ""}
        `}
              onClick={() => handleSlotClick(slot)}
            >
              <div className="text-[10px] font-medium">{slot.id}</div>
              <div className="text-xs">{getSlotIcon(slot.status, slot.slot_type)}</div>
              {slot.current_allocation?.license_plate && (
                <div className="text-[10px] font-mono">{slot.current_allocation.license_plate}</div>
              )}
            </div>
          ))}
        </div>

        {filteredSlots.length === 0 && (
          <div className="text-center py-12">
            <Car className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No slots found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-700">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-gray-700">Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-xs text-gray-700">VIP/Reserved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-xs text-gray-700">Disabled Access</span>
          </div>
          <div className="text-xs text-gray-500">Click available slots to assign • Click occupied to release</div>
        </div>
      </div>

      {/* Plate Number Modal */}
      {showPlateModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Plate No.</h3>

            <div className="mb-4">
              <input
                type="text"
                placeholder="ABC-1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleAssignSlot()}
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPlateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSlot}
                disabled={!plateNumber.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UpdateSlots
