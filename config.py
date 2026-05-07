import json
from urllib.parse import quote_plus


AWS_REGION = "ap-south-1"
DATABASE_SECRET_NAME = "prod/flask-blog/db"


def load_database_secret():
    import boto3

    client = boto3.client("secretsmanager", region_name=AWS_REGION)
    response = client.get_secret_value(SecretId=DATABASE_SECRET_NAME)
    return json.loads(response["SecretString"])


def build_database_url(secret):
    """Convert Secrets Manager JSON into a SQLAlchemy MySQL URL."""
    if not secret:
        return None

    if secret.get("DATABASE_URL"):
        return secret["DATABASE_URL"]

    username = secret.get("username")
    password = secret.get("password")
    host = secret.get("host")
    port = secret.get("port", 3306)
    db_name = secret.get("dbname")

    if not all([username, password, host, db_name]):
        return None

    return (
        "mysql+pymysql://"
        f"{quote_plus(str(username))}:{quote_plus(str(password))}"
        f"@{host}:{port}/{db_name}"
    )


DATABASE_SECRET = load_database_secret()


class Config:
    SECRET_KEY = DATABASE_SECRET["SECRET_KEY"]
    SQLALCHEMY_DATABASE_URI = build_database_url(DATABASE_SECRET)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
