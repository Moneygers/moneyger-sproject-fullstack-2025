"use client"

import { useState, useEffect } from "react"
import {
  Car,
  CreditCard,
  Smartphone,
  Printer,
  DollarSign,
  Clock,
  RotateCcw,
  CheckCircle,
  Star,
  Accessibility,
} from "lucide-react"
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
  const [parkingRates, setParkingRates] = useState(null)
  const [ratesLoaded, setRatesLoaded] = useState(false)
  const [ratesError, setRatesError] = useState(null)

  useEffect(() => {
    fetchParkingRates()
    fetchOccupiedSlots()
  }, [])

  const fetchParkingRates = async () => {
    try {
      console.log("Fetching parking rates from system settings...")
      setRatesError(null)

      const response = await fetch("http://localhost:8000/api/settings/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const settings = await response.json()
        console.log("Fetched system settings:", settings)

        if (!settings.regularHourlyRate || !settings.vipHourlyRate || !settings.disabledHourlyRate) {
          throw new Error("Missing parking rates in system settings")
        }

        const rates = {
          regular: Number(settings.regularHourlyRate),
          vip: Number(settings.vipHourlyRate),
          disabled: Number(settings.disabledHourlyRate),
        }

        console.log("Parsed parking rates from database:", rates)
        setParkingRates(rates)
        setRatesLoaded(true)
      } else {
        const errorText = await response.text()
        console.error("Failed to fetch system settings:", response.status, response.statusText, errorText)
        throw new Error(`Failed to fetch parking rates: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error fetching parking rates:", error)
      setRatesError(error.message)
      setRatesLoaded(false)
      setParkingRates(null)
    }
  }

  const fetchOccupiedSlots = async () => {
    try {
      // Use the detailed occupied slots endpoint that includes reservation information
      const response = await fetch("http://localhost:8000/api/slots/occupied-detailed/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Fetched occupied slots with details:", data)
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

  const getActualStartTime = (slot) => {
    // For reservations, use the arrival_time if available, otherwise use start_time
    if (slot.current_allocation?.customer_name) {
      // This is a reservation - we need to get the actual arrival time
      // The backend should provide this in the current_allocation
      return slot.current_allocation?.start_time
    } else {
      // This is a direct payment - use the payment creation time
      return slot.current_allocation?.start_time
    }
  }

  const getInitialFee = (slotType) => {
    if (!parkingRates) return 0

    // Initial fee is the same as the hourly rate from database
    if (slotType === "vip") {
      return parkingRates.vip
    } else if (slotType === "disabled") {
      return parkingRates.disabled
    } else {
      return parkingRates.regular
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
      // Get the actual start time that should match backend
      const actualStartTime = getActualStartTime(selectedSlot)

      // Calculate frontend fee for debugging using the correct start time
      const frontendCalculation = calculateFeeDebug(actualStartTime, selectedSlot.slot_type)

      console.log("=== CHECKOUT DEBUG START ===")
      console.log("Selected Slot:", selectedSlot)
      console.log("Actual Start Time Used:", actualStartTime)
      console.log("Frontend Calculation:", frontendCalculation)
      console.log("Payment Method:", paymentMethod)
      console.log("Should Print:", shouldPrint)

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
        console.log("Backend Checkout Result:", result)

        // Detailed comparison logging
        console.log("=== CALCULATION COMPARISON ===")
        console.log("Frontend Initial Fee:", frontendCalculation.initialFee)
        console.log("Backend Initial Fee:", result.initial_fee)
        console.log("Frontend Additional Fee:", frontendCalculation.additionalFee)
        console.log("Backend Additional Fee:", result.additional_fee)
        console.log("Frontend Total Fee:", frontendCalculation.totalFee)
        console.log("Backend Total Fee:", result.total_fee)
        console.log("Frontend Rate:", frontendCalculation.rate)
        console.log("Backend Rate:", result.hourly_rate)
        console.log("Frontend Minutes:", frontendCalculation.minutes)
        console.log("Backend Minutes:", result.duration_minutes)
        console.log("Start Time (Frontend):", frontendCalculation.startTime)
        console.log("Start Time (Backend):", result.start_time)
        console.log("End Time (Backend):", result.end_time)
        console.log("Duration (Backend):", result.duration)
        console.log("Slot Type:", selectedSlot.slot_type)
        console.log("Is Reservation:", !!selectedSlot.current_allocation?.customer_name)
        console.log("Reservation Updated:", result.reservation_updated)
        console.log("Checkout Type:", result.checkout_type)

        // Check if times match
        const frontendStartTime = new Date(frontendCalculation.startTime)
        const backendStartTime = new Date(result.start_time)
        const timeDifference = Math.abs(frontendStartTime.getTime() - backendStartTime.getTime()) / 1000 // in seconds
        console.log("Time Difference (seconds):", timeDifference)
        console.log("Times Match (within 5 seconds):", timeDifference < 5)

        // Check if calculations match
        const calculationsMatch = frontendCalculation.totalFee === result.total_fee
        console.log("Calculations Match:", calculationsMatch)

        console.log("=== CHECKOUT DEBUG END ===")

        if (shouldPrint) {
          printReceipt(result)
        }

        // Show different messages based on whether it was a reservation or direct payment
        const isReservation = selectedSlot.current_allocation?.customer_name
        const checkoutType = result.checkout_type || (isReservation ? "reservation" : "payment")
        const updateInfo = result.reservation_updated
          ? " (Reservation completed)"
          : result.payment_created
            ? " (Payment recorded)"
            : ""

        alert(
          `Vehicle ${selectedSlot.current_allocation?.license_plate} checked out successfully!\n` +
            `${checkoutType.charAt(0).toUpperCase() + checkoutType.slice(1)} completed.\n` +
            `Initial Fee: ₱${result.initial_fee}\n` +
            `Additional Fee: ₱${result.additional_fee}\n` +
            `Total Fee: ₱${result.total_fee}${updateInfo}\n\n` +
            `Calculations ${calculationsMatch ? "MATCH" : "DO NOT MATCH"} - Check console for details.`,
        )

        setShowPrintModal(false)
        setSelectedSlot(null)
        fetchOccupiedSlots()
      } else {
        const errorData = await response.json()
        console.error("Checkout error:", errorData)
        alert(`Failed to checkout vehicle: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error checking out vehicle:", error)
      alert("Failed to checkout vehicle")
    }
  }

  const printReceipt = (receiptData) => {
    if (!selectedSlot) return

    const isReservation = selectedSlot.current_allocation?.customer_name
    const customerName = selectedSlot.current_allocation?.customer_name || "N/A"

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
      .reservation-info { background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 5px; }
      .fee-breakdown { background: #f9f9f9; padding: 10px; margin: 10px 0; border-radius: 5px; }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header">🏢 ParkManager</div>
      <div>Parking Receipt</div>
      
      ${
        isReservation
          ? `
      <div class="reservation-info">
        <strong>RESERVATION CHECKOUT</strong>
      </div>
      `
          : ""
      }
      
      <div class="info"><strong>Slot:</strong> ${getSlotDisplayId(selectedSlot)}</div>
      <div class="info"><strong>License Plate:</strong> ${selectedSlot.current_allocation?.license_plate}</div>
      ${isReservation ? `<div class="info"><strong>Customer:</strong> ${customerName}</div>` : ""}
      <div class="info"><strong>Slot Type:</strong> ${selectedSlot.slot_type?.toUpperCase() || "REGULAR"}</div>
      <div class="info"><strong>Entry Time:</strong> ${new Date(receiptData?.start_time || getActualStartTime(selectedSlot) || "").toLocaleString()}</div>
      <div class="info"><strong>Exit Time:</strong> ${new Date(receiptData?.end_time || "").toLocaleString()}</div>
      <div class="info"><strong>Duration:</strong> ${receiptData?.duration || "N/A"}</div>
      <div class="info"><strong>Rate:</strong> ₱${receiptData?.hourly_rate || 0}/min</div>
      <div class="info"><strong>Payment Method:</strong> ${receiptData?.payment_method || paymentMethod}</div>
      
      <div class="fee-breakdown">
        <div class="info"><strong>Initial Fee:</strong> ₱${receiptData?.initial_fee?.toFixed(2) || "0.00"}</div>
        <div class="info"><strong>Additional Fee:</strong> ₱${receiptData?.additional_fee?.toFixed(2) || "0.00"}</div>
      </div>
      
      <div class="total">Total: ₱${receiptData?.total_fee?.toFixed(2) || "0.00"}</div>
      
      <div style="margin-top: 20px; font-size: 12px;">
        <p>Thank you for using ParkManager!</p>
        <p>Keep this receipt for your records.</p>
        ${isReservation ? "<p><em>Reservation completed successfully</em></p>" : ""}
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

  const calculateFee = (startTime, slotType, isReservation = false) => {
    if (!startTime || !parkingRates) return 0

    const start = new Date(startTime)
    const now = new Date()
    // Calculate duration in minutes
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60))

    // Get initial fee and hourly rate based on slot type (both same from database)
    const initialFee = getInitialFee(slotType)
    const hourlyRate = parkingRates[slotType] || parkingRates.regular

    // Calculate additional fee based on minutes
    const additionalFee = diffMinutes * hourlyRate
    const totalFee = initialFee + additionalFee

    console.log(
      `Fee calculation: ${slotType} slot, Initial: ₱${initialFee}, ${diffMinutes} minutes * ₱${hourlyRate}/min = ₱${additionalFee}, Total: ₱${totalFee} ${isReservation ? "(Reservation)" : "(Payment)"}`,
    )

    return totalFee
  }

  const calculateFeeDebug = (startTime, slotType) => {
    if (!startTime || !parkingRates) {
      return {
        totalFee: 0,
        initialFee: 0,
        additionalFee: 0,
        rate: 0,
        minutes: 0,
        startTime: null,
        debug: "Missing start time or parking rates",
      }
    }

    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    // Get initial fee and hourly rate based on slot type (both same from database)
    const initialFee = getInitialFee(slotType)
    const hourlyRate = parkingRates[slotType] || parkingRates.regular

    // Calculate additional fee based on minutes
    const additionalFee = diffMinutes * hourlyRate
    const totalFee = initialFee + additionalFee

    return {
      totalFee: totalFee,
      initialFee: initialFee,
      additionalFee: additionalFee,
      rate: hourlyRate,
      minutes: diffMinutes,
      startTime: start.toISOString(),
      endTime: now.toISOString(),
      diffMs: diffMs,
      slotType: slotType || "regular",
      calculation: `₱${initialFee} + (${diffMinutes} × ₱${hourlyRate}) = ₱${totalFee}`,
    }
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

  const getSlotTypeIcon = (slotType) => {
    switch (slotType) {
      case "vip":
        return <Star size={16} />
      case "disabled":
        return <Accessibility size={16} />
      default:
        return <Car size={16} />
    }
  }

  const getSlotTypeBadge = (slotType) => {
    switch (slotType) {
      case "vip":
        return "slot-type-vip"
      case "disabled":
        return "slot-type-disabled"
      default:
        return "slot-type-regular"
    }
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
            <p>Loading occupied slots...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (ratesError || !parkingRates) {
    return (
      <Layout>
        <div className="checkout-vehicle-container">
          <div className="error-container">
            <h2>Unable to Load Parking Rates</h2>
            <p>Error: {ratesError || "Failed to fetch parking rates from database"}</p>
            <button onClick={fetchParkingRates} className="retry-button">
              <RotateCcw size={16} /> Retry
            </button>
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
            <h1 className="main-title">Vehicle Checkout & Payment</h1>
            <p className="subtitle">Process vehicle checkout, payment, and print receipts</p>
            <div className="rates-info">
              <small>
                Initial Fees: Regular ₱{parkingRates.regular} | VIP ₱{parkingRates.vip} | Disabled ₱
                {parkingRates.disabled} + /Hour additional
              </small>
            </div>
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
            <button
              onClick={() => {
                fetchParkingRates()
                fetchOccupiedSlots()
              }}
              className="refresh-button"
            >
              <RotateCcw size={16} /> Refresh
            </button>
          </div>

          {filteredSlots.length === 0 ? (
            <div className="no-slots">
              <div className="no-slots-icon">
                <Car size={48} />
              </div>
              <h3 className="no-slots-title">No occupied slots found</h3>
              <p className="no-slots-text">
                {occupiedSlots.length === 0
                  ? "All parking slots are currently available."
                  : "No slots match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="slots-grid">
              {filteredSlots.map((slot) => (
                <div key={slot.id} className="slot-card">
                  <div className="slot-card-header">
                    <div className="slot-info-section">
                      <div className="slot-id-badge">
                        <span className="slot-icon">{getSlotTypeIcon(slot.slot_type)}</span>
                        <span className="slot-id">{getSlotDisplayId(slot)}</span>
                      </div>
                      <div className={`slot-type-badge ${getSlotTypeBadge(slot.slot_type)}`}>
                        {slot.slot_type?.toUpperCase() || "REGULAR"}
                      </div>
                    </div>
                    <div className="slot-location">
                      Floor {slot.floor || (slot.structure ? slot.structure.replace("FLOOR", "") : "1")} • Section{" "}
                      {slot.section}
                    </div>
                  </div>

                  <div className="vehicle-info-section">
                    <div className="vehicle-header">
                      <div className="vehicle-icon">
                        <Car size={20} />
                      </div>
                      <div className="vehicle-details">
                        <div className="license-plate">{slot.current_allocation?.license_plate || "N/A"}</div>
                        {slot.current_allocation?.customer_name && (
                          <div className="customer-name">{slot.current_allocation.customer_name}</div>
                        )}
                        {/* Show if this is from a reservation */}
                        {slot.current_allocation?.customer_name && (
                          <div className="allocation-type">
                            <span className="reservation-badge">Reservation</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="parking-details-section">
                    <div className="detail-row">
                      <div className="detail-item">
                        <div className="detail-label">
                          <span className="detail-icon">
                            <Clock size={16} />
                          </span>
                          Entry Time
                        </div>
                        <div className="detail-value">
                          {getActualStartTime(slot) ? new Date(getActualStartTime(slot)).toLocaleString() : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-item">
                        <div className="detail-label">
                          <span className="detail-icon">
                            <Clock size={16} />
                          </span>
                          Duration
                        </div>
                        <div className="detail-value duration">{calculateDuration(getActualStartTime(slot))}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">
                          <span className="detail-icon">
                            <DollarSign size={16} />
                          </span>
                          Total Fee
                        </div>
                        <div className="detail-value fee">
                          ₱{calculateFee(getActualStartTime(slot), slot.slot_type).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button onClick={() => handleCheckout(slot)} className="checkout-button">
                      <span className="button-icon">
                        <CreditCard size={16} />
                      </span>
                      <span>Process Checkout</span>
                    </button>
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
                {selectedSlot.current_allocation?.customer_name && (
                  <div className="summary-row">
                    <span className="summary-label">Customer:</span>
                    <span className="summary-value">{selectedSlot.current_allocation.customer_name}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span className="summary-label">Type:</span>
                  <span className="summary-value">
                    {selectedSlot.current_allocation?.customer_name ? "Reservation Checkout" : "Direct Parking"}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Duration:</span>
                  <span className="summary-value">{calculateDuration(getActualStartTime(selectedSlot))}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Initial Fee:</span>
                  <span className="summary-value">₱{getInitialFee(selectedSlot.slot_type).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Rate:</span>
                  <span className="summary-value">
                    ₱
                    {selectedSlot.slot_type === "vip"
                      ? parkingRates.vip
                      : selectedSlot.slot_type === "disabled"
                        ? parkingRates.disabled
                        : parkingRates.regular}
                    /min
                  </span>
                </div>
                <div className="summary-row total-row">
                  <span className="summary-label">Total Fee:</span>
                  <span className="summary-value fee">
                    ₱
                    {calculateFee(
                      getActualStartTime(selectedSlot),
                      selectedSlot.slot_type,
                      !!selectedSlot.current_allocation?.customer_name,
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="payment-methods">
                <h4 className="payment-methods-title">Select Payment Method:</h4>

                <button onClick={() => processPayment("Cash")} className="payment-method-button">
                  <span className="payment-icon">
                    <DollarSign size={20} />
                  </span>
                  <span>Cash Payment</span>
                </button>

                <button onClick={() => processPayment("GCash")} className="payment-method-button">
                  <span className="payment-icon">
                    <Smartphone size={20} />
                  </span>
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
                <div className="success-icon">
                  <CheckCircle size={48} />
                </div>
                <p className="success-text">Payment processed successfully via {paymentMethod}</p>
              </div>

              <div className="print-actions">
                <button onClick={() => completeCheckout(true)} className="print-receipt-button">
                  <span className="button-icon">
                    <Printer size={16} />
                  </span>
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
