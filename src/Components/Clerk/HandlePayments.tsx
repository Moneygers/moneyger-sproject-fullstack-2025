"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CreditCard, DollarSign, Receipt, Search } from "lucide-react"

interface Payment {
  id: number
  slot_id: string
  license_plate: string
  customer_name?: string
  amount: number
  payment_method: string
  status: "pending" | "completed" | "failed"
  created_at: string
}

const HandlePayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Mock payment data
  const mockPayments: Payment[] = [
    {
      id: 1,
      slot_id: "F1-B1-02",
      license_plate: "ABC-1234",
      customer_name: "John Doe",
      amount: 150,
      payment_method: "cash",
      status: "pending",
      created_at: "2024-01-15T10:30:00Z",
    },
    {
      id: 2,
      slot_id: "F1-B1-04",
      license_plate: "XYZ-5678",
      customer_name: "Jane Smith",
      amount: 200,
      payment_method: "card",
      status: "completed",
      created_at: "2024-01-15T09:15:00Z",
    },
    {
      id: 3,
      slot_id: "F2-A1-03",
      license_plate: "DEF-9012",
      customer_name: "Mike Johnson",
      amount: 300,
      payment_method: "gcash",
      status: "pending",
      created_at: "2024-01-15T08:45:00Z",
    },
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPayments(mockPayments)
      setLoading(false)
    }, 1000)
  }, [])

  const handlePayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowPaymentModal(true)
  }

  const processPayment = async (paymentMethod: string) => {
    if (!selectedPayment) return

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update payment status
      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedPayment.id ? { ...p, status: "completed" as const, payment_method: paymentMethod } : p,
        ),
      )

      alert(`Payment of ₱${selectedPayment.amount} processed successfully via ${paymentMethod}`)
      setShowPaymentModal(false)
      setSelectedPayment(null)
    } catch (error) {
      alert("Payment processing failed")
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.slot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const totalCompleted = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Handle Payments</h1>
        <p className="text-gray-600">Process parking payments and manage transactions</p>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                  <dd className="text-lg font-medium text-gray-900">₱{totalPending.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                  <dd className="text-lg font-medium text-gray-900">₱{totalCompleted.toFixed(2)}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                  <dd className="text-lg font-medium text-gray-900">{payments.length}</dd>
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
                placeholder="Slot, license plate, or customer..."
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
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
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

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-medium text-gray-900">Payment Transactions</h2>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getPaymentMethodIcon(payment.payment_method)}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{payment.slot_id}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}
                        >
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {payment.license_plate} • {payment.customer_name}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(payment.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-medium text-gray-900">₱{payment.amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500 capitalize">{payment.payment_method}</div>
                    </div>

                    {payment.status === "pending" && (
                      <button
                        onClick={() => handlePayment(payment)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Process Payment
                      </button>
                    )}

                    {payment.status === "completed" && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Print Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Processing Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Process Payment</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Slot:</span>
                <span className="font-medium">{selectedPayment.slot_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{selectedPayment.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-green-600">₱{selectedPayment.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Select Payment Method:</h4>

              <button
                onClick={() => processPayment("cash")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="text-xl">💵</span>
                <span>Cash Payment</span>
              </button>

              <button
                onClick={() => processPayment("card")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="text-xl">💳</span>
                <span>Card Payment</span>
              </button>

              <button
                onClick={() => processPayment("gcash")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="text-xl">📱</span>
                <span>GCash Payment</span>
              </button>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HandlePayments
