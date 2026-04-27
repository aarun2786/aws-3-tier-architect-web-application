# Three-Tier Blog App

This version uses option 2:

- `frontend/` is a static HTML/CSS/JS app for NGINX
- Flask is only the backend API
- MySQL or RDS stores application data

## Project structure

```text
3-tier-architect-web-application/
|-- app/
|   |-- __init__.py
|   |-- models.py
|   |-- auth/
|   |   |-- __init__.py
|   |   `-- routes.py
|   |-- main/
|   |   |-- __init__.py
|   |   `-- routes.py
|   `-- posts/
|       |-- __init__.py
|       `-- routes.py
|-- frontend/
|   |-- index.html
|   |-- app.js
|   `-- styles.css
|-- config.py
|-- requirements.txt
|-- run.py
`-- wsgi.py
```

## Local setup

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Set environment variables in `.env`:

```env
SECRET_KEY=replace-me
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/blogdb
```

If `DATABASE_URL` is not set, the app falls back to a local SQLite file for easier testing.

Run the backend:

```powershell
python run.py
```

Open the static frontend by serving `frontend/` with NGINX or any simple static server.

## API endpoints

- `GET /api/health`
- `GET /api/session`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/posts`
- `POST /api/posts`
- `GET /api/posts/<id>`
- `PUT /api/posts/<id>`
- `DELETE /api/posts/<id>`
- `POST /api/posts/<id>/comments`

## NGINX example

```nginx
server {
    listen 80;
    server_name your-domain-or-ip;

    root /home/ubuntu/3-tier-architect-web-application/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Gunicorn example

```bash
gunicorn --bind 127.0.0.1:8000 wsgi:app
```
# aws-3-tier-architect-web-application
