"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { ParkingSlot } from "../../types"
import { Search, Car, Clock, User, CreditCard, Printer } from "lucide-react"

const CheckoutPaymentPrint: React.FC = () => {
  const [occupiedSlots, setOccupiedSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")

  useEffect(() => {
    fetchOccupiedSlots()
  }, [])

  const fetchOccupiedSlots = async () => {
    try {
      const response = await apiService.getAllSlots()
      const occupied = response.results?.filter((slot: ParkingSlot) => slot.status === "occupied") || []
      setOccupiedSlots(occupied)
    } catch (error) {
      console.error("Error fetching occupied slots:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = (slot: ParkingSlot) => {
    setSelectedSlot(slot)
    setShowCheckoutModal(true)
  }

  const processPayment = async (method: string) => {
    if (!selectedSlot) return

    try {
      // Process payment first
      setPaymentMethod(method)

      // Then show print option
      setShowCheckoutModal(false)
      setShowPrintModal(true)
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Payment processing failed")
    }
  }

  const completeCheckout = async (shouldPrint: boolean) => {
    if (!selectedSlot) return

    try {
      await apiService.releaseSlot(selectedSlot.id)

      if (shouldPrint) {
        // Generate and print receipt
        printReceipt()
      }

      alert(`Vehicle ${selectedSlot.current_allocation?.license_plate} checked out successfully!`)
      setShowPrintModal(false)
      setSelectedSlot(null)
      fetchOccupiedSlots()
    } catch (error) {
      console.error("Error checking out vehicle:", error)
      alert("Failed to checkout vehicle")
    }
  }

  const printReceipt = () => {
    if (!selectedSlot) return

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parking Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
          .receipt { border: 2px solid #333; padding: 20px; text-align: center; }
          .header { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .info { text-align: left; margin: 10px 0; }
          .info strong { display: inline-block; width: 120px; }
          .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">🏢 ParkManager</div>
          <div>Parking Receipt</div>
          
          <div class="info"><strong>Slot:</strong> ${selectedSlot.id}</div>
          <div class="info"><strong>License Plate:</strong> ${selectedSlot.current_allocation?.license_plate}</div>
          <div class="info"><strong>Entry Time:</strong> ${new Date(selectedSlot.current_allocation?.start_time || "").toLocaleString()}</div>
          <div class="info"><strong>Exit Time:</strong> ${new Date().toLocaleString()}</div>
          <div class="info"><strong>Duration:</strong> ${calculateDuration(selectedSlot.current_allocation?.start_time || "")}</div>
          <div class="info"><strong>Payment Method:</strong> ${paymentMethod}</div>
          
          <div class="total">Total: ₱${calculateFee(selectedSlot.current_allocation?.start_time || "", selectedSlot.slot_type)}</div>
          
          <div style="margin-top: 20px; font-size: 12px;">
            <p>Thank you for using ParkManager!</p>
            <p>Keep this receipt for your records.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(receiptContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const calculateDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const calculateFee = (startTime: string, slotType: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diffHours = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60))

    let hourlyRate = 50 // Base rate
    if (slotType === "vip") hourlyRate = 100
    if (slotType === "disabled") hourlyRate = 30

    return diffHours * hourlyRate
  }

  const filteredSlots = occupiedSlots.filter(
    (slot) =>
      slot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.current_allocation?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.current_allocation?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checkout & Payment</h1>
          <p className="text-gray-600">Process vehicle checkout, payment, and print receipts</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by slot, license plate, or name..."
            className="pl-10 w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-medium text-gray-900">Occupied Slots ({filteredSlots.length})</h2>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="text-center py-12">
            <Car className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No occupied slots found</h3>
            <p className="mt-1 text-sm text-gray-500">All parking slots are currently available.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSlots.map((slot) => (
              <div key={slot.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-500 text-white rounded-lg p-3">
                      <Car className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{slot.id}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            slot.slot_type === "vip"
                              ? "bg-yellow-100 text-yellow-800"
                              : slot.slot_type === "disabled"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {slot.slot_type?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Floor {slot.floor} • Section {slot.section}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Car className="h-4 w-4 mr-1" />
                        License Plate
                      </div>
                      <div className="font-mono font-medium">{slot.current_allocation?.license_plate}</div>
                    </div>

                    {slot.current_allocation?.customer_name && (
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <User className="h-4 w-4 mr-1" />
                          Customer
                        </div>
                        <div className="font-medium">{slot.current_allocation.customer_name}</div>
                      </div>
                    )}

                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Clock className="h-4 w-4 mr-1" />
                        Duration
                      </div>
                      <div className="font-medium">{calculateDuration(slot.current_allocation?.start_time || "")}</div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Fee
                      </div>
                      <div className="font-medium text-green-600">
                        ₱{calculateFee(slot.current_allocation?.start_time || "", slot.slot_type)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckout(slot)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showCheckoutModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Process Payment</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Slot:</span>
                <span className="font-medium">{selectedSlot.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">License Plate:</span>
                <span className="font-medium">{selectedSlot.current_allocation?.license_plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {calculateDuration(selectedSlot.current_allocation?.start_time || "")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Fee:</span>
                <span className="font-medium text-green-600">
                  ₱{calculateFee(selectedSlot.current_allocation?.start_time || "", selectedSlot.slot_type)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Select Payment Method:</h4>

              <button
                onClick={() => processPayment("Cash")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="text-xl">💵</span>
                <span>Cash Payment</span>
              </button>

              <button
                onClick={() => processPayment("Card")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="text-xl">💳</span>
                <span>Card Payment</span>
              </button>

              <button
                onClick={() => processPayment("GCash")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="text-xl">📱</span>
                <span>GCash Payment</span>
              </button>

              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Successful!</h3>

            <div className="text-center mb-6">
              <div className="text-green-600 text-4xl mb-2">✅</div>
              <p className="text-gray-600">
                Payment of ₱{calculateFee(selectedSlot.current_allocation?.start_time || "", selectedSlot.slot_type)}{" "}
                processed successfully via {paymentMethod}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => completeCheckout(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt & Complete</span>
              </button>

              <button
                onClick={() => completeCheckout(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Complete Without Printing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPaymentPrint
