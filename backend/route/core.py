from flask import Blueprint, request, jsonify
from model import db, Asset, ResourceBooking, Employee, Department, MaintenanceRequest, AssetCategory, AuditCycle, AuditItem  
from datetime import datetime

core_bp = Blueprint('core', __name__)

def get_current_user():
    return {"id": "mock-admin-id", "role": "ADMIN"}

@core_bp.route('/assets', methods=['POST'])
def register_asset():
    data = request.json
    user = get_current_user()
    
    if user['role'] not in ['ADMIN', 'MANAGER']: 
        return jsonify({"error": "Access Denied. Insufficient permissions."}), 403

    new_asset = Asset(
        asset_tag=data['asset_tag'],
        name=data['name'],
        category=data['category'],
        is_bookable=data.get('is_bookable', False)
    )
    db.session.add(new_asset)
    db.session.commit()
    return jsonify({"message": "Asset registered successfully", "id": new_asset.id}), 201

@core_bp.route('/assets', methods=['GET'])
def get_assets():
    assets = Asset.query.all()
    output = []
    for asset in assets:
        output.append({
            "id": asset.id,
            "asset_tag": asset.asset_tag,
            "name": asset.name,
            "category": asset.category,
            "status": asset.status,
            "is_bookable": asset.is_bookable
        })
    return jsonify(output), 200

@core_bp.route('/bookings', methods=['POST'])
def create_booking():
    data = request.json
    asset_id = data['asset_id']
    
    start_time = datetime.fromisoformat(data['start_time'])
    end_time = datetime.fromisoformat(data['end_time'])

    overlapping_booking = ResourceBooking.query.filter(
        ResourceBooking.asset_id == asset_id,
        ResourceBooking.status != 'Cancelled',
        ResourceBooking.start_time < end_time,
        ResourceBooking.end_time > start_time
    ).first()

    if overlapping_booking:
        return jsonify({
            "error": "Conflict detected. This resource is already booked during the requested time slot."
        }), 409

    new_booking = ResourceBooking(
        asset_id=asset_id,
        booked_by_id=data['booked_by_id'],
        start_time=start_time,
        end_time=end_time
    )
    db.session.add(new_booking)
    db.session.commit()
    
    return jsonify({"message": "Booking confirmed successfully!", "booking_id": new_booking.id}), 201

@core_bp.route('/employees', methods=['GET'])
def get_employee_directory():
    employees = Employee.query.all()
    output = []
    for emp in employees:
        output.append({
            "id": emp.id,
            "name": emp.name,
            "email": emp.email,
            "role": emp.role,
            "status": emp.status,
            "department_id": emp.department_id
        })
    return jsonify(output), 200


@core_bp.route('/assets/<asset_id>/allocate', methods=['POST'])
def allocate_asset(asset_id):
    data = request.json
    employee_id = data.get('employee_id')
    
    asset = Asset.query.get_or_404(asset_id)

    if asset.status == 'Allocated':
        current_holder = Employee.query.get(asset.current_holder_id)
        holder_name = current_holder.name if current_holder else "another employee"
        
        return jsonify({
            "error": "Conflict",
            "message": f"Asset is currently held by {holder_name}. Please submit a Transfer Request instead."
        }), 409

    asset.status = 'Allocated'[cite: 1]
    asset.current_holder_id = employee_id
    db.session.commit()
    
    return jsonify({"message": f"Asset successfully allocated to employee."}), 200

@core_bp.route('/assets/<asset_id>/return', methods=['POST'])
def return_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    
    if asset.status != 'Allocated':
        return jsonify({"error": "Asset is not currently allocated."}), 400
        
    asset.status = 'Available'[cite: 1]
    asset.current_holder_id = None
    db.session.commit()
    
    return jsonify({"message": "Asset successfully marked as returned and is now Available."}), 200




@core_bp.route('/assets/search', methods=['GET'])
def search_assets():
    category = request.args.get('category')
    status = request.args.get('status')
    
    query = Asset.query
    if category:
        query = query.filter(Asset.category == category)
    if status:
        query = query.filter(Asset.status == status)
        
    assets = query.all()
    output = []
    for asset in assets:
        output.append({
            "id": asset.id,
            "asset_tag": asset.asset_tag,
            "name": asset.name,
            "category": asset.category,
            "status": asset.status
        })
    return jsonify(output), 200

@core_bp.route('/maintenance', methods=['POST'])
def raise_maintenance():
    data = request.json
    asset_id = data['asset_id']
    
    # Verify asset exists
    asset = Asset.query.get_or_404(asset_id)
    
    new_request = MaintenanceRequest(
        asset_id=asset_id,
        issue_description=data['issue_description'],
        priority=data.get('priority', 'Medium')
    )
    db.session.add(new_request)
    db.session.commit()
    return jsonify({"message": "Maintenance request raised successfully.", "id": new_request.id}), 201


@core_bp.route('/maintenance/<request_id>/approve', methods=['POST'])
def approve_maintenance(request_id):
    req_maintenance = MaintenanceRequest.query.get_or_404(request_id)
    req_maintenance.status = 'Approved'[cite: 1]
    
    # Automatically switch asset lifecycle state to 'Under Maintenance'[cite: 1]
    asset = Asset.query.get(req_maintenance.asset_id)
    if asset:
        asset.status = 'Under Maintenance'[cite: 1]
        
    db.session.commit()
    return jsonify({"message": "Maintenance approved. Asset status updated to Under Maintenance."}), 200

from model import AssetCategory, AuditCycle, AuditItem # Update your imports at the top

# ----------------- ORG SETUP: DEPARTMENTS & CATEGORIES (Screen 3) -----------------
@core_bp.route('/departments', methods=['POST'])
def create_department():
    data = request.json
    new_dept = Department(name=data['name'], status='Active')[cite: 1]
    db.session.add(new_dept)
    db.session.commit()
    return jsonify({"message": "Department created successfully", "id": new_dept.id}), 201

@core_bp.route('/categories', methods=['POST'])
def create_category():
    data = request.json
    new_cat = AssetCategory(name=data['name'])
    db.session.add(new_cat)
    db.session.commit()
    return jsonify({"message": "Category created successfully", "id": new_cat.id}), 201

@core_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = AssetCategory.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in categories]), 200


# ----------------- ASSET AUDITING SYSTEM (Screen 8) -----------------
@core_bp.route('/audits', methods=['POST'])
def start_audit_cycle():
    data = request.json
    # Create the cycle container[cite: 1]
    new_cycle = AuditCycle(name=data['name'])[cite: 1]
    db.session.add(new_cycle)
    db.session.flush() # Gets the new_cycle.id before committing
    
    # Automatically snapshot all assets into this audit cycle scope
    all_assets = Asset.query.filter(Asset.status.in_(['Available', 'Allocated'])).all()
    for asset in all_assets:
        item = AuditItem(audit_cycle_id=new_cycle.id, asset_id=asset.id, verification_status='Pending')[cite: 1]
        db.session.add(item)
        
    db.session.commit()
    return jsonify({"message": "Audit cycle initiated and assets scoped successfully.", "audit_id": new_cycle.id}), 201

@core_bp.route('/audits/<cycle_id>/verify', methods=['PATCH'])
def verify_audit_item():
    data = request.json
    asset_id = data['asset_id']
    status_v = data['status'] # Verified, Missing, or Damaged[cite: 1]
    
    item = AuditItem.query.filter_by(audit_cycle_id=cycle_id, asset_id=asset_id).first_or_404()
    item.verification_status = status_v[cite: 1]
    item.notes = data.get('notes', '')
    
    # If explicitly confirmed missing, flip asset state to 'Lost' automatically[cite: 1]
    if status_v == 'Missing':
        asset = Asset.query.get(asset_id)
        if asset:
            asset.status = 'Lost'[cite: 1]
            
    db.session.commit()
    return jsonify({"message": "Asset verification recorded successfully."}), 200

@core_bp.route('/departments', methods=['POST'])
def create_department():
    data = request.json
    new_dept = Department(name=data['name'], status='Active')[cite: 1]
    db.session.add(new_dept)
    db.session.commit()
    return jsonify({"message": "Department created successfully", "id": new_dept.id}), 201

@core_bp.route('/categories', methods=['POST'])
def create_category():
    data = request.json
    new_cat = AssetCategory(name=data['name'])
    db.session.add(new_cat)
    db.session.commit()
    return jsonify({"message": "Category created successfully", "id": new_cat.id}), 201

@core_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = AssetCategory.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in categories]), 200


# ----------------- ASSET AUDITING SYSTEM (Screen 8) -----------------
@core_bp.route('/audits', methods=['POST'])
def start_audit_cycle():
    data = request.json
    # Create the cycle container[cite: 1]
    new_cycle = AuditCycle(name=data['name'])[cite: 1]
    db.session.add(new_cycle)
    db.session.flush() # Gets the new_cycle.id before committing
    
    # Automatically snapshot all assets into this audit cycle scope
    all_assets = Asset.query.filter(Asset.status.in_(['Available', 'Allocated'])).all()
    for asset in all_assets:
        item = AuditItem(audit_cycle_id=new_cycle.id, asset_id=asset.id, verification_status='Pending')[cite: 1]
        db.session.add(item)
        
    db.session.commit()
    return jsonify({"message": "Audit cycle initiated and assets scoped successfully.", "audit_id": new_cycle.id}), 201

@core_bp.route('/audits/<cycle_id>/verify', methods=['PATCH'])
def verify_audit_item():
    data = request.json
    asset_id = data['asset_id']
    status_v = data['status'] # Verified, Missing, or Damaged[cite: 1]
    
    item = AuditItem.query.filter_by(audit_cycle_id=cycle_id, asset_id=asset_id).first_or_404()
    item.verification_status = status_v[cite: 1]
    item.notes = data.get('notes', '')
    
    # If explicitly confirmed missing, flip asset state to 'Lost' automatically[cite: 1]
    if status_v == 'Missing':
        asset = Asset.query.get(asset_id)
        if asset:
            asset.status = 'Lost'[cite: 1]
            
    db.session.commit()
    return jsonify({"message": "Asset verification recorded successfully."}), 200

@core_bp.route('/departments', methods=['POST'])
def create_department():
    data = request.json
    new_dept = Department(name=data['name'], status='Active')[cite: 1]
    db.session.add(new_dept)
    db.session.commit()
    return jsonify({"message": "Department created successfully", "id": new_dept.id}), 201

@core_bp.route('/categories', methods=['POST'])
def create_category():
    data = request.json
    new_cat = AssetCategory(name=data['name'])
    db.session.add(new_cat)
    db.session.commit()
    return jsonify({"message": "Category created successfully", "id": new_cat.id}), 201

@core_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = AssetCategory.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in categories]), 200

@core_bp.route('/audits', methods=['POST'])
def start_audit_cycle():
    data = request.json
    # Create the cycle container[cite: 1]
    new_cycle = AuditCycle(name=data['name'])[cite: 1]
    db.session.add(new_cycle)
    db.session.flush() # Gets the new_cycle.id before committing
    
    # Automatically snapshot all assets into this audit cycle scope
    all_assets = Asset.query.filter(Asset.status.in_(['Available', 'Allocated'])).all()
    for asset in all_assets:
        item = AuditItem(audit_cycle_id=new_cycle.id, asset_id=asset.id, verification_status='Pending')[cite: 1]
        db.session.add(item)
        
    db.session.commit()
    return jsonify({"message": "Audit cycle initiated and assets scoped successfully.", "audit_id": new_cycle.id}), 201

@core_bp.route('/audits/<cycle_id>/verify', methods=['PATCH'])
def verify_audit_item():
    data = request.json
    asset_id = data['asset_id']
    status_v = data['status'] # Verified, Missing, or Damaged[cite: 1]
    
    item = AuditItem.query.filter_by(audit_cycle_id=cycle_id, asset_id=asset_id).first_or_404()
    item.verification_status = status_v[cite: 1]
    item.notes = data.get('notes', '')
    
    # If explicitly confirmed missing, flip asset state to 'Lost' automatically[cite: 1]
    if status_v == 'Missing':
        asset = Asset.query.get(asset_id)
        if asset:
            asset.status = 'Lost'[cite: 1]
            
    db.session.commit()
    return jsonify({"message": "Asset verification recorded successfully."}), 200