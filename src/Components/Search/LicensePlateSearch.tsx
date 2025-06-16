"use client"

import type React from "react"
import { useState } from "react"
import { apiService } from "../../services/api"
import { Search, Car, Clock, User, Phone } from "lucide-react"

interface SearchResult {
  slot: {
    id: string
    floor: number
    section: string
    slot_type: string
  }
  allocation: {
    license_plate: string
    customer_name?: string
    phone_number?: string
    start_time: string
    duration?: string
  }
}

const LicensePlateSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    setError("")
    setSearchResult(null)

    try {
      const response = await apiService.searchSlotByPlate(searchTerm.trim())
      if (response.results && response.results.length > 0) {
        setSearchResult(response.results[0])
      } else {
        setError("No vehicle found with this license plate.")
      }
    } catch (err) {
      setError("Error searching for license plate. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const calculateDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">License Plate Search</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter license plate number (e.g., ABC-1234)"
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Search className="h-5 w-5" />
            )}
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Car className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {searchResult && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <h3 className="text-lg font-medium text-green-900">Vehicle Found</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Parking Information</h4>

                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">License Plate</p>
                    <p className="font-medium text-lg">{searchResult.allocation.license_plate}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    P
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parking Slot</p>
                    <p className="font-medium">{searchResult.slot.id}</p>
                    <p className="text-sm text-gray-500">
                      Floor {searchResult.slot.floor} • Section {searchResult.slot.section}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Parked Since</p>
                    <p className="font-medium">{formatDateTime(searchResult.allocation.start_time)}</p>
                    <p className="text-sm text-blue-600 font-medium">
                      Duration: {calculateDuration(searchResult.allocation.start_time)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Customer Information</h4>

                {searchResult.allocation.customer_name && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Customer Name</p>
                      <p className="font-medium">{searchResult.allocation.customer_name}</p>
                    </div>
                  </div>
                )}

                {searchResult.allocation.phone_number && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium">{searchResult.allocation.phone_number}</p>
                    </div>
                  </div>
                )}

                {!searchResult.allocation.customer_name && !searchResult.allocation.phone_number && (
                  <p className="text-gray-500 italic">No customer information available</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  View Slot Details
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Release Slot</button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LicensePlateSearch
