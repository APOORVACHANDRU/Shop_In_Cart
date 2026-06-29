"""Product CRUD endpoints with cursor-based pagination."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

import database_models
from database import get_db
from schemas.products import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductMessageResponse,
    DeleteResponse,
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=ProductListResponse, summary="List products with cursor-based pagination")
def get_all_products(
    cursor: Optional[int] = Query(None, description="ID of the last item from previous page"),
    limit: int = Query(5, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
):
    query = db.query(database_models.Product).order_by(database_models.Product.id)

    if cursor is not None:
        query = query.filter(database_models.Product.id > cursor)

    items = query.limit(limit + 1).all()
    has_next = len(items) > limit
    products = items[:limit]
    next_cursor = products[-1].id if has_next and products else None

    return {
        "products": products,
        "next_cursor": next_cursor,
        "has_next": has_next,
    }


@router.get("/{product_id}", response_model=ProductResponse, summary="Get a single product by ID")
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(database_models.Product).filter(database_models.Product.id == product_id).first()
    if product:
        return product
    raise HTTPException(status_code=404, detail="Product not found")


@router.post("/", response_model=ProductMessageResponse, summary="Create a new product")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    data = product.model_dump(exclude_none=True)
    db_product = database_models.Product(**data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return {"message": "Product created successfully", "product": db_product}


@router.put("/{product_id}", response_model=ProductMessageResponse, summary="Update an existing product")
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db_product.name = product.name
    db_product.description = product.description
    db_product.category = product.category
    db_product.price = product.price
    db_product.quantity = product.quantity
    db.commit()
    db.refresh(db_product)
    return {"message": "Product updated successfully", "product": db_product}


@router.delete("/{product_id}", response_model=DeleteResponse, summary="Delete a product")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}
