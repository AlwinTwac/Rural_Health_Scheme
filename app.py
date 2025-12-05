from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
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
from database_models import Household, Patient, MedicalRequest, VitalSignsHistory, Notification
from database_models import utc_to_zimbabwe  # Import timezone helper function

# --- Severity classification helper ---
def classify_vitals(temperature, heart_rate, systolic, diastolic):
    """Return (severity, priority_score, reasons[]) based on simple rules."""
    def to_float(v):
        try:
            return float(v) if v is not None else None
        except Exception:
            return None
    def to_int(v):
        try:
            return int(v) if v is not None else None
        except Exception:
            return None

    temp = to_float(temperature)
    hr = to_int(heart_rate)
    sys = to_int(systolic)
    dia = to_int(diastolic)

    # Per-metric severity: 0 normal, 1 abnormal, 2 critical
    metric_sev = 0
    score = 0
    reasons = []

    # Temperature thresholds (C)
    if temp is not None:
        if temp >= 38.5 or temp < 35.0:
            metric_sev = max(metric_sev, 2)
            score += 40
            reasons.append(f"Temperature critical: {temp}°C")
        elif temp >= 37.6 or (35.0 <= temp < 36.0):
            metric_sev = max(metric_sev, 1)
            score += 20
            reasons.append(f"Temperature abnormal: {temp}°C")

    # Heart Rate thresholds (bpm) - adult generic
    if hr is not None:
        if hr > 120 or hr < 40:
            metric_sev = max(metric_sev, 2)
            score += 40
            reasons.append(f"Heart rate critical: {hr} bpm")
        elif (100 < hr <= 120) or (40 <= hr < 60):
            metric_sev = max(metric_sev, 1)
            score += 20
            reasons.append(f"Heart rate abnormal: {hr} bpm")

    # Blood Pressure thresholds (mmHg)
    if sys is not None and dia is not None:
        if sys >= 180 or dia >= 120 or sys < 80 or dia < 50:
            metric_sev = max(metric_sev, 2)
            score += 40
            reasons.append(f"Blood pressure critical: {sys}/{dia}")
        elif (140 <= sys < 180) or (90 <= dia < 120) or not (90 <= sys <= 120 and 60 <= dia <= 80):
            metric_sev = max(metric_sev, 1)
            score += 20
            reasons.append(f"Blood pressure abnormal: {sys}/{dia}")

    severity = 'normal' if metric_sev == 0 else ('abnormal' if metric_sev == 1 else 'critical')
    # Base weight for severity
    if metric_sev == 2:
        score += 60
    elif metric_sev == 1:
        score += 30

    # Cap score
    score = min(score, 100)
    return severity, score, reasons

# --- Geo helper ---
def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two lat/lon in kilometers."""
    try:
        R = 6371.0
        phi1, phi2 = radians(float(lat1)), radians(float(lat2))
        dphi = radians(float(lat2) - float(lat1))
        dlambda = radians(float(lon2) - float(lon1))
        a = sin(dphi/2.0)**2 + cos(phi1) * cos(phi2) * sin(dlambda/2.0)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c
    except Exception:
        return None

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
        active_requests = (MedicalRequest.query
                           .filter_by(status='pending')
                           .order_by(MedicalRequest.priority_score.desc(), MedicalRequest.requested_at.desc())
                           .all())
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
    """Build a route for pending medical requests using real DB data.
    Body: { requestIds?: [ids], start?: {lat, lon} }
    If requestIds omitted, include all pending requests.
    """
    data = request.get_json(silent=True) or {}
    request_ids = data.get('requestIds')
    start = data.get('start')  # optional dict with lat, lon

    # Load medical requests
    query = MedicalRequest.query.filter_by(status='pending')
    if request_ids:
        try:
            query = query.filter(MedicalRequest.id.in_(request_ids))
        except Exception:
            pass
    reqs = query.options(joinedload(MedicalRequest.patient).joinedload(Patient.household)).all()

    located = []
    skipped = []
    for r in reqs:
        p = r.patient
        lat = float(p.latitude) if p and p.latitude is not None else None
        lon = float(p.longitude) if p and p.longitude is not None else None
        if (lat is None or lon is None) and p and p.household:
            # fallback to household location
            if p.household.latitude is not None and p.household.longitude is not None:
                lat = float(p.household.latitude)
                lon = float(p.household.longitude)
        if lat is None or lon is None:
            skipped.append({'requestId': r.request_id, 'id': r.id, 'patient': p.name if p else None, 'reason': 'No coordinates'})
            continue
        located.append({
            'req': r,
            'lat': lat,
            'lon': lon,
        })

    if not located:
        return jsonify({
            'stops': [],
            'totalDistance': 0,
            'skipped': skipped,
            'optimizationScore': 0
        })

    # Determine start position
    if start and 'lat' in start and 'lon' in start:
        curr_lat, curr_lon = float(start['lat']), float(start['lon'])
        start_name = 'Start'
    else:
        curr_lat, curr_lon = located[0]['lat'], located[0]['lon']
        start_name = located[0]['req'].patient.name if located[0]['req'].patient else 'Start'

    # Greedy nearest-neighbor route
    unvisited = located.copy()
    # If we used first as start and no explicit start point, remove it from unvisited and add as first stop with 0 distance
    stops = []
    total_km = 0.0
    if not start:
        first = unvisited.pop(0)
        r = first['req']
        stops.append({
            'id': r.id,
            'requestId': r.request_id,
            'patientId': r.patient.patient_id if r.patient else None,
            'patientName': r.patient.name if r.patient else None,
            'severity': r.severity,
            'priorityScore': r.priority_score,
            'lat': first['lat'],
            'lon': first['lon'],
            'distanceFromPrevKm': 0.0
        })
    while unvisited:
        # Find nearest to current
        best_i, best_d = None, None
        for i, item in enumerate(unvisited):
            d = haversine_km(curr_lat, curr_lon, item['lat'], item['lon'])
            if d is None:
                continue
            if best_d is None or d < best_d:
                best_d, best_i = d, i
        if best_i is None:
            break
        nxt = unvisited.pop(best_i)
        r = nxt['req']
        dist = best_d or 0.0
        total_km += dist
        stops.append({
            'id': r.id,
            'requestId': r.request_id,
            'patientId': r.patient.patient_id if r.patient else None,
            'patientName': r.patient.name if r.patient else None,
            'severity': r.severity,
            'priorityScore': r.priority_score,
            'lat': nxt['lat'],
            'lon': nxt['lon'],
            'distanceFromPrevKm': round(dist, 2)
        })
        curr_lat, curr_lon = nxt['lat'], nxt['lon']

    # Simple optimization score: higher for shorter routes + severity weighting
    if stops:
        max_sev_weight = max((s.get('priorityScore') or 0) for s in stops) or 1
    else:
        max_sev_weight = 1
    optimization_score = max(10, int(100 - min(total_km, 100)) + int(max_sev_weight/2))

    return jsonify({
        'stops': stops,
        'totalDistanceKm': round(total_km, 2),
        'skipped': skipped,
        'optimizationScore': optimization_score,
        'startName': start_name
    })

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
        
        # Parse vital signs data (accept any values; no range validation)
        temperature = data.get('temperature')
        heart_rate = data.get('heart_rate')
        bp_systolic = data.get('blood_pressure_systolic')
        bp_diastolic = data.get('blood_pressure_diastolic')

        def to_float(v):
            try:
                return float(v) if v is not None else None
            except Exception:
                return None

        def to_int(v):
            try:
                return int(v) if v is not None else None
            except Exception:
                return None

        typed_temp = to_float(temperature)
        typed_hr = to_int(heart_rate)
        typed_sys = to_int(bp_systolic)
        typed_dia = to_int(bp_diastolic)
        
        # Create vital signs history record
        vital_record = VitalSignsHistory(
            patient_id=patient.id,
            temperature=typed_temp,
            heart_rate=typed_hr,
            blood_pressure_systolic=typed_sys,
            blood_pressure_diastolic=typed_dia,
            recorded_by=data.get('recorded_by', 'external_device'),
            notes=data.get('notes')
        )
        db.session.add(vital_record)
        
        # Update patient's latest vitals
        patient.temperature = typed_temp
        patient.heart_rate = typed_hr
        patient.blood_pressure_systolic = typed_sys
        patient.blood_pressure_diastolic = typed_dia
        patient.last_vitals_reading = datetime.utcnow()
        
        db.session.commit()

        # --- Triage: classify severity and create/update active request ---
        severity, priority_score, reasons = classify_vitals(
            typed_temp, typed_hr, typed_sys, typed_dia
        )
        reasons_text = "; ".join(reasons)

        # Prepare compact vitals json for request
        vitals_payload = {
            'temperature': typed_temp,
            'heart_rate': typed_hr,
            'blood_pressure_systolic': typed_sys,
            'blood_pressure_diastolic': typed_dia,
            'source': 'ESP32_Field_Unit',
            'recordedAt': datetime.now(zimbabwe_tz).isoformat(),
        }

        # Find latest pending request for this patient, if any
        existing_req = (MedicalRequest.query
                        .filter_by(patient_id=patient.id, status='pending')
                        .order_by(MedicalRequest.requested_at.desc())
                        .first())

        sev_rank = {'normal': 0, 'abnormal': 1, 'critical': 2}
        if existing_req:
            # Update severity only if it escalates; always refresh vitals and priority
            if sev_rank.get(severity, 0) > sev_rank.get(existing_req.severity, 0):
                existing_req.severity = severity
            existing_req.priority_score = max(existing_req.priority_score or 0, priority_score)
            existing_req.vital_signs = vitals_payload
            existing_req.requested_at = datetime.utcnow()
            # Append notes with latest reasons (keep brief)
            note_line = f"Updated by ESP32: {reasons_text}" if reasons_text else "Updated by ESP32"
            existing_req.notes = (existing_req.notes + "\n" + note_line) if existing_req.notes else note_line
            db.session.commit()
            active_request = existing_req
        else:
            # Create a new pending request
            import uuid
            req = MedicalRequest(
                request_id=f"R-{str(uuid.uuid4())[:8].upper()}",
                patient_id=patient.id,
                severity=severity,
                vital_signs=vitals_payload,
                status='pending',
                priority_score=priority_score,
                requested_at=datetime.utcnow(),
                notes=reasons_text or None,
            )
            db.session.add(req)
            db.session.commit()
            active_request = req

        return jsonify({
            'success': True,
            'message': 'Vital signs recorded successfully',
            'patient': patient.to_dict(),
            'vitals_record': vital_record.to_dict(),
            'triage': {
                'severity': severity,
                'priorityScore': priority_score,
                'reasons': reasons
            },
            'activeRequest': active_request.to_dict()
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

# ESP32 Doctor Comments API
@app.route('/api/esp32/comments/<patient_id>', methods=['GET'])
def esp32_get_doctor_comments(patient_id):
    """ESP32 endpoint to fetch doctor comments for a specific patient"""
    try:
        print(f"ESP32 requesting comments for patient: {patient_id}")
        
        # Find patient by patient_id (string field)
        patient = Patient.query.filter_by(patient_id=patient_id).first()
        if not patient:
            print(f"Patient not found: {patient_id}")
            return jsonify({'error': 'Patient not found'}), 404
        
        print(f"Found patient: {patient.name}")
        
        # Get vital signs history with doctor comments
        vitals_with_comments = VitalSignsHistory.query.filter_by(
            patient_id=patient.id
        ).filter(
            VitalSignsHistory.doctor_comment.isnot(None)
        ).order_by(
            VitalSignsHistory.commented_at.desc()
        ).limit(10).all()
        
        comments_data = []
        for vital in vitals_with_comments:
            comment_data = {
                'comment': vital.doctor_comment,
                'commentedBy': vital.commented_by,
                'commentedAt': utc_to_zimbabwe(vital.commented_at).isoformat() if vital.commented_at else None,
                'vitals': {
                    'temperature': float(vital.temperature) if vital.temperature else None,
                    'heartRate': vital.heart_rate,
                    'bloodPressure': {
                        'systolic': vital.blood_pressure_systolic,
                        'diastolic': vital.blood_pressure_diastolic
                    } if vital.blood_pressure_systolic and vital.blood_pressure_diastolic else None
                },
                'recordedAt': utc_to_zimbabwe(vital.recorded_at).isoformat() if vital.recorded_at else None
            }
            comments_data.append(comment_data)
        
        response_data = {
            'patientId': patient.patient_id,
            'patientName': patient.name,
            'comments': comments_data,
            'totalComments': len(comments_data),
            'timestamp': datetime.now(zimbabwe_tz).isoformat()
        }
        
        print(f"Returning {len(comments_data)} comments for {patient.name}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error fetching doctor comments for ESP32: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch doctor comments'}), 500

@app.route('/api/esp32/comments/latest/<patient_id>', methods=['GET'])
def esp32_get_latest_comment(patient_id):
    """ESP32 endpoint to fetch only the latest doctor comment for a patient"""
    try:
        print(f"ESP32 requesting latest comment for patient: {patient_id}")
        
        # Find patient by patient_id (string field)
        patient = Patient.query.filter_by(patient_id=patient_id).first()
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Get the most recent vital sign with doctor comment
        latest_comment = VitalSignsHistory.query.filter_by(
            patient_id=patient.id
        ).filter(
            VitalSignsHistory.doctor_comment.isnot(None)
        ).order_by(
            VitalSignsHistory.commented_at.desc()
        ).first()
        
        if not latest_comment:
            return jsonify({
                'patientId': patient.patient_id,
                'patientName': patient.name,
                'hasComment': False,
                'message': 'No doctor comments found'
            })
        
        response_data = {
            'patientId': patient.patient_id,
            'patientName': patient.name,
            'hasComment': True,
            'comment': latest_comment.doctor_comment,
            'commentedBy': latest_comment.commented_by,
            'commentedAt': utc_to_zimbabwe(latest_comment.commented_at).isoformat() if latest_comment.commented_at else None,
            'vitals': {
                'temperature': float(latest_comment.temperature) if latest_comment.temperature else None,
                'heartRate': latest_comment.heart_rate,
                'bloodPressure': {
                    'systolic': latest_comment.blood_pressure_systolic,
                    'diastolic': latest_comment.blood_pressure_diastolic
                } if latest_comment.blood_pressure_systolic and latest_comment.blood_pressure_diastolic else None
            },
            'timestamp': datetime.now(zimbabwe_tz).isoformat()
        }
        
        print(f"Returning latest comment for {patient.name}: {latest_comment.commented_by}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error fetching latest doctor comment for ESP32: {e}")
        return jsonify({'error': 'Failed to fetch latest doctor comment'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
