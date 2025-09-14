-- Create users table for authentication and basic user information
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'pharmacy', 'chw')),
    age INTEGER,
    phone VARCHAR(20),
    village VARCHAR(255),
    qr_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_qr_id ON users(qr_id);
CREATE INDEX IF NOT EXISTS idx_users_village ON users(village);

-- Insert sample users for testing
INSERT INTO users (uid, email, name, role, age, phone, village, qr_id) VALUES
('patient-001', 'john.doe@email.com', 'John Doe', 'patient', 35, '+1234567890', 'Riverside Village', 'QR-PATIENT001'),
('patient-002', 'mary.smith@email.com', 'Mary Smith', 'patient', 42, '+1234567891', 'Hillside Community', 'QR-PATIENT002'),
('patient-003', 'robert.johnson@email.com', 'Robert Johnson', 'patient', 28, '+1234567892', 'Mountain View', 'QR-PATIENT003'),
('doctor-001', 'sarah.johnson@hospital.com', 'Dr. Sarah Johnson', 'doctor', 38, '+1234567893', NULL, 'QR-DOCTOR001'),
('doctor-002', 'michael.chen@hospital.com', 'Dr. Michael Chen', 'doctor', 45, '+1234567894', NULL, 'QR-DOCTOR002'),
('pharmacy-001', 'central@pharmacy.com', 'Central Pharmacy', 'pharmacy', NULL, '+1234567895', 'Main Street', 'QR-PHARMACY001'),
('chw-001', 'maria.garcia@chw.org', 'Maria Garcia', 'chw', 32, '+1234567896', 'Riverside Village', 'QR-CHW001')
ON CONFLICT (uid) DO NOTHING;
