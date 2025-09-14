-- Create prescriptions table for managing patient prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(255) PRIMARY KEY,
    patient_id VARCHAR(255) NOT NULL,
    doctor_id VARCHAR(255) NOT NULL,
    appointment_id VARCHAR(255),
    prescription_text TEXT NOT NULL,
    file_url VARCHAR(500),
    medications JSONB,
    instructions TEXT,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(issued_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);

-- Insert sample prescriptions
INSERT INTO prescriptions (id, patient_id, doctor_id, appointment_id, prescription_text, medications, instructions, issued_date) VALUES
('presc-001', 'patient-001', 'doctor-001', 'apt-001', 'Amoxicillin 500mg - Take twice daily after meals for 7 days. Paracetamol 650mg - Take as needed for fever, maximum 4 times daily.', 
 '[{"name": "Amoxicillin", "dosage": "500mg", "frequency": "twice daily", "duration": "7 days"}, {"name": "Paracetamol", "dosage": "650mg", "frequency": "as needed", "duration": "ongoing"}]',
 'Take twice daily after meals. Complete the full course even if feeling better.', '2024-01-10'),
('presc-002', 'patient-002', 'doctor-002', NULL, 'Metformin 500mg - Take twice daily with meals. Lisinopril 10mg - Take once daily in the morning.',
 '[{"name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "duration": "ongoing"}, {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "duration": "ongoing"}]',
 'Monitor blood sugar levels regularly. Take with meals to reduce stomach upset.', '2024-01-12')
ON CONFLICT (id) DO NOTHING;
