from pydantic import BaseModel, ConfigDict
from typing import Optional, List


# --- Request schemas ---

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str = "General"
    price: float
    quantity: int


class ProductUpdate(BaseModel):
    name: str
    description: str
    category: str = "General"
    price: float
    quantity: int


# --- Response schemas ---

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    category: str
    price: float
    quantity: int


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    next_cursor: Optional[int]
    has_next: bool


class ProductMessageResponse(BaseModel):
    message: str
    product: ProductResponse


class DeleteResponse(BaseModel):
    message: str


# Backward compat alias (used in seed, etc.)
Product = ProductCreate
