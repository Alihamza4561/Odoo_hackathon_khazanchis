from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from model import db, Employee

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    
    if Employee.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400
        
    hashed_pw = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    new_emp = Employee(
        name=data['name'],
        email=email,
        password_hash=hashed_pw,
        role=data.get('role', 'employee'),
        status='Active'
    )
    
    db.session.add(new_emp)
    db.session.commit()
    return jsonify({"message": "User registered successfully", "id": new_emp.id}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = Employee.query.filter_by(email=data.get('email')).first()
    
    if not user or not check_password_hash(user.password_hash, data.get('password')):
        return jsonify({"message": "Invalid email or password"}), 401
        
    session['user_id'] = user.id
    session['user_role'] = user.role
    
    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role
        }
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@auth_bp.route('/me', methods=['GET'])
def get_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    user = Employee.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }), 200