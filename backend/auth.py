from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from datetime import timedelta, datetime
from database import db

auth_bp = Blueprint('auth', __name__)

def init_database():
    """Initialize database with tables and default admin"""
    try:
        # Import models to ensure they are created
        from database_models import Household, Patient, MedicalRequest, User
        
        # Create all tables
        db.create_all()
        
        # Check if admin user exists
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            # Create default admin user (password: admin123)
            admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
            admin_user = User(
                username='admin',
                password_hash=admin_password.decode('utf-8'),
                full_name='System Administrator',
                role='admin'
            )
            db.session.add(admin_user)
            db.session.commit()
            print("✓ Default admin user created (username: admin, password: admin123)")
        
        print("✓ Database initialized successfully")
        
    except Exception as e:
        print(f"⚠ Database initialization warning: {e}")
        print("⚠ Continuing without database initialization - tables may need to be created manually")
        # Don't raise the exception to allow the app to start

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
        # Query user from database
        from database_models import User
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
        
        # Verify password using bcrypt
        try:
            password_match = bcrypt.checkpw(
                password.encode('utf-8'),
                user.password_hash.encode('utf-8')
            )
        except Exception:
            return jsonify({
                'success': False,
                'message': 'Authentication error'
            }), 500
        
        if not password_match:
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create JWT token
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=1)
        )
        
        return jsonify({
            'success': True,
            'token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred during login'
        }), 500

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify JWT token"""
    try:
        user_id = get_jwt_identity()
        
        from database_models import User
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Token verification error: {e}")
        return jsonify({
            'success': False,
            'message': 'Invalid token'
        }), 401

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if not old_password or not new_password:
            return jsonify({
                'success': False,
                'message': 'Old and new passwords are required'
            }), 400
        
        from database_models import User
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Verify old password
        password_match = bcrypt.checkpw(
            old_password.encode('utf-8'),
            user.password_hash.encode('utf-8')
        )
        
        if not password_match:
            return jsonify({
                'success': False,
                'message': 'Invalid old password'
            }), 401
        
        # Update password with bcrypt
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        user.password_hash = new_password_hash.decode('utf-8')
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        print(f"Password change error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred'
        }), 500
