from flask import Blueprint, request, jsonify
from model import db, Asset, ResourceBooking, Employee, Department
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