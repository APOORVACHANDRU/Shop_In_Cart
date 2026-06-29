from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class SalesOrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class SalesOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float


class SalesOrderCreate(BaseModel):
    customer_name: str
    items: List[SalesOrderItemCreate]


class SalesOrderUpdate(BaseModel):
    status: str


class SalesOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    status: str
    total: float
    created_at: datetime
    updated_at: datetime
    items: List[SalesOrderItemResponse]


class SalesOrderStatusResponse(BaseModel):
    message: str
    order: SalesOrderResponse


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    customer_name: str
    total: float
    status: str
    created_at: datetime
    paid_at: Optional[datetime]


class MessageResponse(BaseModel):
    message: str
