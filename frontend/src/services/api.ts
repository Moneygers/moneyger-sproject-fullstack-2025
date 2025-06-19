// Mock data for testing without backend
const MOCK_USERS = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    email: "admin@parking.com",
    role: "admin" as const,
    first_name: "Admin",
    last_name: "User",
  },
  {
    id: 2,
    username: "clerk",
    password: "clerk123",
    email: "clerk@parking.com",
    role: "clerk" as const,
    first_name: "Clerk",
    last_name: "User",
  },
  {
    id: 3,
    username: "customer",
    password: "customer123",
    email: "customer@parking.com",
    role: "customer" as const,
    first_name: "Customer",
    last_name: "User",
  },
]

// Mock parking slots data
const MOCK_PARKING_SLOTS = [
  // Floor 1 - Ground Floor
  { id: "F1-A1-01", floor: 1, section: "A", slot_number: "01", status: "disabled", slot_type: "disabled" },
  { id: "F1-A1-02", floor: 1, section: "A", slot_number: "02", status: "disabled", slot_type: "disabled" },
  { id: "F1-A1-03", floor: 1, section: "A", slot_number: "03", status: "disabled", slot_type: "disabled" },
  { id: "F1-A1-04", floor: 1, section: "A", slot_number: "04", status: "disabled", slot_type: "disabled" },
  { id: "F1-A1-05", floor: 1, section: "A", slot_number: "05", status: "available", slot_type: "vip" },
  { id: "F1-A1-06", floor: 1, section: "A", slot_number: "06", status: "available", slot_type: "vip" },
  { id: "F1-A1-07", floor: 1, section: "A", slot_number: "07", status: "available", slot_type: "vip" },
  { id: "F1-A1-08", floor: 1, section: "A", slot_number: "08", status: "available", slot_type: "vip" },

  // Floor 1 - Section B
  { id: "F1-B1-01", floor: 1, section: "B", slot_number: "01", status: "available", slot_type: "regular" },
  {
    id: "F1-B1-02",
    floor: 1,
    section: "B",
    slot_number: "02",
    status: "occupied",
    slot_type: "regular",
    current_allocation: {
      id: 1,
      slot: "F1-B1-02",
      license_plate: "ABC-1234",
      start_time: "2024-01-15T08:30:00Z",
      customer_name: "John Doe",
      phone_number: "09123456789",
      is_active: true,
    },
  },
  { id: "F1-B1-03", floor: 1, section: "B", slot_number: "03", status: "available", slot_type: "regular" },
  {
    id: "F1-B1-04",
    floor: 1,
    section: "B",
    slot_number: "04",
    status: "occupied",
    slot_type: "regular",
    current_allocation: {
      id: 2,
      slot: "F1-B1-04",
      license_plate: "XYZ-5678",
      start_time: "2024-01-15T09:15:00Z",
      customer_name: "Jane Smith",
      phone_number: "09987654321",
      is_active: true,
    },
  },
  { id: "F1-B1-05", floor: 1, section: "B", slot_number: "05", status: "available", slot_type: "regular" },
  { id: "F1-B1-06", floor: 1, section: "B", slot_number: "06", status: "available", slot_type: "regular" },
  { id: "F1-B1-07", floor: 1, section: "B", slot_number: "07", status: "available", slot_type: "regular" },
  { id: "F1-B1-08", floor: 1, section: "B", slot_number: "08", status: "available", slot_type: "regular" },
  { id: "F1-B1-09", floor: 1, section: "B", slot_number: "09", status: "available", slot_type: "regular" },
  { id: "F1-B1-10", floor: 1, section: "B", slot_number: "10", status: "available", slot_type: "regular" },

  // Floor 2
  { id: "F2-A1-01", floor: 2, section: "A", slot_number: "01", status: "available", slot_type: "regular" },
  { id: "F2-A1-02", floor: 2, section: "A", slot_number: "02", status: "available", slot_type: "regular" },
  {
    id: "F2-A1-03",
    floor: 2,
    section: "A",
    slot_number: "03",
    status: "occupied",
    slot_type: "regular",
    current_allocation: {
      id: 3,
      slot: "F2-A1-03",
      license_plate: "DEF-9012",
      start_time: "2024-01-15T07:45:00Z",
      customer_name: "Mike Johnson",
      phone_number: "09111222333",
      is_active: true,
    },
  },
  { id: "F2-A1-04", floor: 2, section: "A", slot_number: "04", status: "available", slot_type: "regular" },
  { id: "F2-A1-05", floor: 2, section: "A", slot_number: "05", status: "available", slot_type: "regular" },
  { id: "F2-B1-01", floor: 2, section: "B", slot_number: "01", status: "available", slot_type: "regular" },
  { id: "F2-B1-02", floor: 2, section: "B", slot_number: "02", status: "available", slot_type: "regular" },
  { id: "F2-B1-03", floor: 2, section: "B", slot_number: "03", status: "available", slot_type: "regular" },
  { id: "F2-B1-04", floor: 2, section: "B", slot_number: "04", status: "available", slot_type: "regular" },
  { id: "F2-B1-05", floor: 2, section: "B", slot_number: "05", status: "available", slot_type: "regular" },

  // Floor 3
  { id: "F3-A1-01", floor: 3, section: "A", slot_number: "01", status: "available", slot_type: "regular" },
  { id: "F3-A1-02", floor: 3, section: "A", slot_number: "02", status: "available", slot_type: "regular" },
  { id: "F3-A1-03", floor: 3, section: "A", slot_number: "03", status: "available", slot_type: "regular" },
  { id: "F3-B1-01", floor: 3, section: "B", slot_number: "01", status: "available", slot_type: "regular" },
  { id: "F3-B1-02", floor: 3, section: "B", slot_number: "02", status: "available", slot_type: "regular" },
  { id: "F3-B1-03", floor: 3, section: "B", slot_number: "03", status: "available", slot_type: "regular" },

  // Floor 4 - Rooftop
  { id: "F4-A1-01", floor: 4, section: "A", slot_number: "01", status: "available", slot_type: "regular" },
  { id: "F4-A1-02", floor: 4, section: "A", slot_number: "02", status: "available", slot_type: "regular" },
  { id: "F4-A1-03", floor: 4, section: "A", slot_number: "03", status: "available", slot_type: "regular" },
  { id: "F4-B1-01", floor: 4, section: "B", slot_number: "01", status: "available", slot_type: "regular" },
  { id: "F4-B1-02", floor: 4, section: "B", slot_number: "02", status: "available", slot_type: "regular" },
]

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api"
const USE_MOCK_DATA = true // Set to false when backend is ready

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (USE_MOCK_DATA) {
      // Return mock data instead of making real API calls
      return this.mockRequest<T>(endpoint, options)
    }

    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/login"
      }
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const method = options.method || "GET"

    // Mock login endpoint
    if (endpoint === "/accounts/login/" && method === "POST") {
      const body = JSON.parse(options.body as string)
      const user = MOCK_USERS.find((u) => u.username === body.username && u.password === body.password)

      if (user) {
        const { password, ...userWithoutPassword } = user
        return {
          access: "mock-access-token",
          refresh: "mock-refresh-token",
          user: userWithoutPassword,
        } as T
      } else {
        throw new Error("Invalid credentials")
      }
    }

    // Mock logout endpoint
    if (endpoint === "/accounts/logout/" && method === "POST") {
      return { message: "Logged out successfully" } as T
    }

    // Mock get all slots
    if (endpoint === "/core/slots/" && method === "GET") {
      return { results: MOCK_PARKING_SLOTS, count: MOCK_PARKING_SLOTS.length } as T
    }

    // Mock get available slots
    if (endpoint === "/core/slots/available/" && method === "GET") {
      const availableSlots = MOCK_PARKING_SLOTS.filter((slot) => slot.status === "available")
      return { results: availableSlots, count: availableSlots.length } as T
    }

    // Mock search by license plate
    if (endpoint.startsWith("/core/slots/search/") && method === "GET") {
      const urlParams = new URLSearchParams(endpoint.split("?")[1])
      const plateNumber = urlParams.get("plate")

      if (plateNumber) {
        const foundSlot = MOCK_PARKING_SLOTS.find((slot) =>
          slot.current_allocation?.license_plate?.toLowerCase().includes(plateNumber.toLowerCase()),
        )

        if (foundSlot) {
          return {
            results: [
              {
                slot: {
                  id: foundSlot.id,
                  floor: foundSlot.floor,
                  section: foundSlot.section,
                  slot_type: foundSlot.slot_type,
                },
                allocation: foundSlot.current_allocation,
              },
            ],
            count: 1,
          } as T
        }
      }

      return { results: [], count: 0 } as T
    }

    // Mock slot allocation
    if (endpoint.includes("/allocate/") && method === "POST") {
      const slotId = endpoint.split("/")[2]
      const body = JSON.parse(options.body as string)

      // Find and update the slot
      const slotIndex = MOCK_PARKING_SLOTS.findIndex((slot) => slot.id === slotId)
      if (slotIndex !== -1) {
        MOCK_PARKING_SLOTS[slotIndex] = {
          ...MOCK_PARKING_SLOTS[slotIndex],
          status: "occupied" as const,
          current_allocation: {
            id: Date.now(),
            slot: slotId,
            license_plate: body.license_plate,
            start_time: new Date().toISOString(),
            customer_name: body.customer_name,
            phone_number: body.phone_number,
            is_active: true,
          },
        }
      }

      return { message: "Slot allocated successfully" } as T
    }

    // Mock slot release
    if (endpoint.includes("/release/") && method === "POST") {
      const slotId = endpoint.split("/")[2]

      // Find and update the slot
      const slotIndex = MOCK_PARKING_SLOTS.findIndex((slot) => slot.id === slotId)
      if (slotIndex !== -1) {
        MOCK_PARKING_SLOTS[slotIndex] = {
          ...MOCK_PARKING_SLOTS[slotIndex],
          status: "available" as const,
          current_allocation: undefined,
        }
      }

      return { message: "Slot released successfully" } as T
    }

    // Mock reservations
    if (endpoint === "/core/reservations/" && method === "GET") {
      return { results: [], count: 0 } as T
    }

    // Mock transactions
    if (endpoint === "/transactions/" && method === "GET") {
      return { results: [], count: 0 } as T
    }

    // Mock users (admin only)
    if (endpoint === "/accounts/users/" && method === "GET") {
      const usersWithoutPasswords = MOCK_USERS.map(({ password, ...user }) => user)
      return { results: usersWithoutPasswords, count: usersWithoutPasswords.length } as T
    }

    // Default mock response
    return { results: [], count: 0 } as T
  }

  // Authentication
  async login(username: string, password: string) {
    return this.request<any>("/accounts/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  }

  async logout() {
    return this.request("/accounts/logout/", { method: "POST" })
  }

  // Parking Slots
  async getAllSlots() {
    return this.request<any>("/core/slots/")
  }

  async getAvailableSlots() {
    return this.request<any>("/core/slots/available/")
  }

  async getSlotDetails(slotId: string) {
    return this.request<any>(`/core/slots/${slotId}/`)
  }

  async allocateSlot(slotId: string, data: any) {
    return this.request(`/core/slots/${slotId}/allocate/`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async releaseSlot(slotId: string) {
    return this.request(`/core/slots/${slotId}/release/`, {
      method: "POST",
    })
  }

  async searchSlotByPlate(plateNumber: string) {
    return this.request<any>(`/core/slots/search/?plate=${plateNumber}`)
  }

  // Reservations
  async getReservations() {
    return this.request<any>("/core/reservations/")
  }

  async createReservation(data: any) {
    return this.request("/core/reservations/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async cancelReservation(reservationId: number) {
    return this.request(`/core/reservations/${reservationId}/`, {
      method: "DELETE",
    })
  }

  // Transactions
  async getTransactions() {
    return this.request<any>("/transactions/")
  }

  async getTransactionDetails(transactionId: number) {
    return this.request<any>(`/transactions/${transactionId}/`)
  }

  // Users (Admin only)
  async getUsers() {
    return this.request<any>("/accounts/users/")
  }

  async createUser(data: any) {
    return this.request("/accounts/users/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateUser(userId: number, data: any) {
    return this.request(`/accounts/users/${userId}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteUser(userId: number) {
    return this.request(`/accounts/users/${userId}/`, {
      method: "DELETE",
    })
  }
}

export const apiService = new ApiService()
