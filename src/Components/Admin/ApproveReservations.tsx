"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { Reservation } from "../../types"
import { CheckCircle, XCircle, Clock, User, Phone, Calendar } from "lucide-react"

const ApproveReservations: React.FC = () => {
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  // Mock pending reservations data
  const mockPendingReservations: Reservation[] = [
    {
      id: 5,
      slot: "F1-A1-05",
      customer_name: "Alice Brown",
      phone_number: "09777888999",
      reserved_date: "2024-01-17",
      reserved_time: "15:00",
      duration_hours: 3,
      status: "active", // In real app, this would be "pending"
    },
    {
      id: 6,
      slot: "F1-A1-06",
      customer_name: "Bob Wilson",
      phone_number: "09666777888",
      reserved_date: "2024-01-18",
      reserved_time: "10:30",
      duration_hours: 2,
      status: "active", // In real app, this would be "pending"
    },
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPendingReservations(mockPendingReservations)
      setLoading(false)
    }, 1000)
  }, [])

  const handleApproval = async (reservationId: number, approved: boolean) => {
    try {
      if (approved) {
        // In real app, call API to approve reservation
        alert("Reservation approved successfully!")
      } else {
        await apiService.cancelReservation(reservationId)
        alert("Reservation rejected successfully!")
      }

      // Remove from pending list
      setPendingReservations((prev) => prev.filter((res) => res.id !== reservationId))
    } catch (error) {
      console.error("Error processing reservation:", error)
      alert("Failed to process reservation")
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Approve Parking Reservations</h1>
        <p className="text-gray-600">Review and approve pending parking reservations</p>
      </div>

      {/* Summary */}
      <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pending Approvals</dt>
                <dd className="text-lg font-medium text-gray-900">{pendingReservations.length}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reservations */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-medium text-gray-900">Pending Reservations</h2>
        </div>

        {pendingReservations.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending reservations</h3>
            <p className="mt-1 text-sm text-gray-500">All reservations have been processed.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingReservations.map((reservation) => (
              <div key={reservation.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-yellow-500 text-white rounded-lg p-3">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{reservation.slot}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          PENDING APPROVAL
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="h-4 w-4 mr-1" />
                          {reservation.customer_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-4 w-4 mr-1" />
                          {reservation.phone_number}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(`${reservation.reserved_date}T${reservation.reserved_time}`).toLocaleString()} •{" "}
                        {reservation.duration_hours}h duration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleApproval(reservation.id, true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleApproval(reservation.id, false)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Reservation Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date & Time:</span>
                      <div className="font-medium">
                        {new Date(`${reservation.reserved_date}T${reservation.reserved_time}`).toLocaleDateString()} at{" "}
                        {reservation.reserved_time}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Slot Type:</span>
                      <div className="font-medium">VIP Parking</div>
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

export default ApproveReservations
