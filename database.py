import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:root@localhost:5432/telusko")
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
