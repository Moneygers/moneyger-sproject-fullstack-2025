"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import { Car, Calendar, Receipt } from "lucide-react"

interface DashboardStats {
  totalSlots: number
  availableSlots: number
  occupiedSlots: number
  reservations: number
  todayRevenue: number
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSlots: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    reservations: 0,
    todayRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [slotsResponse, reservationsResponse, transactionsResponse] = await Promise.all([
        apiService.getAllSlots(),
        apiService.getReservations(),
        apiService.getTransactions(),
      ])

      const totalSlots = slotsResponse.results?.length || 0
      const availableSlots = slotsResponse.results?.filter((slot: any) => slot.status === "available").length || 0
      const occupiedSlots = totalSlots - availableSlots
      const reservations = reservationsResponse.results?.filter((res: any) => res.status === "active").length || 0

      // Calculate today's revenue
      const today = new Date().toISOString().split("T")[0]
      const todayTransactions =
        transactionsResponse.results?.filter((trans: any) => trans.created_at.startsWith(today)) || []
      const todayRevenue = todayTransactions.reduce(
        (sum: number, trans: any) => sum + Number.parseFloat(trans.amount),
        0,
      )

      setStats({
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservations,
        todayRevenue,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Available Slots</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.availableSlots} / {stats.totalSlots}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Occupied Slots</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.occupiedSlots}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Reservations</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.reservations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Receipt className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₱{stats.todayRevenue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Occupancy Rate</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  Occupied
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {stats.totalSlots > 0 ? Math.round((stats.occupiedSlots / stats.totalSlots) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{
                  width: `${stats.totalSlots > 0 ? (stats.occupiedSlots / stats.totalSlots) * 100 : 0}%`,
                }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              View All Parking Slots
            </button>
            <button className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              Create New Reservation
            </button>
            <button className="w-full text-left px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
              Generate Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
