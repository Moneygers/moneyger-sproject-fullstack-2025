"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../components/AdminLayout"
import { DollarSign, RotateCcw, Save } from "lucide-react"
import "../../styles/admin/SystemSettings.css"
import BASE_URL from '../../config';

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
      const response = await fetch(`${BASE_URL}/api/settings/`, {
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
      const response = await fetch(`${BASE_URL}/api/settings/`, {
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
        const response = await fetch(`${BASE_URL}/api/settings/reset/`, {
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
              <RotateCcw className="button-icon" size={16} />
              <span>Reset to Defaults</span>
            </button>
            <button onClick={handleSave} disabled={saving} className="save-button">
              <Save className="button-icon" size={16} />
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>

        <div className="settings-container">
          {/* Parking Settings */}
          <div className="settings-card">
            <div className="settings-header">
              <DollarSign className="settings-icon" size={20} />
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default SystemSettings
