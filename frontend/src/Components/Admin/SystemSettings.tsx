"use client"

import type React from "react"
import { useState } from "react"
import { Save, RefreshCw, DollarSign } from "lucide-react"

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // Parking Settings
    regularHourlyRate: 50,
    vipHourlyRate: 100,
    disabledHourlyRate: 30,
    maxParkingHours: 24,
    maxReservationDays: 7,
    enableReservations: true,
    enableNotifications: true,
  })

  const [saving, setSaving] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setSaving(false)
    alert("Settings saved successfully!")
  }

  const resetToDefaults = () => {
    if (confirm("Are you sure you want to reset all settings to default values?")) {
      setSettings({
        regularHourlyRate: 50,
        vipHourlyRate: 100,
        disabledHourlyRate: 30,
        maxParkingHours: 24,
        maxReservationDays: 7,
        enableReservations: true,
        enableNotifications: true,
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure parking rates and system parameters</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={resetToDefaults}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* Parking Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <DollarSign className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-medium text-gray-900">Parking Configuration</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Regular Hourly Rate (₱)</label>
                <input
                  type="number"
                  name="regularHourlyRate"
                  value={settings.regularHourlyRate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIP Hourly Rate (₱)</label>
                <input
                  type="number"
                  name="vipHourlyRate"
                  value={settings.vipHourlyRate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disabled Access Rate (₱)</label>
                <input
                  type="number"
                  name="disabledHourlyRate"
                  value={settings.disabledHourlyRate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Parking Hours</label>
                <input
                  type="number"
                  name="maxParkingHours"
                  value={settings.maxParkingHours}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Reservation Days</label>
                <input
                  type="number"
                  name="maxReservationDays"
                  value={settings.maxReservationDays}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="enableNotifications"
                  checked={settings.enableNotifications}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Enable System Notifications</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="enableReservations"
                  checked={settings.enableReservations}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Enable Online Reservations</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings
