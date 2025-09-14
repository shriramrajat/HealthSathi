-- Create consultation sessions table for video consultation tracking
CREATE TABLE IF NOT EXISTS consultation_sessions (
    id VARCHAR(255) PRIMARY KEY,
    appointment_id VARCHAR(255),
    room_id VARCHAR(255) NOT NULL UNIQUE,
    patient_id VARCHAR(255) NOT NULL,
    doctor_id VARCHAR(255) NOT NULL,
    session_status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (session_status IN ('scheduled', 'active', 'completed', 'cancelled')),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    consultation_notes TEXT,
    recording_url VARCHAR(500),
    chat_messages JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(uid) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultation_appointment ON consultation_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultation_room ON consultation_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_consultation_patient ON consultation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_doctor ON consultation_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_status ON consultation_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_consultation_date ON consultation_sessions(start_time);

-- Insert sample consultation sessions
INSERT INTO consultation_sessions (id, appointment_id, room_id, patient_id, doctor_id, session_status, start_time, end_time, duration_minutes, consultation_notes) VALUES
('session-001', 'apt-001', 'room-abc123def', 'patient-001', 'doctor-001', 'completed', '2024-01-10 10:00:00', '2024-01-10 10:25:00', 25, 'Patient presented with flu-like symptoms. Prescribed antibiotics and rest. Follow-up in 1 week if symptoms persist.'),
('session-002', 'apt-002', 'room-xyz789ghi', 'patient-002', 'doctor-002', 'scheduled', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
