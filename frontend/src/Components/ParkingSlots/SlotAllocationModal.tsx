"use client"

import type React from "react"
import { useState } from "react"
import { apiService } from "../../services/api"
import type { ParkingSlot } from "../../types"
import { X } from "lucide-react"

interface SlotAllocationModalProps {
  slot: ParkingSlot
  onClose: () => void
  onSuccess: () => void
}

const SlotAllocationModal: React.FC<SlotAllocationModalProps> = ({ slot, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    license_plate: "",
    customer_name: "",
    phone_number: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await apiService.allocateSlot(slot.id, formData)
      onSuccess()
    } catch (err) {
      setError("Failed to allocate slot. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Allocate Slot {slot.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Plate *</label>
            <input
              type="text"
              name="license_plate"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC-1234"
              value={formData.license_plate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              name="customer_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              value={formData.customer_name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="09123456789"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Allocating..." : "Allocate Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SlotAllocationModal
