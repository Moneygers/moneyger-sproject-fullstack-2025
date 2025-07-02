"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../components/AdminLayout"
import "../../styles/admin/SystemSettings.css"

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    regularHourlyRate: 50,
    vipHourlyRate: 100,
    disabledHourlyRate: 30,
    maxParkingHours: 24,
    maxReservationDays: 7,
    enableReservations: true,
    enableNotifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/settings/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        console.error("Failed to fetch settings")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("http://localhost:8000/api/settings/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert("Settings saved successfully!")
      } else {
        alert("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    if (window.confirm("Are you sure you want to reset all settings to default values?")) {
      try {
        const response = await fetch("http://localhost:8000/api/settings/reset/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const defaultSettings = await response.json()
          setSettings(defaultSettings)
          alert("Settings reset to defaults successfully!")
        } else {
          alert("Failed to reset settings")
        }
      } catch (error) {
        console.error("Error resetting settings:", error)
        alert("Failed to reset settings")
      }
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="system-settings-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </AdminLayout>
    )
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
