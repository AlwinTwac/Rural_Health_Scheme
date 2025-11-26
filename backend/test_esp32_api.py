#!/usr/bin/env python3
"""
Test script for ESP32 LoRa readings API endpoint
"""

import requests
import json

# API endpoint
API_URL = "http://localhost:5000/api/esp32/readings"

def test_esp32_api():
    """Test the ESP32 readings endpoint with sample data"""
    
    # Sample LoRa data in the expected format
    test_readings = [
        "NAME:Batsi Guyo|BP:120/80|HR:72|TEMP:36.5",
        "NAME:John Doe|BP:130/85|HR:75|TEMP:37.1",
        "NAME:Jane Smith|BP:118/78|HR:68|TEMP:36.8",
        "NAME:Invalid Patient|BP:120/80|HR:72|TEMP:36.5",  # Should fail - patient not found
        "NAME:Batsi Guyo|BP:300/200|HR:300|TEMP:50",     # Should fail - invalid values
    ]
    
    print("Testing ESP32 LoRa Readings API")
    print("=" * 50)
    
    for i, reading in enumerate(test_readings, 1):
        print(f"\nTest {i}: {reading}")
        
        # Prepare the payload
        payload = {
            "reading": reading
        }
        
        try:
            # Send POST request
            response = requests.post(API_URL, json=payload)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ SUCCESS")
                print(f"  Patient: {result.get('patient')}")
                print(f"  Patient ID: {result.get('patientId')}")
                print(f"  Updates: {result.get('updates')}")
                print(f"  Timestamp: {result.get('timestamp')}")
            else:
                print("❌ FAILED")
                if response.headers.get('content-type') == 'application/json':
                    error = response.json()
                    print(f"  Error: {error.get('error')}")
                else:
                    print(f"  Response: {response.text}")
                    
        except requests.exceptions.RequestException as e:
            print(f"❌ REQUEST FAILED: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed!")

def test_valid_data_ranges():
    """Test various valid and invalid data ranges"""
    
    print("\nTesting Data Validation")
    print("=" * 30)
    
    # Valid ranges
    valid_tests = [
        ("Valid temperature", "NAME:Batsi Guyo|TEMP:36.5"),
        ("Valid heart rate", "NAME:Batsi Guyo|HR:72"),
        ("Valid blood pressure", "NAME:Batsi Guyo|BP:120/80"),
        ("Edge cases", "NAME:Batsi Guyo|BP:60/30|HR:30|TEMP:30"),
        ("High normal", "NAME:Batsi Guyo|BP:250/150|HR:220|TEMP:45"),
    ]
    
    # Invalid ranges
    invalid_tests = [
        ("Low temperature", "NAME:Batsi Guyo|TEMP:29.9"),
        ("High temperature", "NAME:Batsi Guyo|TEMP:45.1"),
        ("Low heart rate", "NAME:Batsi Guyo|HR:29"),
        ("High heart rate", "NAME:Batsi Guyo|HR:221"),
        ("Low BP systolic", "NAME:Batsi Guyo|BP:59/80"),
        ("Low BP diastolic", "NAME:Batsi Guyo|BP:120/29"),
        ("High BP systolic", "NAME:Batsi Guyo|BP:251/80"),
        ("High BP diastolic", "NAME:Batsi Guyo|BP:120/151"),
    ]
    
    all_tests = valid_tests + invalid_tests
    
    for description, reading in all_tests:
        print(f"\n{description}: {reading}")
        
        payload = {"reading": reading}
        
        try:
            response = requests.post(API_URL, json=payload)
            
            expected_success = description.startswith("Valid") or description.startswith("Edge") or description.startswith("High")
            actual_success = response.status_code == 200
            
            if expected_success == actual_success:
                print("✅ CORRECT")
            else:
                print("❌ UNEXPECTED")
                print(f"  Expected: {'Success' if expected_success else 'Failure'}")
                print(f"  Got: {'Success' if actual_success else 'Failure'}")
                if response.status_code != 200:
                    error = response.json()
                    print(f"  Error: {error.get('error')}")
                    
        except Exception as e:
            print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    # Make sure the Flask server is running before testing
    print("Make sure the Flask server is running on http://localhost:5000")
    input("Press Enter to start testing...")
    
    test_esp32_api()
    test_valid_data_ranges()
