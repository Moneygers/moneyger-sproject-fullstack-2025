"use client"

import { useState } from "react"
import AdminLayout from "../../components/AdminLayout"
import "../../styles/admin/SystemSettings.css"

const SystemSettings = () => {
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

  const handleInputChange = (e) => {
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
    if (window.confirm("Are you sure you want to reset all settings to default values?")) {
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
    <AdminLayout>
      <div className="system-settings-container">
        <div className="system-settings-header">
          <div className="header-content">
            <h1 className="main-title">System Settings</h1>
            <p className="subtitle">Configure parking rates and system parameters</p>
          </div>
          <div className="header-actions">
            <button onClick={resetToDefaults} className="reset-button">
              <span className="button-icon">🔄</span>
              <span>Reset to Defaults</span>
            </button>
            <button onClick={handleSave} disabled={saving} className="save-button">
              <span className="button-icon">💾</span>
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>

        <div className="settings-container">
          {/* Parking Settings */}
          <div className="settings-card">
            <div className="settings-header">
              <span className="settings-icon">💰</span>
              <h2 className="settings-title">Parking Configuration</h2>
            </div>

            <div className="settings-content">
              <div className="settings-grid">
                <div className="setting-group">
                  <label className="setting-label">Regular Hourly Rate (₱)</label>
                  <input
                    type="number"
                    name="regularHourlyRate"
                    value={settings.regularHourlyRate}
                    onChange={handleInputChange}
                    className="setting-input"
                  />
                </div>

                <div className="setting-group">
                  <label className="setting-label">VIP Hourly Rate (₱)</label>
                  <input
                    type="number"
                    name="vipHourlyRate"
                    value={settings.vipHourlyRate}
                    onChange={handleInputChange}
                    className="setting-input"
                  />
                </div>

                <div className="setting-group">
                  <label className="setting-label">Disabled Access Rate (₱)</label>
                  <input
                    type="number"
                    name="disabledHourlyRate"
                    value={settings.disabledHourlyRate}
                    onChange={handleInputChange}
                    className="setting-input"
                  />
                </div>

                <div className="setting-group">
                  <label className="setting-label">Maximum Parking Hours</label>
                  <input
                    type="number"
                    name="maxParkingHours"
                    value={settings.maxParkingHours}
                    onChange={handleInputChange}
                    className="setting-input"
                  />
                </div>

                <div className="setting-group">
                  <label className="setting-label">Maximum Reservation Days</label>
                  <input
                    type="number"
                    name="maxReservationDays"
                    value={settings.maxReservationDays}
                    onChange={handleInputChange}
                    className="setting-input"
                  />
                </div>
              </div>

              <div className="checkbox-settings">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    name="enableNotifications"
                    checked={settings.enableNotifications}
                    onChange={handleInputChange}
                    className="setting-checkbox"
                    id="enableNotifications"
                  />
                  <label htmlFor="enableNotifications" className="checkbox-label">
                    Enable System Notifications
                  </label>
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    name="enableReservations"
                    checked={settings.enableReservations}
                    onChange={handleInputChange}
                    className="setting-checkbox"
                    id="enableReservations"
                  />
                  <label htmlFor="enableReservations" className="checkbox-label">
                    Enable Online Reservations
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default SystemSettings
