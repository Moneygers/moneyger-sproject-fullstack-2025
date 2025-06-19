"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { ParkingSlot } from "../../types"
import { Search, Car, User, Phone } from "lucide-react"

const AssignVehicle: React.FC = () => {
  const [availableSlots, setAvailableSlots] = useState<ParkingSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    license_plate: "",
    customer_name: "",
    phone_number: "",
  })

  useEffect(() => {
    fetchAvailableSlots()
  }, [])

  const fetchAvailableSlots = async () => {
    try {
      const response = await apiService.getAvailableSlots()
      setAvailableSlots(response.results || [])
    } catch (error) {
      console.error("Error fetching available slots:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSlotSelect = (slot: ParkingSlot) => {
    setSelectedSlot(slot)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    setSubmitting(true)
    try {
      await apiService.allocateSlot(selectedSlot.id, formData)
      alert(`Vehicle ${formData.license_plate} successfully assigned to slot ${selectedSlot.id}`)

      // Reset form
      setFormData({ license_plate: "", customer_name: "", phone_number: "" })
      setSelectedSlot(null)
      fetchAvailableSlots()
    } catch (error) {
      console.error("Error assigning vehicle:", error)
      alert("Failed to assign vehicle to slot")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredSlots = availableSlots.filter((slot) => slot.id.toLowerCase().includes(searchTerm.toLowerCase()))

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assign Vehicle to Slot</h1>
        <p className="text-gray-600">Assign a vehicle to an available parking slot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Slots */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Available Slots</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search slot..."
                className="pl-10 w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {filteredSlots.map((slot) => (
              <div
                key={slot.id}
                className={`
                  ${getSlotColor(slot)} text-white rounded-lg p-3 cursor-pointer
                  hover:opacity-80 transition-all duration-200 transform hover:scale-105
                  flex flex-col items-center justify-center min-h-[80px]
                  ${selectedSlot?.id === slot.id ? "ring-4 ring-blue-400" : ""}
                `}
                onClick={() => handleSlotSelect(slot)}
              >
                <div className="text-xs font-medium mb-1">{slot.id}</div>
                <div className="text-xl mb-1">{getSlotIcon(slot)}</div>
                <div className="text-xs text-center">
                  {slot.slot_type === "vip" ? "VIP" : slot.slot_type === "disabled" ? "DISABLED" : "REGULAR"}
                </div>
              </div>
            ))}
          </div>

          {filteredSlots.length === 0 && (
            <div className="text-center py-8">
              <Car className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">No available slots found</p>
            </div>
          )}
        </div>

        {/* Assignment Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Assignment</h2>

          {selectedSlot ? (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Selected Slot</h3>
              <div className="flex items-center space-x-3">
                <div className={`${getSlotColor(selectedSlot)} text-white rounded-lg p-2`}>
                  {getSlotIcon(selectedSlot)}
                </div>
                <div>
                  <div className="font-medium">{selectedSlot.id}</div>
                  <div className="text-sm text-gray-600">
                    Floor {selectedSlot.floor} • Section {selectedSlot.section}
                  </div>
                  <div className="text-sm text-blue-600">
                    {selectedSlot.slot_type === "vip"
                      ? "VIP Slot"
                      : selectedSlot.slot_type === "disabled"
                        ? "Disabled Access"
                        : "Regular Slot"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500">Please select a parking slot first</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Car className="inline h-4 w-4 mr-1" />
                License Plate *
              </label>
              <input
                type="text"
                name="license_plate"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC-1234"
                value={formData.license_plate}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline h-4 w-4 mr-1" />
                Customer Name
              </label>
              <input
                type="text"
                name="customer_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                value={formData.customer_name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="09123456789"
                value={formData.phone_number}
                onChange={handleInputChange}
              />
            </div>

            <button
              type="submit"
              disabled={!selectedSlot || submitting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Assigning..." : "Assign Vehicle to Slot"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AssignVehicle
