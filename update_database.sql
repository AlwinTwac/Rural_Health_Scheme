-- Migration script to update existing database
-- Run this script in HeidiSQL to update your database structure

USE rural_health;

-- Add household_id column to patients table if it doesn't exist
ALTER TABLE patients 
ADD COLUMN household_id INT AFTER patient_id,
ADD COLUMN relation_to_head VARCHAR(50) AFTER gender,
ADD COLUMN latitude DECIMAL(10, 8) AFTER relation_to_head,
ADD COLUMN longitude DECIMAL(11, 8) AFTER latitude,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE patients 
ADD CONSTRAINT fk_patients_household 
FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_patients_household_id ON patients(household_id);

-- Update households table if needed
ALTER TABLE households 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
ADD INDEX IF NOT EXISTS idx_households_village (village),
ADD INDEX IF NOT EXISTS idx_households_status (status);

-- Update medical_requests table if needed
ALTER TABLE medical_requests 
ADD COLUMN priority_score INT DEFAULT 0 AFTER status,
ADD COLUMN accepted_at TIMESTAMP NULL AFTER requested_at,
ADD COLUMN completed_at TIMESTAMP NULL AFTER accepted_at,
ADD COLUMN notes TEXT AFTER completed_at,
ADD INDEX IF NOT EXISTS idx_medical_requests_severity (severity);

-- Create devices table if it doesn't exist
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    household_id VARCHAR(50),
    device_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    battery_level INT DEFAULT 100,
    signal_strength INT DEFAULT 100,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_id (device_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create other missing tables if they don't exist
CREATE TABLE IF NOT EXISTS trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id VARCHAR(50) UNIQUE NOT NULL,
    trip_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'planned',
    total_distance DECIMAL(10, 2),
    estimated_duration INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    INDEX idx_trip_id (trip_id),
    INDEX idx_trip_date (trip_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trip_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    request_id INT NOT NULL,
    visit_order INT,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES medical_requests(id) ON DELETE CASCADE,
    INDEX idx_trip_id (trip_id),
    INDEX idx_request_id (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_type VARCHAR(50),
    message TEXT,
    severity VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_type (log_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Widen temperature precision to accept extreme readings (e.g., -127.0)
ALTER TABLE patients 
  MODIFY COLUMN temperature DECIMAL(5,2) NULL;

ALTER TABLE vital_signs_history 
  MODIFY COLUMN temperature DECIMAL(5,2) NULL;
