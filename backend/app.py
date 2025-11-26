from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import pytz
import os
from dotenv import load_dotenv
from sqlalchemy.orm import joinedload

# Load environment variables
load_dotenv()

# Configure timezone for Zimbabwe
zimbabwe_tz = pytz.timezone('Africa/Harare')

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')

# Initialize database
from database import db
# Construct DATABASE_URL from environment variables
db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '3306')
db_user = os.getenv('DB_USER', 'root')
db_password = os.getenv('DB_PASSWORD', '')
db_name = os.getenv('DB_NAME', 'rural_health')
database_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', database_url)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Initialize JWT
jwt = JWTManager(app)

# Import and register auth blueprint
from auth import auth_bp, init_database
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Initialize database on startup
with app.app_context():
    init_database()

# Import models
from database_models import Household, Patient, MedicalRequest, VitalSignsHistory

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

# Household endpoints
@app.route('/api/households', methods=['GET'])
def get_households():
    try:
        households = Household.query.all()
        return jsonify([household.to_dict() for household in households])
    except Exception as e:
        print(f"Error fetching households: {e}")
        return jsonify([])  # Return empty list on error

@app.route('/api/households', methods=['POST'])
def create_household():
    try:
        data = request.get_json()
        
        # Validate latitude and longitude
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is not None:
            try:
                lat_float = float(latitude)
                if lat_float < -90 or lat_float > 90:
                    return jsonify({'error': 'Latitude must be between -90 and 90 degrees'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid latitude value'}), 400
                
        if longitude is not None:
            try:
                lon_float = float(longitude)
                if lon_float < -180 or lon_float > 180:
                    return jsonify({'error': 'Longitude must be between -180 and 180 degrees'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid longitude value'}), 400
        
        # Generate unique household ID
        import uuid
        household_id = f"HH-{str(uuid.uuid4())[:8].upper()}"
        
        household = Household(
            household_id=household_id,
            household_name=data['household_name'],
            village=data.get('village'),
            phone=data.get('phone'),
            latitude=latitude,
            longitude=longitude
        )
        
        db.session.add(household)
        db.session.commit()
        
        return jsonify(household.to_dict()), 201
        
    except Exception as e:
        print(f"Error creating household: {e}")
        return jsonify({'error': 'Failed to create household'}), 500

@app.route('/api/households/<int:household_id>/members', methods=['POST'])
def add_household_member(household_id):
    try:
        data = request.get_json()
        
        # Verify household exists
        household = Household.query.get_or_404(household_id)
        
        # Validate latitude and longitude
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is not None:
            try:
                lat_float = float(latitude)
                if lat_float < -90 or lat_float > 90:
                    return jsonify({'error': 'Latitude must be between -90 and 90 degrees'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid latitude value'}), 400
                
        if longitude is not None:
            try:
                lon_float = float(longitude)
                if lon_float < -180 or lon_float > 180:
                    return jsonify({'error': 'Longitude must be between -180 and 180 degrees'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid longitude value'}), 400
        
        # Generate unique patient ID
        import uuid
        patient_id = f"P-{str(uuid.uuid4())[:8].upper()}"
        
        patient = Patient(
            patient_id=patient_id,
            household_id=household_id,
            name=data['name'],
            age=data['age'],
            gender=data['gender'],
            relation_to_head=data.get('relation_to_head'),
            latitude=latitude,
            longitude=longitude
        )
        
        db.session.add(patient)
        db.session.commit()
        
        return jsonify(patient.to_dict()), 201
        
    except Exception as e:
        print(f"Error adding household member: {e}")
        return jsonify({'error': 'Failed to add household member'}), 500

# Patient endpoints
@app.route('/api/patients', methods=['GET'])
def get_patients():
    try:
        patients = Patient.query.all()
        return jsonify([patient.to_dict() for patient in patients])
    except Exception as e:
        print(f"Error fetching patients: {e}")
        return jsonify([])  # Return empty list on error

@app.route('/api/patients/<int:patient_id>', methods=['GET'])
def get_patient(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    return jsonify(patient.to_dict())

# Request endpoints
@app.route('/api/requests', methods=['GET'])
def get_requests():
    requests = MedicalRequest.query.all()
    return jsonify([request.to_dict() for request in requests])

@app.route('/api/requests', methods=['POST'])
def create_request():
    data = request.get_json()
    
    # Generate unique request ID
    import uuid
    request_id = f"R-{str(uuid.uuid4())[:8].upper()}"
    
    medical_request = MedicalRequest(
        request_id=request_id,
        patient_id=data['patient_id'],
        severity=data['severity'],
        symptoms=data.get('symptoms'),
        vital_signs=data.get('vital_signs'),
        priority_score=data.get('priority_score', 0)
    )
    
    db.session.add(medical_request)
    db.session.commit()
    
    return jsonify(medical_request.to_dict()), 201

@app.route('/api/requests/active', methods=['GET'])
def get_active_requests():
    try:
        active_requests = MedicalRequest.query.filter_by(status='pending').all()
        return jsonify([request.to_dict() for request in active_requests])
    except Exception as e:
        print(f"Error fetching active requests: {e}")
        return jsonify([])  # Return empty list on error

@app.route('/api/requests/<int:request_id>/accept', methods=['POST'])
def accept_request(request_id):
    medical_request = MedicalRequest.query.get_or_404(request_id)
    medical_request.status = 'accepted'
    medical_request.accepted_at = datetime.utcnow()
    db.session.commit()
    return jsonify(medical_request.to_dict())

@app.route('/api/requests/<int:request_id>/complete', methods=['POST'])
def complete_request(request_id):
    data = request.get_json()
    medical_request = MedicalRequest.query.get_or_404(request_id)
    medical_request.status = 'completed'
    medical_request.completed_at = datetime.utcnow()
    if data and 'notes' in data:
        medical_request.notes = data['notes']
    db.session.commit()
    return jsonify(medical_request.to_dict())

# Trip optimization endpoint
@app.route('/api/trips/optimize', methods=['POST'])
def optimize_trip():
    data = request.json
    request_ids = data.get('requestIds', [])
    
    # Simple optimization algorithm (replace with actual AI algorithm)
    optimized_route = {
        'stops': [],
        'totalDistance': 0,
        'totalTime': 0,
        'optimizationScore': 92
    }
    
    return jsonify(optimized_route)

# Stats endpoint
@app.route('/api/stats/dashboard', methods=['GET'])
def get_dashboard_stats():
    try:
        total_patients = Patient.query.count()
        active_requests = MedicalRequest.query.filter_by(status='pending').count()
        
        # Get today's date
        today = datetime.utcnow().date()
        completed_today = MedicalRequest.query.filter(
            MedicalRequest.status == 'completed',
            db.func.date(MedicalRequest.completed_at) == today
        ).count()
        
        stats = {
            'totalPatients': total_patients,
            'activeRequests': active_requests,
            'completedToday': completed_today,
            'avgResponseTime': 12,  # Calculate from actual data
            'criticalAlerts': MedicalRequest.query.filter_by(severity='critical', status='pending').count(),
            'networkDevices': 42  # Get from devices table
        }
        return jsonify(stats)
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        # Return default stats on error
        return jsonify({
            'totalPatients': 0,
            'activeRequests': 0,
            'completedToday': 0,
            'avgResponseTime': 0,
            'criticalAlerts': 0,
            'networkDevices': 0
        })

# Device endpoints
@app.route('/api/devices', methods=['GET'])
def get_devices():
    # Return mock devices for now - can be replaced with actual device data
    devices = [
        {'id': 1, 'name': 'Device 1', 'status': 'online', 'battery': 85},
        {'id': 2, 'name': 'Device 2', 'status': 'online', 'battery': 92},
        {'id': 3, 'name': 'Device 3', 'status': 'offline', 'battery': 45}
    ]
    return jsonify(devices)

@app.route('/api/stats/system', methods=['GET'])
def get_system_health():
    health = {
        'network': {
            'status': 'online',
            'activeNodes': 42,
            'totalNodes': 45,
            'signalStrength': 85
        },
        'hub': {
            'cpuUsage': 32,
            'memoryUsage': 58,
            'diskUsage': 45
        }
    }
    return jsonify(health)

# Vital signs endpoints
@app.route('/api/patients/list', methods=['GET'])
def get_patients_list():
    """Get list of all patients with ID and name for vital signs recording"""
    try:
        patients = Patient.query.all()
        patients_list = []
        for patient in patients:
            patients_list.append({
                'id': patient.id,
                'patientId': patient.patient_id,
                'name': patient.name,
                'household': patient.household.household_name if patient.household else 'Unknown',
                'age': patient.age,
                'gender': patient.gender
            })
        return jsonify(patients_list)
    except Exception as e:
        print(f"Error fetching patients list: {e}")
        return jsonify([])

@app.route('/api/vitals/record', methods=['POST'])
def record_vitals():
    """Record vital signs for a patient"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('patient_id'):
            return jsonify({'error': 'Patient ID is required'}), 400
        
        # Find patient
        patient = Patient.query.filter_by(patient_id=data['patient_id']).first()
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Validate vital signs data
        temperature = data.get('temperature')
        heart_rate = data.get('heart_rate')
        bp_systolic = data.get('blood_pressure_systolic')
        bp_diastolic = data.get('blood_pressure_diastolic')
        
        # Validate ranges
        if temperature is not None:
            temp_val = float(temperature)
            if temp_val < 30 or temp_val > 45:  # Reasonable temperature range
                return jsonify({'error': 'Temperature out of valid range (30-45°C)'}), 400
        
        if heart_rate is not None:
            hr_val = int(heart_rate)
            if hr_val < 30 or hr_val > 220:  # Reasonable heart rate range
                return jsonify({'error': 'Heart rate out of valid range (30-220 bpm)'}), 400
        
        if bp_systolic is not None or bp_diastolic is not None:
            if bp_systolic:
                sys_val = int(bp_systolic)
                if sys_val < 60 or sys_val > 250:
                    return jsonify({'error': 'Systolic BP out of valid range (60-250 mmHg)'}), 400
            if bp_diastolic:
                dia_val = int(bp_diastolic)
                if dia_val < 30 or dia_val > 150:
                    return jsonify({'error': 'Diastolic BP out of valid range (30-150 mmHg)'}), 400
        
        # Create vital signs history record
        vital_record = VitalSignsHistory(
            patient_id=patient.id,
            temperature=temperature,
            heart_rate=heart_rate,
            blood_pressure_systolic=bp_systolic,
            blood_pressure_diastolic=bp_diastolic,
            recorded_by=data.get('recorded_by', 'external_device'),
            notes=data.get('notes')
        )
        db.session.add(vital_record)
        
        # Update patient's latest vitals
        patient.temperature = temperature
        patient.heart_rate = heart_rate
        patient.blood_pressure_systolic = bp_systolic
        patient.blood_pressure_diastolic = bp_diastolic
        patient.last_vitals_reading = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Vital signs recorded successfully',
            'patient': patient.to_dict(),
            'vitals_record': vital_record.to_dict()
        }), 201
        
    except Exception as e:
        print(f"Error recording vitals: {e}")
        return jsonify({'error': 'Failed to record vital signs'}), 500

@app.route('/api/vitals/patient/<patient_id>', methods=['GET'])
def get_patient_vitals_history(patient_id):
    """Get vital signs history for a specific patient"""
    try:
        patient = Patient.query.filter_by(patient_id=patient_id).first()
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Get recent vital signs history (last 50 records)
        history = VitalSignsHistory.query.filter_by(patient_id=patient.id)\
            .order_by(VitalSignsHistory.recorded_at.desc())\
            .limit(50).all()
        
        return jsonify({
            'patient': patient.to_dict(),
            'history': [record.to_dict() for record in history]
        })
        
    except Exception as e:
        print(f"Error fetching patient vitals history: {e}")
        return jsonify({'error': 'Failed to fetch vital signs history'}), 500

@app.route('/api/vitals/latest', methods=['GET'])
def get_latest_vitals():
    """Get latest vital signs for all patients"""
    try:
        patients = Patient.query.filter(Patient.last_vitals_reading.isnot(None))\
            .order_by(Patient.last_vitals_reading.desc()).all()
        
        return jsonify([patient.to_dict() for patient in patients])
        
    except Exception as e:
        print(f"Error fetching latest vitals: {e}")
        return jsonify([])

# ESP32 LoRa Data Endpoint
@app.route('/api/esp32/readings', methods=['POST'])
def esp32_readings():
    """
    Endpoint for ESP32 to post patient readings from LoRa
    Expected format: NAME:Batsi Guyo|BP:34/67|HR:34|TEMP:24.5
    """
    try:
        data = request.get_json()
        if not data or 'reading' not in data:
            return jsonify({'error': 'Missing reading data'}), 400
        
        reading_text = data['reading']
        print(f"Received ESP32 reading: {reading_text}")
        
        # Parse the reading format: NAME:Batsi Guyo|BP:34/67|HR:34|TEMP:24.5
        parsed_data = {}
        parts = reading_text.split('|')
        
        for part in parts:
            if ':' in part:
                key, value = part.split(':', 1)
                parsed_data[key.strip().upper()] = value.strip()
        
        # Extract required fields
        patient_name = parsed_data.get('NAME')
        bp_value = parsed_data.get('BP')
        hr_value = parsed_data.get('HR')
        temp_value = parsed_data.get('TEMP')
        
        if not patient_name:
            return jsonify({'error': 'Missing patient name'}), 400
        
        # Find patient by name
        patient = Patient.query.filter(Patient.name.ilike(f'%{patient_name}%')).first()
        if not patient:
            return jsonify({'error': f'Patient "{patient_name}" not found'}), 404
        
        # Parse and validate vital signs
        updates = {}
        
        # Temperature
        if temp_value:
            try:
                temp = float(temp_value)
                patient.temperature = temp
                updates['temperature'] = temp
            except ValueError:
                return jsonify({'error': f'Invalid temperature format: {temp_value}'}), 400
        
        # Heart Rate
        if hr_value:
            try:
                hr = int(hr_value)
                patient.heart_rate = hr
                updates['heart_rate'] = hr
            except ValueError:
                return jsonify({'error': f'Invalid heart rate format: {hr_value}'}), 400
        
        # Blood Pressure
        if bp_value:
            try:
                if '/' in bp_value:
                    systolic_str, diastolic_str = bp_value.split('/', 1)
                    systolic = int(systolic_str.strip())
                    diastolic = int(diastolic_str.strip())
                    
                    patient.blood_pressure_systolic = systolic
                    patient.blood_pressure_diastolic = diastolic
                    updates['blood_pressure'] = f"{systolic}/{diastolic}"
                else:
                    return jsonify({'error': f'Invalid blood pressure format: {bp_value} (expected systolic/diastolic)'}), 400
            except ValueError:
                return jsonify({'error': f'Invalid blood pressure format: {bp_value}'}), 400
        
        # Update last reading timestamp
        patient.last_vitals_reading = datetime.now(zimbabwe_tz)
        
        # Commit changes to database
        db.session.commit()
        
        # Add to vital signs history
        history_entry = VitalSignsHistory(
            patient_id=patient.id,
            temperature=updates.get('temperature'),
            heart_rate=updates.get('heart_rate'),
            blood_pressure_systolic=patient.blood_pressure_systolic,
            blood_pressure_diastolic=patient.blood_pressure_diastolic,
            recorded_at=datetime.now(zimbabwe_tz)
        )
        db.session.add(history_entry)
        
        # Create notification for medical update
        notification = Notification(
            title="Medical Update",
            message=f"{patient.household.household_name if patient.household else 'Unknown'} has sent a medical update",
            type="info",
            household_id=patient.household_id,
            patient_id=patient.id,
            data={
                'vitals': updates,
                'patient': {
                    'name': patient.name,
                    'patientId': patient.patient_id,
                    'age': patient.age,
                    'gender': patient.gender
                },
                'timestamp': datetime.now(zimbabwe_tz).isoformat()
            }
        )
        db.session.add(notification)
        
        db.session.commit()
        
        print(f"Updated patient {patient.name}: {updates}")
        
        return jsonify({
            'success': True,
            'patient': patient.name,
            'patientId': patient.patient_id,
            'updates': updates,
            'timestamp': datetime.now(zimbabwe_tz).isoformat()
        })
        
    except Exception as e:
        print(f"Error processing ESP32 reading: {e}")
        return jsonify({'error': f'Failed to process reading: {str(e)}'}), 500

# Notification endpoints
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get all notifications"""
    try:
        notifications = Notification.query.order_by(Notification.created_at.desc()).limit(50).all()
        return jsonify([notification.to_dict() for notification in notifications])
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return jsonify([])

@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        notification.is_read = True
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return jsonify({'error': 'Failed to mark notification as read'}), 500

@app.route('/api/notifications/unread-count', methods=['GET'])
def get_unread_count():
    """Get count of unread notifications"""
    try:
        count = Notification.query.filter_by(is_read=False).count()
        return jsonify({'count': count})
    except Exception as e:
        print(f"Error fetching unread count: {e}")
        return jsonify({'count': 0})

# Doctor comment endpoints
@app.route('/api/patients/<int:patient_id>/vitals/<int:vital_id>/comment', methods=['POST'])
def add_doctor_comment(patient_id, vital_id):
    """Add doctor comment to patient vital signs reading"""
    try:
        data = request.get_json()
        print(f"Received comment request: patient_id={patient_id}, vital_id={vital_id}, data={data}")
        
        if not data or 'comment' not in data:
            print("Missing comment text in request")
            return jsonify({'error': 'Missing comment text'}), 400
        
        # Verify patient exists
        patient = Patient.query.get_or_404(patient_id)
        print(f"Found patient: {patient.name}")
        
        # Find vital signs record
        vital_record = VitalSignsHistory.query.filter_by(id=vital_id, patient_id=patient_id).first()
        if not vital_record:
            print(f"Vital record not found: vital_id={vital_id}, patient_id={patient_id}")
            return jsonify({'error': 'Vital signs record not found'}), 404
        
        print(f"Found vital record: {vital_record.id}")
        
        # Add comment
        vital_record.doctor_comment = data['comment']
        vital_record.commented_at = datetime.now(zimbabwe_tz)
        vital_record.commented_by = data.get('doctorName', 'Doctor')
        
        print(f"Adding comment: '{data['comment']}' by {vital_record.commented_by}")
        
        db.session.commit()
        print("Comment saved successfully")
        
        return jsonify({
            'success': True,
            'vitalId': vital_record.id,
            'comment': vital_record.doctor_comment,
            'commentedAt': vital_record.commented_at.isoformat(),
            'commentedBy': vital_record.commented_by
        })
        
    except Exception as e:
        print(f"Error adding doctor comment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to add doctor comment'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
