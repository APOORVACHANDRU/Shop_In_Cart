# Aarion Trac - Product Inventory Manager

A full-stack product inventory management application built with FastAPI (Python) and React, deployed on Vercel with a Neon PostgreSQL cloud database.

## Live Demo

- **Frontend:** [Vercel Frontend URL]
- **Backend API:** [Vercel Backend URL]
- **API Docs:** [Backend URL]/docs

## Features

- Full CRUD operations (Create, Read, Update, Delete)
- PostgreSQL database with SQLAlchemy ORM
- React frontend with Myntra-inspired UI design
- Search and filter products
- Sortable columns
- Responsive layout
- Cloud deployment on Vercel
- Environment variables for secure configuration

## Tech Stack

| Layer      | Technology                     |
|------------|--------------------------------|
| Backend    | FastAPI, Python, Uvicorn       |
| Database   | PostgreSQL (Neon cloud)        |
| ORM        | SQLAlchemy                     |
| Validation | Pydantic                       |
| Frontend   | React, Axios                   |
| Deployment | Vercel                         |

## API Endpoints

| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| GET    | `/`                  | Welcome message      |
| GET    | `/products/`         | Get all products     |
| GET    | `/products/{id}`     | Get product by ID    |
| POST   | `/products/`         | Create a product     |
| PUT    | `/products/{id}`     | Update a product     |
| DELETE | `/products/{id}`     | Delete a product     |

## Project Structure

```
fastapi-demo/
├── main.py              # FastAPI app with all endpoints & CORS
├── models.py            # Pydantic models (request/response validation)
├── database.py          # SQLAlchemy engine & session config
├── database_models.py   # SQLAlchemy ORM models (DB tables)
├── requirements.txt     # Python dependencies
├── vercel.json          # Vercel deployment config for backend
├── .gitignore
├── README.md
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js           # Main React component
    │   ├── App.css          # Myntra-inspired styling
    │   ├── TaglineSection.js
    │   ├── index.js
    │   └── index.css
    ├── .env                 # Environment variables (not in git)
    └── package.json
```

## Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL installed locally (or use Neon cloud)

### Backend

```bash
# Create virtual environment
python -m venv myenv
myenv\Scripts\activate.ps1  # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

API available at: http://localhost:8000
Docs at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm start
```

App available at: http://localhost:3000

### Database (Local)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE telusko;
```

## Environment Variables

### Backend (set in Vercel → Settings → Environment Variables)

| Variable       | Description                  | Example                                      |
|----------------|------------------------------|----------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/dbname?sslmode=require` |

### Frontend (set in Vercel → Settings → Environment Variables)

| Variable             | Description       | Example                                |
|----------------------|-------------------|----------------------------------------|
| `REACT_APP_API_URL`  | Backend API URL   | `https://your-backend.vercel.app`      |

## Vercel Deployment

### Backend Project

1. Import GitHub repo on Vercel
2. Root directory: `.` (root)
3. Add `DATABASE_URL` environment variable with your Neon connection string
4. Deploy

### Frontend Project

1. Import the same GitHub repo on Vercel (new project)
2. Root directory: `frontend`
3. Framework: Create React App (auto-detected)
4. Add `REACT_APP_API_URL` environment variable with your backend Vercel URL
5. Deploy

### CORS

The backend allows requests from:
- `http://localhost:3000` (local development)
- Your deployed frontend Vercel URL

Update the `allow_origins` list in `main.py` if your frontend URL changes.

## API Usage Examples

### Get all products
```bash
curl https://your-backend.vercel.app/products/
```

### Create a product
```bash
curl -X POST "https://your-backend.vercel.app/products/" \
     -H "Content-Type: application/json" \
     -d '{
       "id": 5,
       "name": "Monitor",
       "description": "4K display",
       "price": 299.99,
       "quantity": 15
     }'
```

### Update a product
```bash
curl -X PUT "https://your-backend.vercel.app/products/5" \
     -H "Content-Type: application/json" \
     -d '{
       "id": 5,
       "name": "Monitor",
       "description": "4K Ultra HD display",
       "price": 349.99,
       "quantity": 12
     }'
```

### Delete a product
```bash
curl -X DELETE "https://your-backend.vercel.app/products/5"
```

## Built With

- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework for APIs
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL ORM
- [Pydantic](https://docs.pydantic.dev/) - Data validation
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [React](https://react.dev/) - Frontend UI library
- [Vercel](https://vercel.com/) - Deployment platform
