import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:root@localhost:5432/telusko")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

CORS_ORIGINS = [
    "http://localhost:3000",
    "https://shop-in-cart.vercel.app",
]
