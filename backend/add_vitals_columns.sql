-- Migration script to add vital signs columns to existing database
-- Run this script in HeidiSQL to update your existing database

USE rural_health;

-- Add vital signs columns to patients table
ALTER TABLE patients 
ADD COLUMN temperature DECIMAL(4, 2) COMMENT 'Temperature in Celsius' AFTER longitude,
ADD COLUMN heart_rate INT COMMENT 'Beats per minute' AFTER temperature,
ADD COLUMN blood_pressure_systolic INT COMMENT 'Systolic BP (mmHg)' AFTER heart_rate,
ADD COLUMN blood_pressure_diastolic INT COMMENT 'Diastolic BP (mmHg)' AFTER blood_pressure_systolic,
ADD COLUMN last_vitals_reading TIMESTAMP NULL COMMENT 'When vitals were last recorded' AFTER blood_pressure_diastolic;

-- Create vital signs history table
CREATE TABLE IF NOT EXISTS vital_signs_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    temperature DECIMAL(4, 2) COMMENT 'Temperature in Celsius',
    heart_rate INT COMMENT 'Beats per minute',
    blood_pressure_systolic INT COMMENT 'Systolic BP (mmHg)',
    blood_pressure_diastolic INT COMMENT 'Diastolic BP (mmHg)',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by VARCHAR(50) COMMENT 'Who recorded the vitals (device or user)',
    notes TEXT COMMENT 'Additional notes about the reading',
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
