-- Create audit log table for tracking system activities
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE SET NULL
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);

-- Insert sample audit log entries
INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, new_values, timestamp) VALUES
('audit-001', 'patient-001', 'CREATE', 'appointment', 'apt-001', '{"doctor_id": "doctor-001", "date": "2024-01-15", "time": "10:00"}', '2024-01-10 09:30:00'),
('audit-002', 'doctor-001', 'CREATE', 'prescription', 'presc-001', '{"patient_id": "patient-001", "medications": ["Amoxicillin", "Paracetamol"]}', '2024-01-10 10:30:00'),
('audit-003', 'pharmacy-001', 'UPDATE', 'medication_order', 'order-001', '{"status": "ready"}', '2024-01-15 14:00:00')
ON CONFLICT (id) DO NOTHING;
