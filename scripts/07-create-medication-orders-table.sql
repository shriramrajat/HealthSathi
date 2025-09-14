-- Create medication orders table for pharmacy order management
CREATE TABLE IF NOT EXISTS medication_orders (
    id VARCHAR(255) PRIMARY KEY,
    prescription_id VARCHAR(255) NOT NULL,
    pharmacy_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    doctor_id VARCHAR(255) NOT NULL,
    order_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'ready', 'completed', 'cancelled')),
    medications JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ready_date DATE,
    pickup_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(uid) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_prescription ON medication_orders(prescription_id);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy ON medication_orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_orders_patient ON medication_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON medication_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON medication_orders(order_date);

-- Insert sample medication orders
INSERT INTO medication_orders (id, prescription_id, pharmacy_id, patient_id, doctor_id, order_status, medications, total_amount, order_date) VALUES
('order-001', 'presc-001', 'pharmacy-001', 'patient-001', 'doctor-001', 'ready', 
 '[{"name": "Amoxicillin 500mg", "quantity": 30, "price": 12.50}, {"name": "Paracetamol 650mg", "quantity": 20, "price": 5.25}]',
 480.00, '2024-01-15'),
('order-002', 'presc-002', 'pharmacy-001', 'patient-002', 'doctor-002', 'pending',
 '[{"name": "Metformin 500mg", "quantity": 60, "price": 15.00}]',
 900.00, '2024-01-14')
ON CONFLICT (id) DO NOTHING;
