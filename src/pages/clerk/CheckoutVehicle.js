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
      const response = await fetch("http://localhost:8000/api/slots/?status=occupied", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Fetched occupied slots:", data)
        setOccupiedSlots(data)
      } else {
        console.error("Failed to fetch occupied slots:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
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
      setPaymentMethod(method)
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
      const response = await fetch(`http://localhost:8000/api/slots/${selectedSlot.id}/checkout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          print_receipt: shouldPrint,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        if (shouldPrint) {
          printReceipt(result)
        }

        alert(`Vehicle ${selectedSlot.current_allocation?.license_plate} checked out successfully!`)
        setShowPrintModal(false)
        setSelectedSlot(null)
        fetchOccupiedSlots()
      } else {
        const errorData = await response.json()
        alert(`Failed to checkout vehicle: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error checking out vehicle:", error)
      alert("Failed to checkout vehicle")
    }
  }

  const printReceipt = (receiptData) => {
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
          
          <div class="info"><strong>Slot:</strong> ${selectedSlot.display_id || selectedSlot.id}</div>
          <div class="info"><strong>License Plate:</strong> ${selectedSlot.current_allocation?.license_plate}</div>
          <div class="info"><strong>Entry Time:</strong> ${new Date(selectedSlot.current_allocation?.start_time || "").toLocaleString()}</div>
          <div class="info"><strong>Exit Time:</strong> ${new Date().toLocaleString()}</div>
          <div class="info"><strong>Duration:</strong> ${receiptData?.duration || "N/A"}</div>
          <div class="info"><strong>Payment Method:</strong> ${paymentMethod}</div>
          
          <div class="total">Total: ₱${receiptData?.total_fee || "0.00"}</div>
          
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
    if (!startTime) return "N/A"
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const calculateFee = (startTime, slotType) => {
    if (!startTime) return 0
    const start = new Date(startTime)
    const now = new Date()
    const diffHours = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60))

    let hourlyRate = 50 // Base rate
    if (slotType === "vip") hourlyRate = 100
    if (slotType === "disabled") hourlyRate = 30

    return diffHours * hourlyRate
  }

  const getSlotDisplayId = (slot) => {
    if (slot.display_id) return slot.display_id

    // Extract floor number from structure (FLOOR1 -> 1)
    let floor = 1
    if (slot.structure) {
      const floorMatch = slot.structure.match(/FLOOR(\d+)/)
      if (floorMatch) {
        floor = Number.parseInt(floorMatch[1])
      }
    } else if (slot.floor) {
      floor = slot.floor
    }

    return `F${floor}-${slot.section}-${slot.slotNo}`
  }

  const filteredSlots = occupiedSlots.filter(
    (slot) =>
      getSlotDisplayId(slot)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <p className="no-slots-text">
                {occupiedSlots.length === 0
                  ? "All parking slots are currently available."
                  : "No slots match your search criteria."}
              </p>
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
                          <h3 className="slot-id">{getSlotDisplayId(slot)}</h3>
                          <span className={`slot-type ${slot.slot_type}`}>{slot.slot_type?.toUpperCase()}</span>
                        </div>
                        <p className="slot-location">
                          Floor {slot.floor || (slot.structure ? slot.structure.replace("FLOOR", "") : "1")} • Section{" "}
                          {slot.section}
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
                          <div className="info-value">{slot.current_allocation?.license_plate || "N/A"}</div>
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
                          <div className="info-value">{calculateDuration(slot.current_allocation?.start_time)}</div>
                        </div>

                        <div className="info-item">
                          <div className="info-label">
                            <span className="info-icon">💳</span>
                            Fee
                          </div>
                          <div className="info-value fee">
                            ₱{calculateFee(slot.current_allocation?.start_time, slot.slot_type)}
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
                  <span className="summary-value">{getSlotDisplayId(selectedSlot)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">License Plate:</span>
                  <span className="summary-value">{selectedSlot.current_allocation?.license_plate}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Duration:</span>
                  <span className="summary-value">
                    {calculateDuration(selectedSlot.current_allocation?.start_time)}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total Fee:</span>
                  <span className="summary-value fee">
                    ₱{calculateFee(selectedSlot.current_allocation?.start_time, selectedSlot.slot_type)}
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
                  Payment of ₱{calculateFee(selectedSlot.current_allocation?.start_time, selectedSlot.slot_type)}{" "}
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
