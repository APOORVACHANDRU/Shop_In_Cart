
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Product(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    price: float
    quantity: int


# Sales Order Schemas
class SalesOrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class SalesOrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True

class SalesOrderCreate(BaseModel):
    customer_name: str
    items: List[SalesOrderItemCreate]

class SalesOrderUpdate(BaseModel):
    status: str

class SalesOrderResponse(BaseModel):
    id: int
    customer_name: str
    status: str
    total: float
    created_at: datetime
    updated_at: datetime
    items: List[SalesOrderItemResponse]

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: int
    order_id: int
    customer_name: str
    total: float
    status: str
    created_at: datetime
    paid_at: Optional[datetime]

    class Config:
        from_attributes = True


# Purchase Order Schemas
class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_cost: float
    new_product_name: Optional[str] = None
    new_product_description: Optional[str] = None

class PurchaseOrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_cost: float
    subtotal: float

    class Config:
        from_attributes = True

class PurchaseOrderCreate(BaseModel):
    vendor_name: str
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    status: str

class PurchaseOrderResponse(BaseModel):
    id: int
    vendor_name: str
    status: str
    total: float
    created_at: datetime
    updated_at: datetime
    items: List[PurchaseOrderItemResponse]

    class Config:
        from_attributes = True


# Expense Schemas
class ExpenseCreate(BaseModel):
    description: str
    category: str
    amount: float
    vendor_name: Optional[str] = None
    date: Optional[str] = None  # ISO format date string

class ExpenseResponse(BaseModel):
    id: int
    description: str
    category: str
    amount: float
    vendor_name: Optional[str]
    date: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
