"use client"

import type React from "react"
import { useState } from "react"
import { Wrench, Database, HardDrive, RefreshCw, AlertTriangle, CheckCircle, Download } from "lucide-react"

interface SystemStatus {
  database: "healthy" | "warning" | "error"
  storage: "healthy" | "warning" | "error"
  api: "healthy" | "warning" | "error"
  backup: "healthy" | "warning" | "error"
}

const SystemMaintenance: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: "healthy",
    storage: "warning",
    api: "healthy",
    backup: "healthy",
  })
  const [loading, setLoading] = useState(false)
  const [lastBackup, setLastBackup] = useState("2024-01-15 02:00:00")
  const [storageUsed, setStorageUsed] = useState(75)

  const runSystemCheck = async () => {
    setLoading(true)
    // Simulate system check
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Simulate random status updates
    setSystemStatus({
      database: Math.random() > 0.8 ? "warning" : "healthy",
      storage: storageUsed > 80 ? "warning" : "healthy",
      api: "healthy",
      backup: Math.random() > 0.9 ? "error" : "healthy",
    })
    setLoading(false)
    alert("System check completed!")
  }

  const createBackup = async () => {
    if (confirm("Create a new system backup? This may take several minutes.")) {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setLastBackup(new Date().toLocaleString())
      setLoading(false)
      alert("Backup created successfully!")
    }
  }

  const clearCache = async () => {
    if (confirm("Clear system cache? This will temporarily slow down the system.")) {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setLoading(false)
      alert("Cache cleared successfully!")
    }
  }

  const optimizeDatabase = async () => {
    if (confirm("Optimize database? This may take several minutes and affect system performance.")) {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 4000))
      setSystemStatus((prev) => ({ ...prev, database: "healthy" }))
      setLoading(false)
      alert("Database optimization completed!")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Maintenance</h1>
          <p className="text-gray-600">Monitor system health and perform maintenance tasks</p>
        </div>
        <button
          onClick={runSystemCheck}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Run System Check</span>
        </button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-blue-500" />
              <h3 className="font-medium text-gray-900">Database</h3>
            </div>
            {getStatusIcon(systemStatus.database)}
          </div>
          <div className={`text-sm font-medium ${getStatusColor(systemStatus.database)}`}>
            {systemStatus.database.toUpperCase()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {systemStatus.database === "healthy" ? "All connections stable" : "Performance degraded"}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-6 w-6 text-green-500" />
              <h3 className="font-medium text-gray-900">Storage</h3>
            </div>
            {getStatusIcon(systemStatus.storage)}
          </div>
          <div className={`text-sm font-medium ${getStatusColor(systemStatus.storage)}`}>
            {systemStatus.storage.toUpperCase()}
          </div>
          <div className="text-xs text-gray-500 mt-1">{storageUsed}% used (2.1GB / 2.8GB)</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-6 w-6 text-purple-500" />
              <h3 className="font-medium text-gray-900">API Services</h3>
            </div>
            {getStatusIcon(systemStatus.api)}
          </div>
          <div className={`text-sm font-medium ${getStatusColor(systemStatus.api)}`}>
            {systemStatus.api.toUpperCase()}
          </div>
          <div className="text-xs text-gray-500 mt-1">Response time: 120ms</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Download className="h-6 w-6 text-orange-500" />
              <h3 className="font-medium text-gray-900">Backup System</h3>
            </div>
            {getStatusIcon(systemStatus.backup)}
          </div>
          <div className={`text-sm font-medium ${getStatusColor(systemStatus.backup)}`}>
            {systemStatus.backup.toUpperCase()}
          </div>
          <div className="text-xs text-gray-500 mt-1">Last: {lastBackup}</div>
        </div>
      </div>

      {/* Maintenance Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Database Maintenance</h2>
          <div className="space-y-4">
            <button
              onClick={optimizeDatabase}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Database className="h-4 w-4" />
              <span>Optimize Database</span>
            </button>

            <button
              onClick={createBackup}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Create Backup</span>
            </button>

            <div className="text-sm text-gray-600">
              <p>• Database size: 45.2 MB</p>
              <p>• Last optimization: 3 days ago</p>
              <p>• Backup frequency: Daily at 2:00 AM</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Cleanup</h2>
          <div className="space-y-4">
            <button
              onClick={clearCache}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Clear System Cache</span>
            </button>

            <button
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Clean Temporary Files</span>
            </button>

            <div className="text-sm text-gray-600">
              <p>• Cache size: 12.8 MB</p>
              <p>• Temporary files: 3.2 MB</p>
              <p>• Log files: 8.9 MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-medium text-gray-900">Recent System Events</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            { time: "2024-01-15 14:30:22", type: "info", message: "System backup completed successfully" },
            { time: "2024-01-15 12:15:45", type: "warning", message: "Storage usage exceeded 75%" },
            { time: "2024-01-15 10:22:11", type: "info", message: "Database optimization started" },
            { time: "2024-01-15 09:45:33", type: "error", message: "Failed to connect to backup server" },
            { time: "2024-01-15 08:30:00", type: "info", message: "Daily maintenance routine completed" },
          ].map((log, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    log.type === "error" ? "bg-red-500" : log.type === "warning" ? "bg-yellow-500" : "bg-green-500"
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{log.message}</div>
                  <div className="text-xs text-gray-500">{log.time}</div>
                </div>
                <div
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    log.type === "error"
                      ? "bg-red-100 text-red-800"
                      : log.type === "warning"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {log.type.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SystemMaintenance
