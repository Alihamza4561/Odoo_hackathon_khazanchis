from flask import Blueprint, jsonify
from model import db, Asset, Employee

seed_bp = Blueprint('seed', __name__)

@seed_bp.route('/seed', methods=['POST'])
def seed_data():
    if not Employee.query.filter_by(email="admin@assetflow.com").first():
        admin = Employee(name="Admin User", email="admin@assetflow.com", password_hash="dummy", role="ADMIN")
        db.session.add(admin)
        
    if not Asset.query.first():
        asset1 = Asset(asset_tag="AST-001", name="MacBook Pro", category="Electronics", status="Available", is_bookable=True)
        asset2 = Asset(asset_tag="AST-002", name="Dell Monitor", category="Electronics", status="Allocated", is_bookable=False)
        db.session.add_all([asset1, asset2])
        
    db.session.commit()
    return jsonify({"message": "Database seeded successfully!"}), 200