-- Create health records table for patient medical history
CREATE TABLE IF NOT EXISTS health_records (
    id VARCHAR(255) PRIMARY KEY,
    patient_id VARCHAR(255) NOT NULL,
    record_type VARCHAR(100) NOT NULL CHECK (record_type IN ('vital_signs', 'diagnosis', 'lab_result', 'allergy', 'vaccination', 'medical_history')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    values JSONB,
    recorded_by VARCHAR(255),
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    file_attachments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(uid) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_health_records_patient ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON health_records(recorded_date);
CREATE INDEX IF NOT EXISTS idx_health_records_recorded_by ON health_records(recorded_by);

-- Insert sample health records
INSERT INTO health_records (id, patient_id, record_type, title, description, values, recorded_by, recorded_date) VALUES
('record-001', 'patient-001', 'vital_signs', 'Blood Pressure Check', 'Routine BP monitoring', 
 '{"systolic": 120, "diastolic": 80, "pulse": 72, "temperature": 98.6}', 'doctor-001', '2024-01-10'),
('record-002', 'patient-002', 'diagnosis', 'Type 2 Diabetes', 'Diagnosed with Type 2 Diabetes Mellitus',
 '{"condition": "Type 2 Diabetes", "severity": "moderate", "onset": "2023-06-15"}', 'doctor-002', '2023-06-15'),
('record-003', 'patient-001', 'allergy', 'Penicillin Allergy', 'Patient allergic to penicillin-based antibiotics',
 '{"allergen": "Penicillin", "reaction": "skin rash", "severity": "moderate"}', 'doctor-001', '2024-01-05')
ON CONFLICT (id) DO NOTHING;
