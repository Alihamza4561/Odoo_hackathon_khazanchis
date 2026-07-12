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

# ----------------- RESOURCE BOOKING (WITH OVERLAP VALIDATION) -----------------
@core_bp.route('/bookings', methods=['POST'])
def create_booking():
    data = request.json
    asset_id = data['asset_id']
    
    # Parse incoming strings into python datetime objects
    start_time = datetime.fromisoformat(data['start_time'])
    end_time = datetime.fromisoformat(data['end_time'])

    # Core Hackathon Logic: Prevent Overlapping Bookings[cite: 1]
    # Check if any existing booking overlaps with this requested timeframe
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