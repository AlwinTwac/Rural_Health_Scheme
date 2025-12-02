#!/usr/bin/env python3
"""
Quick test for ESP32 comments API
"""

from app import app

def test_esp32_api():
    with app.test_client() as client:
        # Test with real patient ID
        patient_id = "P-4209444A"
        
        print(f"Testing ESP32 API with patient: {patient_id}")
        
        # Test latest comment endpoint
        response = client.get(f'/api/esp32/comments/latest/{patient_id}')
        print(f"Latest Comment - Status: {response.status_code}")
        
        if response.status_code == 200:
            import json
            data = response.get_json()
            print("✅ SUCCESS!")
            print(json.dumps(data, indent=2))
        else:
            print("❌ ERROR:")
            print(response.get_json())
        
        print("\n" + "="*50)
        
        # Test all comments endpoint
        response = client.get(f'/api/esp32/comments/{patient_id}')
        print(f"All Comments - Status: {response.status_code}")
        
        if response.status_code == 200:
            import json
            data = response.get_json()
            print("✅ SUCCESS!")
            print(f"Total comments: {data.get('totalComments', 0)}")
            for i, comment in enumerate(data.get('comments', []), 1):
                print(f"{i}. {comment.get('commentedBy', 'Unknown')}: {comment.get('comment', 'No comment')[:50]}...")
        else:
            print("❌ ERROR:")
            print(response.get_json())

if __name__ == "__main__":
    test_esp32_api()
