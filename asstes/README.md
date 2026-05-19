<<<<<<< HEAD
# Flask Blog App for AWS 3-Tier Deployment

This project is a simple Flask blog application designed for a 3-tier AWS setup:

- Presentation tier: NGINX on EC2
- Application tier: Gunicorn serving Flask on EC2
- Data tier: Amazon RDS MySQL

## 1. Folder structure

```text
3 tier web app/
|-- app/
|   |-- __init__.py
|   |-- forms.py
|   |-- models.py
|   |-- auth/
|   |   `-- routes.py
|   |-- main/
|   |   `-- routes.py
|   |-- posts/
|   |   `-- routes.py
|   `-- templates/
|       |-- base.html
|       |-- index.html
|       |-- login.html
|       |-- post_detail.html
|       |-- post_form.html
|       `-- register.html
|-- .env.example
|-- .gitignore
|-- config.py
|-- requirements.txt
|-- run.py
|-- wsgi.py
`-- README.md
```

## 2. Core features included

- User registration and login
- Create, view, edit, and delete blog posts
- Add comments to posts
- SQLAlchemy models for `User`, `Post`, and `Comment`
- Environment-based database configuration for MySQL / Amazon RDS
- Gunicorn-ready `wsgi.py`

## 3. SQLAlchemy models

The models are defined in `app/models.py`:

- `User`: stores username, email, hashed password
- `Post`: stores title, content, author, timestamps
- `Comment`: stores comment content, author, post, timestamp

Relationships:

- One user can have many posts
- One user can have many comments
- One post can have many comments

## 4. Routes

Main routes:

- `/` : list all blog posts
- `/auth/register` : register a new user
- `/auth/login` : login
- `/auth/logout` : logout
- `/posts/create` : create a post
- `/posts/<post_id>` : view a single post and its comments
- `/posts/<post_id>/edit` : edit your own post
- `/posts/<post_id>/delete` : delete your own post

## 5. Run locally

### Prerequisites

- Python 3.10+
- MySQL running locally, or an Amazon RDS MySQL instance

### Create database

Run this in MySQL:

```sql
CREATE DATABASE blogdb;
CREATE USER 'bloguser'@'%' IDENTIFIED BY 'strongpassword';
GRANT ALL PRIVILEGES ON blogdb.* TO 'bloguser'@'%';
FLUSH PRIVILEGES;
```

### Create and activate virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Set environment variables

Copy `.env.example` to `.env` and update the values:

```env
SECRET_KEY=replace-with-a-long-random-string
DATABASE_URL=mysql+pymysql://bloguser:strongpassword@localhost:3306/blogdb
```

If you want Flask to load `.env` automatically, install `python-dotenv` which is already included.

### Initialize the database schema

Flask-Migrate commands:

Windows PowerShell:

```powershell
$env:FLASK_APP = "run.py"
flask db init
flask db migrate -m "Initial schema"
flask db upgrade
```

Linux/macOS:

```bash
export FLASK_APP=run.py
flask db init
flask db migrate -m "Initial schema"
flask db upgrade
```

### Run the app

```bash
python run.py
```

Open `http://127.0.0.1:5000`

## 6. Deploy on EC2 behind NGINX

### EC2 instance setup

Use an Ubuntu EC2 instance and allow:

- Port 22 for SSH
- Port 80 for HTTP
- Port 443 for HTTPS if you later add SSL

Install packages:

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv nginx mysql-client
```

### Copy project to EC2

You can use `scp`, Git, or a CI/CD pipeline:

```bash
scp -r . ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/flask-blog
```

### Configure application environment

```bash
cd /home/ubuntu/flask-blog
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set:

```env
SECRET_KEY=your-production-secret
DATABASE_URL=mysql+pymysql://bloguser:strongpassword@your-rds-endpoint:3306/blogdb
```

Make sure your RDS security group allows inbound MySQL traffic from the EC2 instance security group on port `3306`.

### Create database tables in RDS

```bash
export FLASK_APP=run.py
flask db init
flask db migrate -m "Initial schema"
flask db upgrade
```

### Test Gunicorn

```bash
gunicorn --bind 127.0.0.1:8000 wsgi:app
```

### Create a systemd service

Create `/etc/systemd/system/flask-blog.service`:

```ini
[Unit]
Description=Gunicorn service for Flask blog
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/flask-blog
EnvironmentFile=/home/ubuntu/flask-blog/.env
ExecStart=/home/ubuntu/flask-blog/.venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 wsgi:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable flask-blog
sudo systemctl start flask-blog
sudo systemctl status flask-blog
```

### Configure NGINX

Create `/etc/nginx/sites-available/flask-blog`:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_PUBLIC_IP;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/flask-blog /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

### Optional SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 7. Notes for AWS architecture

- EC2 hosts NGINX and Gunicorn
- RDS MySQL stores users, posts, and comments
- Security groups should only allow:
  - Internet to EC2 on `80/443`
  - Your admin IP to EC2 on `22`
  - EC2 security group to RDS on `3306`

## 8. Gunicorn startup command

```bash
gunicorn --workers 3 --bind 0.0.0.0:8000 wsgi:app
```

For production behind NGINX, prefer binding to `127.0.0.1:8000`.
=======
# arun2786-3-tier-architect-web-application
>>>>>>> b0fbe8998db7eb05504bbf8e42af56c031ce5530
