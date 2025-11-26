from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy
db = SQLAlchemy()

# Import models here to avoid circular imports
def init_models():
    from .database_models import User, Household, Patient, MedicalRequest
    return User, Household, Patient, MedicalRequest
