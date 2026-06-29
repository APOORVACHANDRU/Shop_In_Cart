from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database_models
from database import engine
from config import CORS_ORIGINS
from routers import products, sales, purchases, ai

# Create all tables (safe — won't fail if tables already exist)
try:
    database_models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: create_all failed: {e}")

# Seed database (non-critical — app should still work without seed data)
try:
    from seed import init_db
    init_db()
except Exception as e:
    print(f"Warning: init_db failed: {e}")

# App
app = FastAPI(
    title="Aarion Inventory API",
    version="1.0.0",
    description="Full-stack inventory management with sales/purchase order workflows, expense tracking, and AI-powered insights.",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(purchases.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {"message": "Aarion Inventory API", "version": "1.0.0"}
