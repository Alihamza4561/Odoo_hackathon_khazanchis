import os
from flask import Flask
from flask_cors import CORS
from model import db
from route.core import core_bp
from route.auth import auth_bp
from dotenv import load_dotenv
from route.seeds import seed_bp

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)

    app.secret_key = os.environ.get('SECRET_KEY', 'super_secret_hackathon_khazanchis_key_2026')

    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'password')
    DB_HOST = os.environ.get('DB_HOST', '127.0.0.1')
    DB_NAME = os.environ.get('DB_NAME', 'assetflow_db')

    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    app.register_blueprint(core_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='127.0.0.1', port=5000, debug=True)