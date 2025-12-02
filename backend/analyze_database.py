#!/usr/bin/env python3
"""
Database Analysis Script
Check what patients exist and their data structure
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import db
from database_models import Patient, Household, VitalSignsHistory
from app import app

def analyze_database():
    """Analyze the database structure and existing data"""
    
    with app.app_context():
        print("🔍 DATABASE ANALYSIS")
        print("=" * 50)
        
        # Check households
        households = Household.query.all()
        print(f"📊 Total Households: {len(households)}")
        
        for household in households[:5]:  # Show first 5
            print(f"   - {household.household_name} (ID: {household.household_id})")
        
        # Check patients
        patients = Patient.query.all()
        print(f"\n👥 Total Patients: {len(patients)}")
        
        if patients:
            print("\n📋 Patient List:")
            for patient in patients[:10]:  # Show first 10
                print(f"   - {patient.name} (patient_id: {patient.patient_id})")
                print(f"     Household: {patient.household.household_name if patient.household else 'Unknown'}")
                print(f"     Age: {patient.age}, Gender: {patient.gender}")
        
        # Check vital signs history with comments
        vitals_with_comments = VitalSignsHistory.query.filter(
            VitalSignsHistory.doctor_comment.isnot(None)
        ).all()
        
        print(f"\n💬 Vital Signs with Doctor Comments: {len(vitals_with_comments)}")
        
        if vitals_with_comments:
            print("\n📝 Comments Found:")
            for vital in vitals_with_comments[:5]:  # Show first 5
                patient = vital.patient
                print(f"   - Patient: {patient.name if patient else 'Unknown'} ({patient.patient_id if patient else 'Unknown'})")
                print(f"     Comment: {vital.doctor_comment[:100]}...")
                print(f"     By: {vital.commented_by} at {vital.commented_at}")
                print()
        else:
            print("   No doctor comments found in database")
            print("   ➡️  Add some comments via the web interface first!")
        
        # Test the ESP32 endpoints with actual patient IDs
        if patients:
            test_patient_id = patients[0].patient_id
            print(f"\n🧪 Testing ESP32 API with patient_id: {test_patient_id}")
            
            # Test latest comment endpoint
            from flask import Flask
            with app.test_client() as client:
                response = client.get(f'/api/esp32/comments/latest/{test_patient_id}')
                print(f"   Latest Comment API Status: {response.status_code}")
                if response.status_code == 200:
                    print("   ✅ Working!")
                else:
                    print(f"   ❌ Error: {response.get_json()}")
                
                # Test all comments endpoint
                response = client.get(f'/api/esp32/comments/{test_patient_id}')
                print(f"   All Comments API Status: {response.status_code}")
                if response.status_code == 200:
                    print("   ✅ Working!")
                else:
                    print(f"   ❌ Error: {response.get_json()}")

def create_sample_data():
    """Create sample data if database is empty"""
    
    with app.app_context():
        # Check if we have data
        if Patient.query.first():
            print("📊 Database already has data. Skipping sample creation.")
            return
        
        print("🏗️  Creating sample data...")
        
        # Create a household
        household = Household(
            household_id="H001",
            household_name="Test Household",
            village="Test Village"
        )
        db.session.add(household)
        db.session.commit()
        
        # Create a patient
        patient = Patient(
            patient_id="P001",
            household_id=household.id,
            name="Test Patient",
            age=45,
            gender="Male"
        )
        db.session.add(patient)
        db.session.commit()
        
        # Create a vital signs reading with comment
        vital = VitalSignsHistory(
            patient_id=patient.id,
            temperature=36.5,
            heart_rate=72,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            doctor_comment="Patient's vitals are stable. Continue monitoring.",
            commented_by="Dr. Smith"
        )
        db.session.add(vital)
        db.session.commit()
        
        print("✅ Sample data created!")
        print("   - Household: Test Household (H001)")
        print("   - Patient: Test Patient (P001)")
        print("   - Doctor comment added")

if __name__ == "__main__":
    print("🚀 Starting database analysis...")
    
    try:
        analyze_database()
        
        # If no data exists, create sample data
        with app.app_context():
            if not Patient.query.first():
                print("\n" + "=" * 50)
                create_sample_data()
                print("\n" + "=" * 50)
                print("🔄 Running analysis again with sample data...")
                analyze_database()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n🏁 Analysis complete!")
    print("\n📋 ESP32 Configuration:")
    if Patient.query.first():
        first_patient = Patient.query.first()
        print(f"   API_BASE_URL = \"http://192.168.100.34:5000\"")
        print(f"   PATIENT_ID = \"{first_patient.patient_id}\"")
