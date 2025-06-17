"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { Reservation } from "../../types"
import { Calendar, Search, Clock, User, Phone, CheckCircle, XCircle, MapPin } from "lucide-react"

interface ExtendedReservation extends Reservation {
  arrival_time?: string
  parking_duration?: number // in minutes
}

const ClerkMonitorReservations: React.FC = () => {
  const [reservations, setReservations] = useState<ExtendedReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock reservation data with arrival times - same as admin but for clerk view
  const mockReservations: ExtendedReservation[] = [
    {
      id: 1,
      slot: "F1-A1-05",
      customer_name: "John Doe",
      phone_number: "09123456789",
      reserved_date: "2024-01-16",
      reserved_time: "14:00",
      duration_hours: 2,
      status: "active",
      arrival_time: "2024-01-16T14:15:00", // Arrived 15 minutes late
      parking_duration: 45, // Been parked for 45 minutes
    },
    {
      id: 2,
      slot: "F1-A1-06",
      customer_name: "Jane Smith",
      phone_number: "09987654321",
      reserved_date: "2024-01-16",
      reserved_time: "16:30",
      duration_hours: 3,
      status: "active",
      arrival_time: "2024-01-16T16:25:00", // Arrived 5 minutes early
      parking_duration: 120, // Been parked for 2 hours
    },
    {
      id: 3,
      slot: "F2-B1-03",
      customer_name: "Mike Johnson",
      phone_number: "09111222333",
      reserved_date: "2024-01-15",
      reserved_time: "10:00",
      duration_hours: 4,
      status: "completed",
      arrival_time: "2024-01-15T10:00:00",
      parking_duration: 240, // Parked for 4 hours (completed)
    },
    {
      id: 4,
      slot: "F1-A1-07",
      customer_name: "Sarah Wilson",
      phone_number: "09444555666",
      reserved_date: "2024-01-17",
      reserved_time: "09:00",
      duration_hours: 1,
      status: "active",
      // No arrival_time means hasn't arrived yet
    },
    {
      id: 5,
      slot: "F2-A1-02",
      customer_name: "David Brown",
      phone_number: "09777888999",
      reserved_date: "2024-01-16",
      reserved_time: "18:00",
      duration_hours: 2,
      status: "active",
      // Upcoming reservation
    },
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReservations(mockReservations)
      setLoading(false)
    }, 1000)
  }, [])

  const handleArrival = async (reservationId: number) => {
    try {
      const currentTime = new Date().toISOString()

      setReservations((prev) =>
        prev.map((res) =>
          res.id === reservationId ? { ...res, arrival_time: currentTime, parking_duration: 0 } : res,
        ),
      )

      alert("Customer arrival recorded successfully!")
    } catch (error) {
      console.error("Error recording arrival:", error)
      alert("Failed to record arrival")
    }
  }

  const handleStatusChange = async (reservationId: number, newStatus: "completed" | "cancelled") => {
    try {
      if (newStatus === "cancelled") {
        await apiService.cancelReservation(reservationId)
      }

      setReservations((prev) => prev.map((res) => (res.id === reservationId ? { ...res, status: newStatus } : res)))

      alert(`Reservation ${newStatus} successfully`)
    } catch (error) {
      console.error("Error updating reservation:", error)
      alert("Failed to update reservation")
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.slot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone_number.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const formatParkingDuration = (minutes?: number) => {
    if (!minutes) return "Not arrived"

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const isReservationActive = (reservation: ExtendedReservation) => {
    return reservation.status === "active" && reservation.arrival_time
  }

  const isReservationUpcoming = (reservation: ExtendedReservation) => {
    const reservationDateTime = new Date(`${reservation.reserved_date}T${reservation.reserved_time}`)
    const now = new Date()

    return reservationDateTime > now && reservation.status === "active" && !reservation.arrival_time
  }

  const hasArrived = (reservation: ExtendedReservation) => {
    return reservation.arrival_time !== undefined
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

  const activeReservations = reservations.filter((r) => r.status === "active").length
  const completedReservations = reservations.filter((r) => r.status === "completed").length
  const upcomingReservations = reservations.filter((r) => isReservationUpcoming(r)).length
  const currentlyParked = reservations.filter((r) => isReservationActive(r)).length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Monitor Reservations</h1>
        <p className="text-gray-600">Track customer reservations and manage arrivals</p>
      </div>

      {/* Reservation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Reservations</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeReservations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Currently Parked</dt>
                  <dd className="text-lg font-medium text-gray-900">{currentlyParked}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Today</dt>
                  <dd className="text-lg font-medium text-gray-900">{upcomingReservations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">{completedReservations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Slot, customer name, or phone..."
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
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-medium text-gray-900">Reservations ({filteredReservations.length})</h2>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reservations found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReservations.map((reservation) => (
              <div key={reservation.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-500 text-white rounded-lg p-3">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{reservation.slot}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(reservation.status)}`}
                        >
                          {getStatusIcon(reservation.status)}
                          <span>{reservation.status.toUpperCase()}</span>
                        </span>
                        {isReservationActive(reservation) && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            PARKED
                          </span>
                        )}
                        {!hasArrived(reservation) && reservation.status === "active" && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            WAITING
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        <User className="inline h-4 w-4 mr-1" />
                        {reservation.customer_name} • <Phone className="inline h-4 w-4 mr-1" />
                        {reservation.phone_number}
                      </p>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>
                          Reserved:{" "}
                          {new Date(`${reservation.reserved_date}T${reservation.reserved_time}`).toLocaleString()}
                        </p>
                        {hasArrived(reservation) ? (
                          <p>
                            <Clock className="inline h-3 w-3 mr-1" />
                            Parked for: {formatParkingDuration(reservation.parking_duration)}
                          </p>
                        ) : (
                          <p>
                            <Clock className="inline h-3 w-3 mr-1" />
                            Expected duration: {reservation.duration_hours}h
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {reservation.status === "active" && !hasArrived(reservation) && (
                      <button
                        onClick={() => handleArrival(reservation.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Arrive</span>
                      </button>
                    )}

                    {reservation.status === "active" && hasArrived(reservation) && (
                      <>
                        <button
                          onClick={() => handleStatusChange(reservation.id, "completed")}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleStatusChange(reservation.id, "cancelled")}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {reservation.status === "completed" && (
                      <span className="text-sm text-green-600 font-medium">✓ Completed</span>
                    )}

                    {reservation.status === "cancelled" && (
                      <span className="text-sm text-red-600 font-medium">✗ Cancelled</span>
                    )}
                  </div>
                </div>

                {/* Additional Info for Clerks */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Slot Type:</span>
                      <div className="font-medium">VIP</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Floor:</span>
                      <div className="font-medium">Floor {reservation.slot.charAt(1)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-medium">{reservation.duration_hours}h</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className="font-medium capitalize">{reservation.status}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClerkMonitorReservations
