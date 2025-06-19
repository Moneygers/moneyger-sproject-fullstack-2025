"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { ParkingSlot } from "../../types"
import { Car, RefreshCw, ArrowLeft } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

const MonitorAvailability: React.FC = () => {
  const { isAuthenticated, isAdmin, isClerk } = useAuth()
  const navigate = useNavigate()
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    fetchAvailableSlots()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAvailableSlots, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAvailableSlots = async () => {
    try {
      const response = await apiService.getAvailableSlots()
      setSlots(response.results || [])
      setLastUpdated(new Date())
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
    if (slot.slot_type === "vip") return "bg-yellow-500"
    if (slot.slot_type === "disabled") return "bg-purple-500"
    return "bg-green-500"
  }

  const getSlotIcon = (slot: ParkingSlot) => {
    if (slot.slot_type === "disabled") return "♿"
    if (slot.slot_type === "vip") return "⭐"
    return "🅿️"
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

  const currentFloorSlots = getFloorSlots(selectedFloor)
  const sectionedSlots = getSlotsBySection(currentFloorSlots)
  const availableCount = currentFloorSlots.length

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center space-x-4">
            {(isAdmin || isClerk) && isAuthenticated && (
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Monitor Parking Availability</h1>
              <p className="text-gray-600">Real-time parking slot availability</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</div>
          <button
            onClick={fetchAvailableSlots}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Side Floor Selector */}
        <div className="w-48 bg-white rounded-lg shadow mr-6">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Floor Selection</h3>
          </div>
          <div className="flex flex-col p-2">
            {[1, 2, 3, 4].map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-4 py-3 mb-2 rounded-lg font-medium transition-colors ${
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

        {/* Main Content */}
        <div className="flex-1">
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
              <p className="text-white opacity-75">{availableCount} available slots</p>
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
                  <div key={section} className="bg-black bg-opacity-10 rounded-lg p-6">
                    <div className="text-white text-lg font-semibold mb-4">
                      Section {section} ({sectionSlots.length} available)
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                      {sectionSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`
                            ${getSlotColor(slot)} text-white rounded-lg p-3
                            flex flex-col items-center justify-center min-h-[80px]
                            border-2 border-white
                          `}
                        >
                          <div className="text-xs font-medium mb-1">{slot.id}</div>
                          <div className="text-xl mb-1">{getSlotIcon(slot)}</div>
                          <div className="text-xs text-center">
                            {slot.slot_type === "vip"
                              ? "VIP"
                              : slot.slot_type === "disabled"
                                ? "DISABLED"
                                : "AVAILABLE"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Regular Available</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-700">VIP Available</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-700">Disabled Access</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonitorAvailability
