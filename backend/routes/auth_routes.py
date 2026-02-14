from flask import Blueprint, request, jsonify
import bcrypt
import jwt
import datetime
from config import JWT_SECRET
from db import users
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

auth_bp = Blueprint("auth", __name__)

def create_token(email):
    payload = {
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=2)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # ✅ capture inserted id
    result = users.insert_one({
        "name": name,
        "email": email,
        "password": hashed
    })

    token = create_token(email)

    return jsonify({
        "message": "Signup successful!",
        "token": token,
        "user": {
            "id": str(result.inserted_id),   # ✅ send user_id
            "name": name,
            "email": email
        }
    }), 200


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "All fields required"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return jsonify({"error": "Invalid password"}), 401

    token = create_token(email)

    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": {
            "id": str(user["_id"]),     # ✅ here
            "name": user["name"],
            "email": user["email"]
        }
    }), 200

import requests # Standard requests library

@auth_bp.route("/google-login", methods=["POST"])
def google_login():
    data = request.json
    access_token = data.get("token")
    
    if not access_token:
        return jsonify({"error": "Missing token"}), 400

    try:
        # Verify access token by fetching user info
        google_response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if google_response.status_code != 200:
            return jsonify({"error": "Invalid Google token"}), 400
            
        google_data = google_response.json()

        email = google_data.get("email")
        name = google_data.get("name")
        
        if not email:
            return jsonify({"error": "Invalid token payload"}), 400

        # Check if user exists
        user = users.find_one({"email": email})
        
        user_id = None
        if not user:
            # Register new user
            dummy_pw = bcrypt.hashpw(b"GOOGLE_AUTH_USER", bcrypt.gensalt())
            
            result = users.insert_one({
                "name": name,
                "email": email,
                "password": dummy_pw,
                "auth_provider": "google"
            })
            user_id = str(result.inserted_id)
        else:
            user_id = str(user["_id"])

        # Generate JWT for our app
        app_token = create_token(email)
        
        return jsonify({
            "message": "Google login successful!",
            "token": app_token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email
            }
        }), 200

    except Exception as e:
        print(f"Google login error: {e}")
        return jsonify({"error": "Google login failed"}), 500


@auth_bp.route("/profile", methods=["GET"])
def profile():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        email = decoded["email"]

        user = users.find_one({"email": email}, {"password": 0})
        return jsonify({"user": user}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired!"}), 403
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token!"}), 403

def create_token(email):
    payload = {
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=2)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # ✅ capture inserted id
    result = users.insert_one({
        "name": name,
        "email": email,
        "password": hashed
    })

    token = create_token(email)

    return jsonify({
        "message": "Signup successful!",
        "token": token,
        "user": {
            "id": str(result.inserted_id),   # ✅ send user_id
            "name": name,
            "email": email
        }
    }), 200


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "All fields required"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return jsonify({"error": "Invalid password"}), 401

    token = create_token(email)

    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": {
            "id": str(user["_id"]),     # ✅ here
            "name": user["name"],
            "email": user["email"]
        }
    }), 200

@auth_bp.route("/profile", methods=["GET"])
def profile():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        email = decoded["email"]

        user = users.find_one({"email": email}, {"password": 0})
        return jsonify({"user": user}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired!"}), 403
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token!"}), 403
