#!/usr/bin/env python3
"""
Test script for vital signs API endpoints
Run this to test the vital signs functionality
"""

import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:5000/api"

def test_patients_list():
    """Test getting list of patients"""
    print("Testing GET /api/patients/list")
    response = requests.get(f"{BASE_URL}/patients/list")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()

def test_record_vitals(patient_id):
    """Test recording vital signs for a patient"""
    print(f"\nTesting POST /api/vitals/record for patient {patient_id}")
    
    vitals_data = {
        "patient_id": patient_id,
        "temperature": 37.5,
        "heart_rate": 72,
        "blood_pressure_systolic": 120,
        "blood_pressure_diastolic": 80,
        "recorded_by": "test_device",
        "notes": "Test vital signs reading"
    }
    
    response = requests.post(
        f"{BASE_URL}/vitals/record",
        json=vitals_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()

def test_get_latest_vitals():
    """Test getting latest vitals for all patients"""
    print("\nTesting GET /api/vitals/latest")
    response = requests.get(f"{BASE_URL}/vitals/latest")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()

def test_patient_vitals_history(patient_id):
    """Test getting vitals history for a specific patient"""
    print(f"\nTesting GET /api/vitals/patient/{patient_id}")
    response = requests.get(f"{BASE_URL}/vitals/patient/{patient_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()

def main():
    """Run all tests"""
    print("=== Vital Signs API Test ===\n")
    
    try:
        # Test 1: Get patients list
        patients = test_patients_list()
        
        if patients and len(patients) > 0:
            # Use the first patient for testing
            test_patient = patients[0]
            patient_id = test_patient['patientId']
            
            print(f"\nUsing patient: {test_patient['name']} ({patient_id})")
            
            # Test 2: Record vital signs
            test_record_vitals(patient_id)
            
            # Wait a moment
            time.sleep(1)
            
            # Test 3: Get latest vitals
            test_get_latest_vitals()
            
            # Test 4: Get patient vitals history
            test_patient_vitals_history(patient_id)
            
        else:
            print("No patients found. Please create some patients first.")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server.")
        print("Make sure the Flask server is running on http://localhost:5000")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
