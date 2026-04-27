from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app import db
from app.models import Comment, Post


posts_bp = Blueprint("posts", __name__, url_prefix="/api/posts")


def normalize_text(value):
    return (value or "").strip()


def post_payload(post):
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
        "comments": [
            {
                "id": comment.id,
                "content": comment.content,
                "created_at": comment.created_at.isoformat(),
                "author": {
                    "id": comment.author.id,
                    "username": comment.author.username,
                },
            }
            for comment in post.comments
        ],
    }


@posts_bp.route("", methods=["POST"])
@login_required
def create_post():
    data = request.get_json(silent=True) or {}
    title = normalize_text(data.get("title"))
    content = normalize_text(data.get("content"))

    if not title or len(title) > 200:
        return jsonify({"error": "Title is required and must be 200 characters or fewer."}), 400
    if len(content) < 10:
        return jsonify({"error": "Content must be at least 10 characters long."}), 400

    post = Post(title=title, content=content, author=current_user)
    db.session.add(post)
    db.session.commit()
    return jsonify({"message": "Post created successfully.", "post": post_payload(post)}), 201


@posts_bp.route("/<int:post_id>", methods=["GET"])
def get_post(post_id):
    post = Post.query.get_or_404(post_id)
    return jsonify({"post": post_payload(post)})


@posts_bp.route("/<int:post_id>", methods=["PUT"])
@login_required
def update_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        return jsonify({"error": "You can only edit your own posts."}), 403

    data = request.get_json(silent=True) or {}
    title = normalize_text(data.get("title"))
    content = normalize_text(data.get("content"))

    if not title or len(title) > 200:
        return jsonify({"error": "Title is required and must be 200 characters or fewer."}), 400
    if len(content) < 10:
        return jsonify({"error": "Content must be at least 10 characters long."}), 400

    post.title = title
    post.content = content
    db.session.commit()
    return jsonify({"message": "Post updated successfully.", "post": post_payload(post)})


@posts_bp.route("/<int:post_id>", methods=["DELETE"])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        return jsonify({"error": "You can only delete your own posts."}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Post deleted."})


@posts_bp.route("/<int:post_id>/comments", methods=["POST"])
@login_required
def create_comment(post_id):
    post = Post.query.get_or_404(post_id)
    data = request.get_json(silent=True) or {}
    content = normalize_text(data.get("content"))

    if len(content) < 2:
        return jsonify({"error": "Comment must be at least 2 characters long."}), 400

    comment = Comment(content=content, author=current_user, post=post)
    db.session.add(comment)
    db.session.commit()
    return jsonify({"message": "Comment added.", "post": post_payload(post)}), 201
