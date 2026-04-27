from flask import Blueprint, jsonify, request
from flask_login import current_user, login_user, logout_user

from app import db
from app.models import User


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat(),
    }


@auth_bp.route("/register", methods=["POST"])
def register():
    if current_user.is_authenticated:
        return jsonify({"error": "You are already logged in."}), 400

    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""

    if len(username) < 3 or len(username) > 80:
        return jsonify({"error": "Username must be between 3 and 80 characters."}), 400
    if not email or "@" not in email or len(email) > 120:
        return jsonify({"error": "A valid email address is required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    existing_user = User.query.filter((User.email == email) | (User.username == username)).first()
    if existing_user:
        return jsonify({"error": "A user with that email or username already exists."}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    login_user(user)

    return jsonify({"message": "Registration successful.", "user": user_payload(user)}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    if current_user.is_authenticated:
        return jsonify({"error": "You are already logged in."}), 400

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    login_user(user)
    return jsonify({"message": "Login successful.", "user": user_payload(user)})


@auth_bp.route("/logout", methods=["POST"])
def logout():
    if not current_user.is_authenticated:
        return jsonify({"error": "You are not logged in."}), 401

    logout_user()
    return jsonify({"message": "Logout successful."})
