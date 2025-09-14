-- Create appointments table for scheduling consultations
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(255) PRIMARY KEY,
    patient_id VARCHAR(255) NOT NULL,
    doctor_id VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow-up', 'emergency')),
    symptoms TEXT,
    notes TEXT,
    room_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(uid) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Insert sample appointments
INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, appointment_type, symptoms, room_id) VALUES
('apt-001', 'patient-001', 'doctor-001', '2024-01-15', '10:00:00', 'confirmed', 'consultation', 'Fever, cough', 'room-abc123def'),
('apt-002', 'patient-002', 'doctor-002', '2024-01-15', '14:30:00', 'pending', 'follow-up', 'Hypertension check', 'room-xyz789ghi'),
('apt-003', 'patient-003', 'doctor-001', '2024-01-16', '09:00:00', 'confirmed', 'consultation', 'Headache, fatigue', 'room-mno456pqr')
ON CONFLICT (id) DO NOTHING;
