from flask import Blueprint, jsonify
from flask_login import current_user

from app.models import Post
# from app.models import Post


main_bp = Blueprint("main", __name__)


def post_summary(post):
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "created_at": post.created_at.isoformat(),
        "updated_at": post.updated_at.isoformat(),
        "author": {
            "id": post.author.id,
            "username": post.author.username,
        },
        "comment_count": len(post.comments),
    }


@main_bp.route("/")
def home():
    return jsonify(
        {
            "message": "Three-tier blog backend is running.",
            "use_frontend": "Serve the frontend directory with NGINX and proxy /api to Gunicorn.",
        }
    )


@main_bp.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@main_bp.route("/api/session")
def session():
    if not current_user.is_authenticated:
        return jsonify({"authenticated": False, "user": None})

    return jsonify(
        {
            "authenticated": True,
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
            },
        }
    )


@main_bp.route("/api/posts", methods=["GET"])
def list_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify({"posts": [post_summary(post) for post in posts]})


print(list_posts())