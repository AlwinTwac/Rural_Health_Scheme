from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from flask_sqlalchemy import SQLAlchemy

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
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patient_id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'relation': self.relation_to_head,
            'householdId': self.household_id,
            'location': {'lat': float(self.latitude), 'lon': float(self.longitude)} if self.latitude and self.longitude else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None
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
            'timestamp': self.requested_at.isoformat() if self.requested_at else None,
            'location': patient_data.get('location', {}),
            'notes': self.notes
        }

# Pydantic Models for API validation
class VitalSigns(BaseModel):
    temperature: float
    heartRate: int
    bloodPressure: dict
    oxygenSaturation: Optional[int] = None
    timestamp: datetime = datetime.now()

class PatientRequest(BaseModel):
    name: str
    age: int
    gender: str
    relation_to_head: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class HouseholdRequest(BaseModel):
    household_name: str
    village: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Request(BaseModel):
    id: int
    patientId: str
    patientName: str
    severity: str
    symptoms: str
    vitals: VitalSigns
    location: dict
    distance: float
    status: str = 'pending'
    timestamp: datetime = datetime.now()

class Device(BaseModel):
    id: str
    householdId: str
    householdName: str
    status: str
    batteryLevel: int
    signalStrength: int
    firmwareVersion: str
    lastSeen: datetime
