from flask_sqlalchemy import SQLAlchemy
import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='Active') 
    manager_id = db.Column(db.String(36), db.ForeignKey('employees.id', use_alter=True), nullable=True)

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='EMPLOYEE')
    status = db.Column(db.String(20), default='ACTIVE')
    department_id = db.Column(db.String(36), db.ForeignKey('departments.id'), nullable=True)

class Asset(db.Model):
    __tablename__ = 'assets'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    asset_tag = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False) 
    status = db.Column(db.String(30), default='Available') 
    current_holder_id = db.Column(db.String(36), db.ForeignKey('employees.id'), nullable=True)
    is_bookable = db.Column(db.Boolean, default=False) 

class ResourceBooking(db.Model):
    __tablename__ = 'resource_bookings'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=False)
    booked_by_id = db.Column(db.String(36), db.ForeignKey('employees.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='Upcoming')