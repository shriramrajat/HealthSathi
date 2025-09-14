-- Create CHW cases table for community health worker case management
CREATE TABLE IF NOT EXISTS chw_cases (
    id VARCHAR(255) PRIMARY KEY,
    chw_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255),
    patient_name VARCHAR(255) NOT NULL,
    village VARCHAR(255) NOT NULL,
    case_type VARCHAR(100) NOT NULL CHECK (case_type IN ('Routine Checkup', 'Emergency', 'Preventive Care', 'Follow-up', 'Vaccination', 'Health Education')),
    symptoms TEXT,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'referred', 'scheduled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    case_date DATE NOT NULL DEFAULT CURRENT_DATE,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chw_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(uid) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chw_cases_chw ON chw_cases(chw_id);
CREATE INDEX IF NOT EXISTS idx_chw_cases_patient ON chw_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_chw_cases_village ON chw_cases(village);
CREATE INDEX IF NOT EXISTS idx_chw_cases_status ON chw_cases(status);
CREATE INDEX IF NOT EXISTS idx_chw_cases_date ON chw_cases(case_date);
CREATE INDEX IF NOT EXISTS idx_chw_cases_priority ON chw_cases(priority);

-- Insert sample CHW cases
INSERT INTO chw_cases (id, chw_id, patient_id, patient_name, village, case_type, symptoms, notes, status, priority, case_date) VALUES
('case-001', 'chw-001', 'patient-001', 'John Doe', 'Riverside Village', 'Routine Checkup', 'Blood pressure monitoring', 'BP stable, medication compliance good', 'completed', 'normal', '2024-01-15'),
('case-002', 'chw-001', 'patient-002', 'Mary Smith', 'Hillside Community', 'Emergency', 'Severe headache, dizziness', 'Referred to district hospital for further evaluation', 'referred', 'high', '2024-01-14'),
('case-003', 'chw-001', NULL, 'Sarah Wilson', 'Mountain View', 'Preventive Care', 'Vaccination follow-up', 'Second dose of hepatitis B vaccine due', 'scheduled', 'normal', '2024-01-13')
ON CONFLICT (id) DO NOTHING;
