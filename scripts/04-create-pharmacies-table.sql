-- Create pharmacies table for pharmacy information and inventory
CREATE TABLE IF NOT EXISTS pharmacies (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    license_number VARCHAR(100),
    operating_hours JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
);

-- Create pharmacy inventory table
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
    id VARCHAR(255) PRIMARY KEY,
    pharmacy_id VARCHAR(255) NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    max_stock INTEGER NOT NULL DEFAULT 100,
    price DECIMAL(10,2) NOT NULL,
    expiry_date DATE,
    supplier VARCHAR(255),
    batch_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pharmacies_user ON pharmacies(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy ON pharmacy_inventory(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON pharmacy_inventory(medicine_name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON pharmacy_inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON pharmacy_inventory(current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON pharmacy_inventory(expiry_date);

-- Insert sample pharmacy data
INSERT INTO pharmacies (id, user_id, name, address, phone, license_number, operating_hours) VALUES
('pharmacy-001', 'pharmacy-001', 'Central Pharmacy', 'Main Street, Village Center', '+1234567895', 'PH-LIC-001', 
 '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-18:00", "saturday": "9:00-14:00", "sunday": "closed"}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample inventory
INSERT INTO pharmacy_inventory (id, pharmacy_id, medicine_name, category, current_stock, min_stock, max_stock, price, expiry_date, supplier) VALUES
('inv-001', 'pharmacy-001', 'Amoxicillin 500mg', 'Antibiotics', 25, 10, 100, 12.50, '2025-06-15', 'MedSupply Co.'),
('inv-002', 'pharmacy-001', 'Paracetamol 650mg', 'Pain Relief', 50, 20, 200, 5.25, '2025-03-20', 'HealthCorp'),
('inv-003', 'pharmacy-001', 'Aspirin 100mg', 'Cardiovascular', 8, 15, 80, 8.75, '2024-12-10', 'MedSupply Co.'),
('inv-004', 'pharmacy-001', 'Metformin 500mg', 'Diabetes', 30, 10, 60, 15.00, '2025-08-30', 'DiabetesCare Ltd'),
('inv-005', 'pharmacy-001', 'Lisinopril 10mg', 'Cardiovascular', 5, 12, 50, 18.25, '2025-01-25', 'CardioMeds')
ON CONFLICT (id) DO NOTHING;
