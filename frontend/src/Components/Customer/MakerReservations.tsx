"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { ParkingSlot } from "../../types"
import { Calendar } from "lucide-react"

const MakeReservation: React.FC = () => {
  const [availableSlots, setAvailableSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    customer_name: "",
    phone_number: "",
    license_plate: "",
    selected_slot: "",
    reservation_date: "",
    reservation_time: "",
    duration_hours: 1,
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await apiService.createReservation(formData)
      setSuccess(true)
      setFormData({
        customer_name: "",
        phone_number: "",
        license_plate: "",
        selected_slot: "",
        reservation_date: "",
        reservation_time: "",
        duration_hours: 1,
      })
    } catch (error) {
      console.error("Error creating reservation:", error)
      alert("Failed to create reservation. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getSlotsByFloor = () => {
    const floors: { [key: number]: ParkingSlot[] } = {}
    availableSlots.forEach((slot) => {
      if (!floors[slot.floor]) {
        floors[slot.floor] = []
      }
      floors[slot.floor].push(slot)
    })
    return floors
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

  const slotsByFloor = getSlotsByFloor()

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Make Parking Reservation</h1>
          <p className="text-gray-600">Reserve your parking slot in advance</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Reservation created successfully! You will receive a confirmation shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reservation Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reservation Details</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone_number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="09123456789"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Plate *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Parking Slot *</label>
                <select
                  name="selected_slot"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.selected_slot}
                  onChange={handleInputChange}
                >
                  <option value="">Choose a parking slot</option>
                  {Object.entries(slotsByFloor).map(([floor, slots]) => (
                    <optgroup key={floor} label={`Floor ${floor}`}>
                      {slots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.id} -{" "}
                          {slot.slot_type === "vip"
                            ? "VIP"
                            : slot.slot_type === "disabled"
                              ? "Disabled Access"
                              : "Regular"}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reservation Date *</label>
                  <input
                    type="date"
                    name="reservation_date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.reservation_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reservation Time *</label>
                  <input
                    type="time"
                    name="reservation_time"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.reservation_time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours) *</label>
                <select
                  name="duration_hours"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.duration_hours}
                  onChange={handleInputChange}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 12, 24].map((hours) => (
                    <option key={hours} value={hours}>
                      {hours} {hours === 1 ? "hour" : "hours"}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Calendar className="h-5 w-5" />
                    <span>Make Reservation</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Available Slots Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Slots</h2>

            <div className="space-y-4">
              {Object.entries(slotsByFloor).map(([floor, slots]) => (
                <div key={floor} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {floor === "1" ? "Ground Floor" : floor === "4" ? "Rooftop" : `Floor ${floor}`}
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.slice(0, 8).map((slot) => (
                      <div
                        key={slot.id}
                        className={`
                          p-2 rounded text-center text-xs font-medium text-white
                          ${
                            slot.slot_type === "vip"
                              ? "bg-yellow-500"
                              : slot.slot_type === "disabled"
                                ? "bg-purple-500"
                                : "bg-green-500"
                          }
                        `}
                      >
                        {slot.id}
                      </div>
                    ))}
                  </div>
                  {slots.length > 8 && (
                    <p className="text-sm text-gray-500 mt-2">+{slots.length - 8} more slots available</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Reservation Policy</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Reservations must be made at least 1 hour in advance</li>
                <li>• VIP slots include premium amenities</li>
                <li>• Cancellation allowed up to 30 minutes before reserved time</li>
                <li>• Payment required upon arrival</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MakeReservation
