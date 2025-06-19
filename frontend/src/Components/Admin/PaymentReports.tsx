"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { DollarSign, TrendingUp, CreditCard } from "lucide-react"

const PaymentReports: React.FC = () => {
  const [loading, setLoading] = useState(true)

  // Mock data for charts
  const dailyData = [
    { name: "Mon", revenue: 1200 },
    { name: "Tue", revenue: 1900 },
    { name: "Wed", revenue: 800 },
    { name: "Thu", revenue: 2400 },
    { name: "Fri", revenue: 3200 },
    { name: "Sat", revenue: 2800 },
    { name: "Sun", revenue: 2100 },
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

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
        <h1 className="text-2xl font-bold text-gray-900">Payment Reports</h1>
        <p className="text-gray-600">View payment analytics and revenue insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₱14,500</dd>
                  <dd className="text-sm text-green-600">+12% from last week</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Transactions</dt>
                  <dd className="text-lg font-medium text-gray-900">127</dd>
                  <dd className="text-sm text-blue-600">+8% from last week</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Transaction</dt>
                  <dd className="text-lg font-medium text-gray-900">₱114</dd>
                  <dd className="text-sm text-purple-600">+3% from last week</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Peak Hour</dt>
                  <dd className="text-lg font-medium text-gray-900">2-4 PM</dd>
                  <dd className="text-sm text-orange-600">₱2,400 revenue</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Revenue</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {dailyData.map((day, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="bg-blue-500 w-full rounded-t" style={{ height: `${(day.revenue / 3200) * 200}px` }}></div>
              <div className="text-xs text-gray-600 mt-2">{day.name}</div>
              <div className="text-xs text-gray-500">₱{day.revenue}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PaymentReports
