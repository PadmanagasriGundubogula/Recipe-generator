# routes/auth_routes.py

from flask import Blueprint, request, jsonify
import bcrypt
import jwt
import datetime
from config import JWT_SECRET
from db import users

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
