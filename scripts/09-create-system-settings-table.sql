-- Create system settings table for application configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(255) PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

-- Insert default system settings
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, description, is_public) VALUES
('setting-001', 'app_name', 'Rural Health Portal', 'string', 'Application name', TRUE),
('setting-002', 'max_appointment_days_ahead', '30', 'number', 'Maximum days ahead appointments can be booked', FALSE),
('setting-003', 'enable_video_consultations', 'true', 'boolean', 'Enable video consultation feature', TRUE),
('setting-004', 'supported_villages', '["Riverside Village", "Hillside Community", "Mountain View", "Valley Springs"]', 'json', 'List of supported villages', TRUE),
('setting-005', 'emergency_contact', '+1-800-HEALTH', 'string', 'Emergency contact number', TRUE),
('setting-006', 'consultation_duration_minutes', '30', 'number', 'Default consultation duration in minutes', FALSE),
('setting-007', 'pharmacy_order_expiry_days', '7', 'number', 'Days after which uncollected pharmacy orders expire', FALSE)
ON CONFLICT (id) DO NOTHING;
