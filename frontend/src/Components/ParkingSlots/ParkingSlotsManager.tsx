"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { ParkingSlot } from "../../types"
import { Car, Search } from "lucide-react"
import SlotAllocationModal from "./SlotAllocationModal"

const ParkingSlotsManager: React.FC = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [filteredSlots, setFilteredSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)
  const [showAllocationModal, setShowAllocationModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [floorFilter, setFloorFilter] = useState("all")

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
      filtered = filtered.filter(
        (slot) =>
          slot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          slot.current_allocation?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
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
    if (slot.status === "available") {
      setSelectedSlot(slot)
      setShowAllocationModal(true)
    } else if (slot.status === "occupied") {
      handleReleaseSlot(slot)
    }
  }

  const handleReleaseSlot = async (slot: ParkingSlot) => {
    if (window.confirm(`Release slot ${slot.id}?`)) {
      try {
        await apiService.releaseSlot(slot.id)
        fetchSlots()
      } catch (error) {
        console.error("Error releasing slot:", error)
      }
    }
  }

  const handleAllocationSuccess = () => {
    setShowAllocationModal(false)
    setSelectedSlot(null)
    fetchSlots()
  }

  const getSlotColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "occupied":
        return "bg-red-500"
      case "reserved":
        return "bg-yellow-500"
      case "disabled":
        return "bg-gray-500"
      default:
        return "bg-gray-300"
    }
  }

  const getSlotIcon = (status: string, slotType: string) => {
    if (slotType === "disabled") return "♿"
    if (slotType === "vip") return "⭐"
    return status === "occupied" ? "🚗" : "🅿️"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parking Slots Management</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Slot ID or License Plate"
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
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
        {filteredSlots.map((slot) => (
          <div
            key={slot.id}
            className={`
              ${getSlotColor(slot.status)} text-white rounded-lg p-3 cursor-pointer
              hover:opacity-80 transition-all duration-200 transform hover:scale-105
              flex flex-col items-center justify-center min-h-[100px]
            `}
            onClick={() => handleSlotClick(slot)}
          >
            <div className="text-xs font-medium mb-1">{slot.id}</div>
            <div className="text-2xl mb-1">{getSlotIcon(slot.status, slot.slot_type)}</div>
            <div className="text-xs text-center">{slot.status.toUpperCase()}</div>
            {slot.current_allocation && (
              <div className="text-xs text-center mt-1 font-mono">{slot.current_allocation.license_plate}</div>
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

      {/* Allocation Modal */}
      {showAllocationModal && selectedSlot && (
        <SlotAllocationModal
          slot={selectedSlot}
          onClose={() => {
            setShowAllocationModal(false)
            setSelectedSlot(null)
          }}
          onSuccess={handleAllocationSuccess}
        />
      )}
    </div>
  )
}

export default ParkingSlotsManager
