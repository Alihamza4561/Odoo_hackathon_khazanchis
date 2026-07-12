import uuid
import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='Active')

class AssetCategory(db.Model):
    __tablename__ = 'asset_categories'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False, unique=True)

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='employee')
    status = db.Column(db.String(20), default='Active')
    department_id = db.Column(db.String(36), db.ForeignKey('departments.id'), nullable=True)

class Asset(db.Model):
    __tablename__ = 'assets'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    asset_tag = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(30), default='Available')
    is_bookable = db.Column(db.Boolean, default=False)
    current_holder_id = db.Column(db.String(36), db.ForeignKey('employees.id'), nullable=True)

class ResourceBooking(db.Model):
    __tablename__ = 'resource_bookings'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=False)
    booked_by_id = db.Column(db.String(36), db.ForeignKey('employees.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(30), default='Ongoing')

class MaintenanceRequest(db.Model):
    __tablename__ = 'maintenance_requests'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=False)
    asset_name = db.Column(db.String(100), nullable=True)
    issue_title = db.Column(db.String(200), nullable=False)
    issue_description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='Medium')
    status = db.Column(db.String(40), default='Pending')
    assigned_technician = db.Column(db.String(100), nullable=True)
    requested_by = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class AuditCycle(db.Model):
    __tablename__ = 'audit_cycles'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class AuditItem(db.Model):
    __tablename__ = 'audit_items'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    audit_cycle_id = db.Column(db.String(36), db.ForeignKey('audit_cycles.id'), nullable=False)
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=False)
    verification_status = db.Column(db.String(30), default='Pending')
    notes = db.Column(db.Text, nullable=True)

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    type = db.Column(db.String(30), nullable=False)
    message = db.Column(db.Text, nullable=False)
    time_label = db.Column(db.String(50), default='Just now')
    status = db.Column(db.String(20), default='Unread')
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)