"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Transaction } from "../../types"
import { Receipt, Search, DollarSign, TrendingUp } from "lucide-react"

const ReviewTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [typeFilter, setTypeFilter] = useState("all")

  // Mock transaction data
  const mockTransactions: Transaction[] = [
    {
      id: 1,
      allocation: 1,
      amount: 150,
      transaction_type: "parking_fee",
      payment_method: "cash",
      created_at: "2024-01-15T10:30:00Z",
      receipt_number: "RCP-001",
    },
    {
      id: 2,
      allocation: 2,
      amount: 200,
      transaction_type: "parking_fee",
      payment_method: "card",
      created_at: "2024-01-15T11:15:00Z",
      receipt_number: "RCP-002",
    },
    {
      id: 3,
      allocation: 3,
      amount: 50,
      transaction_type: "reservation_fee",
      payment_method: "gcash",
      created_at: "2024-01-15T12:00:00Z",
      receipt_number: "RCP-003",
    },
    {
      id: 4,
      allocation: 4,
      amount: 300,
      transaction_type: "parking_fee",
      payment_method: "card",
      created_at: "2024-01-15T14:30:00Z",
      receipt_number: "RCP-004",
    },
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTransactions(mockTransactions)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payment_method.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || transaction.transaction_type === typeFilter

    // For date filter, we'll just show all for now
    return matchesSearch && matchesType
  })

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return "💵"
      case "card":
        return "💳"
      case "gcash":
        return "📱"
      default:
        return "💰"
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "parking_fee":
        return "bg-blue-100 text-blue-800"
      case "reservation_fee":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0)
  const parkingFees = transactions
    .filter((t) => t.transaction_type === "parking_fee")
    .reduce((sum, t) => sum + t.amount, 0)
  const reservationFees = transactions
    .filter((t) => t.transaction_type === "reservation_fee")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Payment Transactions</h1>
        <p className="text-gray-600">Monitor and review all payment transactions</p>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₱{totalRevenue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Receipt className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Parking Fees</dt>
                  <dd className="text-lg font-medium text-gray-900">₱{parkingFees.toFixed(2)}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Reservation Fees</dt>
                  <dd className="text-lg font-medium text-gray-900">₱{reservationFees.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
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
                placeholder="Receipt number or payment method..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="parking_fee">Parking Fees</option>
              <option value="reservation_fee">Reservation Fees</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("")
                setDateFilter("today")
                setTypeFilter("all")
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-medium text-gray-900">Transactions ({filteredTransactions.length})</h2>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getPaymentMethodIcon(transaction.payment_method)}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{transaction.receipt_number}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.transaction_type)}`}
                        >
                          {transaction.transaction_type.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{transaction.payment_method} payment</p>
                      <p className="text-xs text-gray-400">{new Date(transaction.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Plate Number</div>
                      <div className="font-medium">ABC-{transaction.id}123</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">Duration</div>
                      <div className="font-medium">
                        {Math.floor(Math.random() * 5) + 1}h {Math.floor(Math.random() * 60)}m
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-medium text-gray-900">₱{transaction.amount.toFixed(2)}</div>
                      <div className="text-sm text-green-600">Completed</div>
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

export default ReviewTransactions
