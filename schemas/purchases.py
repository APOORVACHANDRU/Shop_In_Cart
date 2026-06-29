from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, date as date_type


class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_cost: float
    new_product_name: Optional[str] = None
    new_product_description: Optional[str] = None


class PurchaseOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_cost: float
    subtotal: float


class PurchaseOrderCreate(BaseModel):
    vendor_name: str
    items: List[PurchaseOrderItemCreate]


class PurchaseOrderUpdate(BaseModel):
    status: str


class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_name: str
    status: str
    total: float
    created_at: datetime
    updated_at: datetime
    items: List[PurchaseOrderItemResponse]


class ExpenseCreate(BaseModel):
    description: str
    category: str
    amount: float
    vendor_name: Optional[str] = None
    date: Optional[str] = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    category: str
    amount: float
    vendor_name: Optional[str]
    date: Optional[date_type] = None
    created_at: datetime


class PurchaseOrderStatusResponse(BaseModel):
    message: str
    order: PurchaseOrderResponse


class MessageResponse(BaseModel):
    message: str
