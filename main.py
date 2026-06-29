from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database_models
from database import engine
from config import CORS_ORIGINS
from seed import init_db
from routers import products, sales, purchases, ai

# Create all tables
database_models.Base.metadata.create_all(bind=engine)

# Seed database
init_db()

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
