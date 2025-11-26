-- Create notifications table for real-time medical updates
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    household_id INT,
    patient_id INT,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    
    INDEX idx_notifications_created_at (created_at),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_household (household_id),
    INDEX idx_notifications_patient (patient_id)
);
