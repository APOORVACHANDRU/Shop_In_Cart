from sqlalchemy import text
from database import SessionLocal
import database_models


SEED_PRODUCTS = [
    {"id": 1, "name": "Phone", "description": "A smartphone", "price": 699.99, "quantity": 50},
    {"id": 2, "name": "Laptop", "description": "A powerful laptop", "price": 999.99, "quantity": 30},
    {"id": 3, "name": "Pen", "description": "A blue ink pen", "price": 1.99, "quantity": 100},
    {"id": 4, "name": "Table", "description": "A wooden table", "price": 199.99, "quantity": 20},
]


def init_db():
    db = SessionLocal()
    try:
        existing_count = db.query(database_models.Product).count()

        if existing_count == 0:
            for product_data in SEED_PRODUCTS:
                db.add(database_models.Product(**product_data))
            db.commit()
            print("Database initialized with sample products.")

        # Fix sequence to avoid duplicate key errors
        db.execute(text("SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products))"))
        db.commit()
    except Exception as e:
        print(f"init_db warning: {e}")
        db.rollback()
    finally:
        db.close()
