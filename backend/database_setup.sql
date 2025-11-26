-- Rural Health Scheme Database Setup
-- MySQL Database Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS rural_health;
USE rural_health;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Households table
CREATE TABLE IF NOT EXISTS households (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(50) UNIQUE NOT NULL,
    household_name VARCHAR(100) NOT NULL,
    village VARCHAR(100),
    phone VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_household_id (household_id),
    INDEX idx_village (village),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    household_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(10),
    relation_to_head VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Vital signs columns
    temperature DECIMAL(4, 2) COMMENT 'Temperature in Celsius',
    heart_rate INT COMMENT 'Beats per minute',
    blood_pressure_systolic INT COMMENT 'Systolic BP (mmHg)',
    blood_pressure_diastolic INT COMMENT 'Diastolic BP (mmHg)',
    last_vitals_reading TIMESTAMP NULL COMMENT 'When vitals were last recorded',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_household_id (household_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vital signs history table
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

-- Medical requests table
CREATE TABLE IF NOT EXISTS medical_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    symptoms TEXT,
    vital_signs JSON,
    status VARCHAR(20) DEFAULT 'pending',
    priority_score INT DEFAULT 0,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id),
    INDEX idx_status (status),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Devices table (Zigbee household devices)
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

-- Trips table (doctor visit schedules)
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

-- Trip requests (many-to-many relationship)
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

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_type VARCHAR(50),
    message TEXT,
    severity VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_type (log_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
-- Password hash generated using bcrypt
INSERT INTO users (username, password_hash, full_name, role) 
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYqYqYqYq', 'System Administrator', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- Note: The actual password hash will be generated by the Python backend
-- This is just a placeholder. Run the backend to create the proper admin user.
