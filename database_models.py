from datetime import datetime
import pytz
from flask_sqlalchemy import SQLAlchemy

# Import db from database module
from database import db

# Zimbabwe timezone
zimbabwe_tz = pytz.timezone('Africa/Harare')

def get_zimbabwe_time():
    """Get current time in Zimbabwe timezone"""
    return datetime.now(zimbabwe_tz)

def utc_to_zimbabwe(utc_dt):
    """Convert UTC datetime to Zimbabwe timezone"""
    if utc_dt:
        if utc_dt.tzinfo is None:
            utc_dt = pytz.utc.localize(utc_dt)
        return utc_dt.astimezone(zimbabwe_tz)
    return None

# SQLAlchemy Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='admin')
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    last_login = db.Column(db.TIMESTAMP)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Household(db.Model):
    __tablename__ = 'households'
    
    id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(db.String(50), unique=True, nullable=False)
    household_name = db.Column(db.String(100), nullable=False)
    village = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    latitude = db.Column(db.Numeric(10, 8))
    longitude = db.Column(db.Numeric(11, 8))
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with patients
    patients = db.relationship('Patient', backref='household', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'householdId': self.household_id,
            'name': self.household_name,
            'village': self.village,
            'phone': self.phone,
            'location': {'lat': float(self.latitude), 'lon': float(self.longitude)} if self.latitude and self.longitude else None,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'members': [patient.to_dict() for patient in self.patients]
        }

class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(50), unique=True, nullable=False)
    household_id = db.Column(db.Integer, db.ForeignKey('households.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))
    relation_to_head = db.Column(db.String(50))
    latitude = db.Column(db.Numeric(10, 8))
    longitude = db.Column(db.Numeric(11, 8))
    
    # Vital signs fields
    temperature = db.Column(db.Numeric(5, 2))
    heart_rate = db.Column(db.Integer)
    blood_pressure_systolic = db.Column(db.Integer)
    blood_pressure_diastolic = db.Column(db.Integer)
    last_vitals_reading = db.Column(db.TIMESTAMP)
    
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        # Get household name manually to avoid relationship issues
        household_name = 'Unknown'
        if self.household_id:
            try:
                from database_models import Household
                household = Household.query.get(self.household_id)
                if household:
                    household_name = household.household_name
            except:
                pass
        
        return {
            'id': self.id,
            'patientId': self.patient_id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'relation': self.relation_to_head,
            'householdId': self.household_id,
            'household': household_name,
            'location': {'lat': float(self.latitude), 'lon': float(self.longitude)} if self.latitude and self.longitude else None,
            'vitals': {
                'temperature': float(self.temperature) if self.temperature else None,
                'heartRate': self.heart_rate,
                'bloodPressure': {
                    'systolic': self.blood_pressure_systolic,
                    'diastolic': self.blood_pressure_diastolic
                } if self.blood_pressure_systolic and self.blood_pressure_diastolic else None,
                'lastReading': utc_to_zimbabwe(self.last_vitals_reading).isoformat() if self.last_vitals_reading else None
            },
            'createdAt': utc_to_zimbabwe(self.created_at).isoformat() if self.created_at else None
        }

class VitalSignsHistory(db.Model):
    __tablename__ = 'vital_signs_history'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    temperature = db.Column(db.Numeric(5, 2))
    heart_rate = db.Column(db.Integer)
    blood_pressure_systolic = db.Column(db.Integer)
    blood_pressure_diastolic = db.Column(db.Integer)
    recorded_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    recorded_by = db.Column(db.String(50))
    doctor_comment = db.Column(db.Text)  # New field for doctor comments
    commented_at = db.Column(db.TIMESTAMP)  # When the comment was added
    commented_by = db.Column(db.String(100))  # Doctor who commented
    notes = db.Column(db.Text)
    
    # Relationship with patient
    patient = db.relationship('Patient', backref='vital_history')
    
    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patient.patient_id if self.patient else None,
            'patientName': self.patient.name if self.patient else None,
            'vitals': {
                'temperature': float(self.temperature) if self.temperature else None,
                'heartRate': self.heart_rate,
                'bloodPressure': {
                    'systolic': self.blood_pressure_systolic,
                    'diastolic': self.blood_pressure_diastolic
                } if self.blood_pressure_systolic and self.blood_pressure_diastolic else None
            },
            'recordedAt': utc_to_zimbabwe(self.recorded_at).isoformat() if self.recorded_at else None,
            'recordedBy': self.recorded_by,
            'doctorComment': self.doctor_comment,
            'commentedAt': utc_to_zimbabwe(self.commented_at).isoformat() if self.commented_at else None,
            'commentedBy': self.commented_by,
            'notes': self.notes
        }

class MedicalRequest(db.Model):
    __tablename__ = 'medical_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.String(50), unique=True, nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    symptoms = db.Column(db.Text)
    vital_signs = db.Column(db.JSON)
    status = db.Column(db.String(20), default='pending')
    priority_score = db.Column(db.Integer, default=0)
    requested_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    accepted_at = db.Column(db.TIMESTAMP)
    completed_at = db.Column(db.TIMESTAMP)
    notes = db.Column(db.Text)
    
    # Relationship with patient
    patient = db.relationship('Patient', backref='medical_requests')
    
    def to_dict(self):
        patient_data = self.patient.to_dict() if self.patient else {}
        return {
            'id': self.id,
            'requestId': self.request_id,
            'patientId': patient_data.get('patientId', ''),
            'patientName': patient_data.get('name', ''),
            'age': patient_data.get('age', None),
            'gender': patient_data.get('gender', ''),
            'household': self.patient.household.household_name if self.patient and self.patient.household else '',
            'householdId': self.patient.household.household_id if self.patient and self.patient.household else '',
            'severity': self.severity,
            'symptoms': self.symptoms,
            'vitals': self.vital_signs or {},
            'status': self.status,
            'timestamp': utc_to_zimbabwe(self.requested_at).isoformat() if self.requested_at else None,
            'location': patient_data.get('location', {}),
            'notes': self.notes
        }

class Notification(db.Model):
    """Model for real-time notifications"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='info')  # info, warning, success, error
    household_id = db.Column(db.Integer, db.ForeignKey('households.id'))
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'))
    data = db.Column(db.JSON)  # Additional data like vitals, patient info
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    household = db.relationship('Household', backref='notifications')
    patient = db.relationship('Patient', backref='notifications')
    
    def to_dict(self):
        household_name = self.household.household_name if self.household else 'Unknown'
        patient_name = self.patient.name if self.patient else None
        
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'household': household_name,
            'householdId': self.household_id,
            'patient': patient_name,
            'patientId': self.patient.patient_id if self.patient else None,
            'data': self.data or {},
            'isRead': self.is_read,
            'createdAt': utc_to_zimbabwe(self.created_at).isoformat() if self.created_at else None
        }
