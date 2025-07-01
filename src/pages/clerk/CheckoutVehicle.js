"use client"

import { useState, useEffect } from "react"
import "../../styles/clerk/CheckoutVehicle.css"
import Layout from "../../components/Layout"

const CheckoutVehicle = () => {
  const [occupiedSlots, setOccupiedSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")

  useEffect(() => {
    fetchOccupiedSlots()
  }, [])

  const fetchOccupiedSlots = async () => {
    try {
      // Mock data - replace with actual API call
      const mockSlots = [
        {
          id: "F1-A1-02",
          floor: 1,
          section: "A",
          status: "occupied",
          slot_type: "regular",
          current_allocation: {
            license_plate: "ABC-123",
            customer_name: "John Doe",
            start_time: "2024-01-15T10:00:00Z",
          },
        },
        {
          id: "F1-B1-01",
          floor: 1,
          section: "B",
          status: "occupied",
          slot_type: "vip",
          current_allocation: {
            license_plate: "XYZ-789",
            customer_name: "Jane Smith",
            start_time: "2024-01-15T09:30:00Z",
          },
        },
        {
          id: "F2-A1-03",
          floor: 2,
          section: "A",
          status: "occupied",
          slot_type: "regular",
          current_allocation: {
            license_plate: "DEF-456",
            customer_name: "Mike Johnson",
            start_time: "2024-01-15T11:15:00Z",
          },
        },
      ]
      setOccupiedSlots(mockSlots)
    } catch (error) {
      console.error("Error fetching occupied slots:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = (slot) => {
    setSelectedSlot(slot)
    setShowCheckoutModal(true)
  }

  const processPayment = async (method) => {
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

  const completeCheckout = async (shouldPrint) => {
    if (!selectedSlot) return

    try {
      // Mock API call to release slot
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (shouldPrint) {
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

  const calculateDuration = (startTime) => {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const calculateFee = (startTime, slotType) => {
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
      <Layout>
        <div className="checkout-vehicle-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="checkout-vehicle-container">
        <div className="checkout-vehicle-header">
          <div className="header-content">
            <h1 className="main-title">Checkout & Payment</h1>
            <p className="subtitle">Process vehicle checkout, payment, and print receipts</p>
          </div>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search by slot, license plate, or name..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="occupied-slots-section">
          <div className="section-header">
            <h2 className="section-title">Occupied Slots ({filteredSlots.length})</h2>
          </div>

          {filteredSlots.length === 0 ? (
            <div className="no-slots">
              <div className="no-slots-icon">🚗</div>
              <h3 className="no-slots-title">No occupied slots found</h3>
              <p className="no-slots-text">All parking slots are currently available.</p>
            </div>
          ) : (
            <div className="slots-list">
              {filteredSlots.map((slot) => (
                <div key={slot.id} className="slot-item">
                  <div className="slot-content">
                    <div className="slot-info">
                      <div className="slot-icon">🚗</div>
                      <div className="slot-details">
                        <div className="slot-header">
                          <h3 className="slot-id">{slot.id}</h3>
                          <span className={`slot-type ${slot.slot_type}`}>{slot.slot_type?.toUpperCase()}</span>
                        </div>
                        <p className="slot-location">
                          Floor {slot.floor} • Section {slot.section}
                        </p>
                      </div>
                    </div>

                    <div className="checkout-info">
                      <div className="info-grid">
                        <div className="info-item">
                          <div className="info-label">
                            <span className="info-icon">🚗</span>
                            License Plate
                          </div>
                          <div className="info-value">{slot.current_allocation?.license_plate}</div>
                        </div>

                        {slot.current_allocation?.customer_name && (
                          <div className="info-item">
                            <div className="info-label">
                              <span className="info-icon">👤</span>
                              Customer
                            </div>
                            <div className="info-value">{slot.current_allocation.customer_name}</div>
                          </div>
                        )}

                        <div className="info-item">
                          <div className="info-label">
                            <span className="info-icon">⏰</span>
                            Duration
                          </div>
                          <div className="info-value">
                            {calculateDuration(slot.current_allocation?.start_time || "")}
                          </div>
                        </div>

                        <div className="info-item">
                          <div className="info-label">
                            <span className="info-icon">💳</span>
                            Fee
                          </div>
                          <div className="info-value fee">
                            ₱{calculateFee(slot.current_allocation?.start_time || "", slot.slot_type)}
                          </div>
                        </div>
                      </div>

                      <button onClick={() => handleCheckout(slot)} className="checkout-button">
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
          <div className="modal-overlay">
            <div className="payment-modal">
              <h3 className="modal-title">Process Payment</h3>

              <div className="payment-summary">
                <div className="summary-row">
                  <span className="summary-label">Slot:</span>
                  <span className="summary-value">{selectedSlot.id}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">License Plate:</span>
                  <span className="summary-value">{selectedSlot.current_allocation?.license_plate}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Duration:</span>
                  <span className="summary-value">
                    {calculateDuration(selectedSlot.current_allocation?.start_time || "")}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total Fee:</span>
                  <span className="summary-value fee">
                    ₱{calculateFee(selectedSlot.current_allocation?.start_time || "", selectedSlot.slot_type)}
                  </span>
                </div>
              </div>

              <div className="payment-methods">
                <h4 className="payment-methods-title">Select Payment Method:</h4>

                <button onClick={() => processPayment("Cash")} className="payment-method-button">
                  <span className="payment-icon">💵</span>
                  <span>Cash Payment</span>
                </button>

                <button onClick={() => processPayment("Card")} className="payment-method-button">
                  <span className="payment-icon">💳</span>
                  <span>Card Payment</span>
                </button>

                <button onClick={() => processPayment("GCash")} className="payment-method-button">
                  <span className="payment-icon">📱</span>
                  <span>GCash Payment</span>
                </button>

                <button onClick={() => setShowCheckoutModal(false)} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Modal */}
        {showPrintModal && selectedSlot && (
          <div className="modal-overlay">
            <div className="print-modal">
              <h3 className="modal-title">Payment Successful!</h3>

              <div className="success-content">
                <div className="success-icon">✅</div>
                <p className="success-text">
                  Payment of ₱{calculateFee(selectedSlot.current_allocation?.start_time || "", selectedSlot.slot_type)}{" "}
                  processed successfully via {paymentMethod}
                </p>
              </div>

              <div className="print-actions">
                <button onClick={() => completeCheckout(true)} className="print-receipt-button">
                  <span className="button-icon">🖨️</span>
                  <span>Print Receipt & Complete</span>
                </button>

                <button onClick={() => completeCheckout(false)} className="complete-button">
                  Complete Without Printing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default CheckoutVehicle
