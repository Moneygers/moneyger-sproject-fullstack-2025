// API Response Types
export interface User {
  id: number
  username: string
  email: string
  role: "admin" | "clerk" | "customer"
  first_name: string
  last_name: string
}

export interface ParkingSlot {
  id: string
  floor: number
  section: string
  slot_number: string
  status: "available" | "occupied" | "disabled" | "reserved"
  slot_type: "regular" | "vip" | "disabled"
  current_allocation?: Allocation
}

export interface Allocation {
  id: number
  slot: string
  license_plate: string
  start_time: string
  end_time?: string
  customer_name?: string
  phone_number?: string
  is_active: boolean
}

export interface Reservation {
  id: number
  slot: string
  customer_name: string
  phone_number: string
  reserved_date: string
  reserved_time: string
  duration_hours: number
  status: "active" | "completed" | "cancelled"
}

export interface Transaction {
  id: number
  allocation: number
  amount: number
  transaction_type: "parking_fee" | "reservation_fee"
  payment_method: string
  created_at: string
  receipt_number: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface ApiResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}
