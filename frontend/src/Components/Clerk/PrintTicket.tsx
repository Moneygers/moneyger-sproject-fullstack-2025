"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import type { ParkingSlot } from "../../types"
import { Printer, Search, Download } from "lucide-react"

interface TicketData {
  slot_id: string
  license_plate: string
  customer_name?: string
  phone_number?: string
  start_time: string
  ticket_number: string
  slot_type: string
  floor: number
  section: string
}

const PrintTicket: React.FC = () => {
  const [occupiedSlots, setOccupiedSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [showPreview, setShowPreview] = useState(false)

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

  const generateTicket = (slot: ParkingSlot) => {
    const ticketData: TicketData = {
      slot_id: slot.id,
      license_plate: slot.current_allocation?.license_plate || "",
      customer_name: slot.current_allocation?.customer_name,
      phone_number: slot.current_allocation?.phone_number,
      start_time: slot.current_allocation?.start_time || "",
      ticket_number: `TKT-${Date.now()}`,
      slot_type: slot.slot_type,
      floor: slot.floor,
      section: slot.section,
    }

    setSelectedTicket(ticketData)
    setShowPreview(true)
  }

  const printTicket = () => {
    window.print()
  }

  const downloadTicket = () => {
    if (!selectedTicket) return

    const ticketContent = generateTicketHTML(selectedTicket)
    const blob = new Blob([ticketContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `parking-ticket-${selectedTicket.ticket_number}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateTicketHTML = (ticket: TicketData) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parking Ticket - ${ticket.ticket_number}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
          .ticket { border: 2px dashed #333; padding: 20px; text-align: center; }
          .header { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .ticket-number { font-size: 18px; color: #666; margin-bottom: 20px; }
          .info { text-align: left; margin: 10px 0; }
          .info strong { display: inline-block; width: 120px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">🏢 ParkManager</div>
          <div class="ticket-number">Ticket #${ticket.ticket_number}</div>
          
          <div class="info"><strong>Slot:</strong> ${ticket.slot_id}</div>
          <div class="info"><strong>License Plate:</strong> ${ticket.license_plate}</div>
          ${ticket.customer_name ? `<div class="info"><strong>Customer:</strong> ${ticket.customer_name}</div>` : ""}
          <div class="info"><strong>Floor:</strong> ${ticket.floor}</div>
          <div class="info"><strong>Section:</strong> ${ticket.section}</div>
          <div class="info"><strong>Type:</strong> ${ticket.slot_type.toUpperCase()}</div>
          <div class="info"><strong>Entry Time:</strong> ${new Date(ticket.start_time).toLocaleString()}</div>
          
          <div class="footer">
            <p>Please keep this ticket for payment and exit.</p>
            <p>Lost tickets will incur additional charges.</p>
          </div>
        </div>
      </body>
      </html>
    `
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
          <h1 className="text-2xl font-bold text-gray-900">Print Parking Ticket</h1>
          <p className="text-gray-600">Generate and print parking tickets for occupied slots</p>
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
            <Printer className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No occupied slots found</h3>
            <p className="mt-1 text-sm text-gray-500">All parking slots are currently available.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSlots.map((slot) => (
              <div key={slot.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-500 text-white rounded-lg p-3">
                      <Printer className="h-6 w-6" />
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

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="font-mono font-medium">{slot.current_allocation?.license_plate}</div>
                      {slot.current_allocation?.customer_name && (
                        <div className="text-sm text-gray-500">{slot.current_allocation.customer_name}</div>
                      )}
                      <div className="text-xs text-gray-400">
                        Entry: {new Date(slot.current_allocation?.start_time || "").toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => generateTicket(slot)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Generate Ticket</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Preview Modal */}
      {showPreview && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Ticket Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {/* Ticket Preview */}
            <div className="border-2 border-dashed border-gray-300 p-6 text-center mb-6" id="ticket-preview">
              <div className="text-2xl font-bold mb-2">🏢 ParkManager</div>
              <div className="text-lg text-gray-600 mb-4">Ticket #{selectedTicket.ticket_number}</div>

              <div className="text-left space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="font-medium">Slot:</span>
                  <span>{selectedTicket.slot_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">License Plate:</span>
                  <span className="font-mono">{selectedTicket.license_plate}</span>
                </div>
                {selectedTicket.customer_name && (
                  <div className="flex justify-between">
                    <span className="font-medium">Customer:</span>
                    <span>{selectedTicket.customer_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Floor:</span>
                  <span>{selectedTicket.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Section:</span>
                  <span>{selectedTicket.section}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Type:</span>
                  <span>{selectedTicket.slot_type.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Entry Time:</span>
                  <span>{new Date(selectedTicket.start_time).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 border-t pt-4">
                <p>Please keep this ticket for payment and exit.</p>
                <p>Lost tickets will incur additional charges.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={downloadTicket}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={printTicket}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrintTicket
