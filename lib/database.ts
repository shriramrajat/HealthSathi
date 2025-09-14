// Database connection and query utilities
export interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
}

// Database schema types based on our SQL tables
export interface User {
  uid: string
  email: string
  name: string
  role: "patient" | "doctor" | "pharmacy" | "chw"
  age?: number
  phone?: string
  village?: string
  qr_id: string
  created_at: Date
  updated_at: Date
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  appointment_type: "consultation" | "follow-up" | "emergency"
  symptoms?: string
  notes?: string
  room_id?: string
  created_at: Date
  updated_at: Date
}

export interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  appointment_id?: string
  prescription_text: string
  file_url?: string
  medications?: any[]
  instructions?: string
  issued_date: string
  created_at: Date
  updated_at: Date
}

export interface PharmacyInventory {
  id: string
  pharmacy_id: string
  medicine_name: string
  category?: string
  current_stock: number
  min_stock: number
  max_stock: number
  price: number
  expiry_date?: string
  supplier?: string
  batch_number?: string
  created_at: Date
  updated_at: Date
}

export interface CHWCase {
  id: string
  chw_id: string
  patient_id?: string
  patient_name: string
  village: string
  case_type: "Routine Checkup" | "Emergency" | "Preventive Care" | "Follow-up" | "Vaccination" | "Health Education"
  symptoms?: string
  notes?: string
  status: "active" | "completed" | "referred" | "scheduled"
  priority: "low" | "normal" | "high" | "urgent"
  case_date: string
  follow_up_date?: string
  created_at: Date
  updated_at: Date
}

export interface ConsultationSession {
  id: string
  appointment_id?: string
  room_id: string
  patient_id: string
  doctor_id: string
  session_status: "scheduled" | "active" | "completed" | "cancelled"
  start_time?: Date
  end_time?: Date
  duration_minutes?: number
  consultation_notes?: string
  recording_url?: string
  chat_messages?: any[]
  created_at: Date
  updated_at: Date
}

export interface MedicationOrder {
  id: string
  prescription_id: string
  pharmacy_id: string
  patient_id: string
  doctor_id: string
  order_status: "pending" | "processing" | "ready" | "completed" | "cancelled"
  medications: any[]
  total_amount: number
  order_date: string
  ready_date?: string
  pickup_date?: string
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface HealthRecord {
  id: string
  patient_id: string
  record_type: "vital_signs" | "diagnosis" | "lab_result" | "allergy" | "vaccination" | "medical_history"
  title: string
  description?: string
  values?: any
  recorded_by?: string
  recorded_date: string
  file_attachments?: any[]
  created_at: Date
  updated_at: Date
}

// Database service class for handling queries
export class DatabaseService {
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  // User operations
  async createUser(user: Omit<User, "created_at" | "updated_at">): Promise<User> {
    // TODO: Implement with actual database connection
    console.log("Creating user:", user)
    return { ...user, created_at: new Date(), updated_at: new Date() }
  }

  async getUserById(uid: string): Promise<User | null> {
    // TODO: Implement with actual database connection
    console.log("Getting user by ID:", uid)
    return null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // TODO: Implement with actual database connection
    console.log("Getting user by email:", email)
    return null
  }

  // Appointment operations
  async createAppointment(appointment: Omit<Appointment, "created_at" | "updated_at">): Promise<Appointment> {
    // TODO: Implement with actual database connection
    console.log("Creating appointment:", appointment)
    return { ...appointment, created_at: new Date(), updated_at: new Date() }
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    // TODO: Implement with actual database connection
    console.log("Getting appointments for patient:", patientId)
    return []
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    // TODO: Implement with actual database connection
    console.log("Getting appointments for doctor:", doctorId)
    return []
  }

  // Prescription operations
  async createPrescription(prescription: Omit<Prescription, "created_at" | "updated_at">): Promise<Prescription> {
    // TODO: Implement with actual database connection
    console.log("Creating prescription:", prescription)
    return { ...prescription, created_at: new Date(), updated_at: new Date() }
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    // TODO: Implement with actual database connection
    console.log("Getting prescriptions for patient:", patientId)
    return []
  }

  // Pharmacy operations
  async getPharmacyInventory(pharmacyId: string): Promise<PharmacyInventory[]> {
    // TODO: Implement with actual database connection
    console.log("Getting inventory for pharmacy:", pharmacyId)
    return []
  }

  async updateInventoryStock(inventoryId: string, newStock: number): Promise<void> {
    // TODO: Implement with actual database connection
    console.log("Updating inventory stock:", inventoryId, newStock)
  }

  // CHW operations
  async createCHWCase(chwCase: Omit<CHWCase, "created_at" | "updated_at">): Promise<CHWCase> {
    // TODO: Implement with actual database connection
    console.log("Creating CHW case:", chwCase)
    return { ...chwCase, created_at: new Date(), updated_at: new Date() }
  }

  async getCHWCases(chwId: string): Promise<CHWCase[]> {
    // TODO: Implement with actual database connection
    console.log("Getting CHW cases:", chwId)
    return []
  }

  // Consultation operations
  async createConsultationSession(
    session: Omit<ConsultationSession, "created_at" | "updated_at">,
  ): Promise<ConsultationSession> {
    // TODO: Implement with actual database connection
    console.log("Creating consultation session:", session)
    return { ...session, created_at: new Date(), updated_at: new Date() }
  }

  async updateConsultationSession(sessionId: string, updates: Partial<ConsultationSession>): Promise<void> {
    // TODO: Implement with actual database connection
    console.log("Updating consultation session:", sessionId, updates)
  }

  // Health records operations
  async createHealthRecord(record: Omit<HealthRecord, "created_at" | "updated_at">): Promise<HealthRecord> {
    // TODO: Implement with actual database connection
    console.log("Creating health record:", record)
    return { ...record, created_at: new Date(), updated_at: new Date() }
  }

  async getHealthRecords(patientId: string): Promise<HealthRecord[]> {
    // TODO: Implement with actual database connection
    console.log("Getting health records for patient:", patientId)
    return []
  }
}

// Export a default database service instance
export const db = new DatabaseService({
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "rural_health",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
})
