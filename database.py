from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_url = "postgresql://neondb_owner:npg_FyYGbt3ZNr2R@ep-nameless-voice-adxnqa0e.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)