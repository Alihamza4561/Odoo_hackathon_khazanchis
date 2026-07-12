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

class MaintenanceRequest(db.Model):
    __tablename__ = 'maintenance_requests'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=False)
    issue_description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='Medium') 
    status = db.Column(db.String(30), default='Pending') 
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class AssetCategory(db.Model):
    __tablename__ = 'asset_categories'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), unique=True, nullable=False) # e.g., Electronics, Furniture[cite: 1]

class AuditCycle(db.Model):
    __tablename__ = 'audit_cycles'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False) # e.g., "Q3 Electronics Audit"[cite: 1]
    status = db.Column(db.String(20), default='Open') # Open, Closed[cite: 1]
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class AuditItem(db.Model):
    __tablename__ = 'audit_items'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    audit_cycle_id = db.Column(db.String(36), db.ForeignKey('audit_cycles.id'), nullable=False)
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=False)
    verification_status = db.Column(db.String(30), default='Pending') # Pending, Verified, Missing, Damaged[cite: 1]
    notes = db.Column(db.Text, nullable=True)