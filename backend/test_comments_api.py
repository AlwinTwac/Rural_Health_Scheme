#!/usr/bin/env python3
"""
Test script for ESP32 Doctor Comments API
Tests both endpoints: full comments and latest comment
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:5000"  # Change if your server runs elsewhere
TEST_PATIENT_ID = "P001"  # Change to a real patient ID in your database

def test_latest_comment_endpoint():
    """Test the latest comment endpoint"""
    print(f"Testing latest comment endpoint for patient: {TEST_PATIENT_ID}")
    
    url = f"{BASE_URL}/api/esp32/comments/latest/{TEST_PATIENT_ID}"
    
    try:
        response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Latest comment endpoint working!")
            print("Response:")
            print(json.dumps(data, indent=2))
            
            if data.get('hasComment'):
                print(f"\n📝 Comment found:")
                print(f"   Patient: {data['patientName']}")
                print(f"   Doctor: {data['commentedBy']}")
                print(f"   Time: {data['commentedAt']}")
                print(f"   Comment: {data['comment']}")
            else:
                print("ℹ️  No comments found for this patient")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        print("Make sure your Flask server is running!")

def test_all_comments_endpoint():
    """Test the all comments endpoint"""
    print(f"\nTesting all comments endpoint for patient: {TEST_PATIENT_ID}")
    
    url = f"{BASE_URL}/api/esp32/comments/{TEST_PATIENT_ID}"
    
    try:
        response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ All comments endpoint working!")
            print(f"Total Comments: {data['totalComments']}")
            print("Response:")
            print(json.dumps(data, indent=2))
            
            if data['totalComments'] > 0:
                print(f"\n📝 Found {data['totalComments']} comments:")
                for i, comment in enumerate(data['comments'], 1):
                    print(f"   {i}. {comment['commentedBy']} - {comment['comment']}")
            else:
                print("ℹ️  No comments found for this patient")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        print("Make sure your Flask server is running!")

def test_nonexistent_patient():
    """Test with a non-existent patient ID"""
    print(f"\nTesting with non-existent patient ID: NONEXISTENT")
    
    url = f"{BASE_URL}/api/esp32/comments/latest/NONEXISTENT"
    
    try:
        response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ Correctly returns 404 for non-existent patient")
        else:
            print(f"❌ Expected 404, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")

def main():
    """Run all tests"""
    print("🧪 ESP32 Doctor Comments API Test Script")
    print("=" * 50)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print("✅ Server is running")
    except requests.exceptions.RequestException:
        print("❌ Server is not running or not accessible")
        print("Please start your Flask server first!")
        sys.exit(1)
    
    # Run tests
    test_latest_comment_endpoint()
    test_all_comments_endpoint()
    test_nonexistent_patient()
    
    print("\n" + "=" * 50)
    print("🏁 Testing completed!")
    print("\n📋 Next steps:")
    print("1. Add some doctor comments via the web interface")
    print("2. Run this test again to see the comments")
    print("3. Update the ESP32 code with your WiFi credentials")
    print("4. Upload the ESP32 code to your devices")

if __name__ == "__main__":
    main()
