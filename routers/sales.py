"""Sales order and invoice endpoints with order lifecycle management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

import database_models
from database import get_db
from schemas.sales import (
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse,
    SalesOrderStatusResponse, InvoiceResponse, MessageResponse
)

router = APIRouter(tags=["Sales"])


# ==================== SALES ORDERS ====================

@router.post("/sales-orders/", response_model=SalesOrderResponse)
def create_sales_order(order: SalesOrderCreate, db: Session = Depends(get_db)):
    order_items = []
    total = 0.0

    for item in order.items:
        product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}. Available: {product.quantity}")

        subtotal = product.price * item.quantity
        total += subtotal
        order_items.append(database_models.SalesOrderItem(
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price=product.price,
            subtotal=subtotal,
        ))

    db_order = database_models.SalesOrder(
        customer_name=order.customer_name,
        status="draft",
        total=round(total, 2),
    )
    db.add(db_order)
    db.flush()

    for oi in order_items:
        oi.order_id = db_order.id
        db.add(oi)

    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("/sales-orders/", response_model=List[SalesOrderResponse])
def get_sales_orders(db: Session = Depends(get_db)):
    return db.query(database_models.SalesOrder).order_by(database_models.SalesOrder.id.desc()).all()


@router.get("/sales-orders/{order_id}", response_model=SalesOrderResponse)
def get_sales_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(database_models.SalesOrder).filter(database_models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/sales-orders/{order_id}/status", response_model=SalesOrderStatusResponse)
def update_order_status(order_id: int, update: SalesOrderUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["draft", "confirmed", "shipped", "delivered", "cancelled"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    order = db.query(database_models.SalesOrder).filter(database_models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status

    if update.status == "confirmed" and old_status == "draft":
        for item in order.items:
            product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
            if product:
                if product.quantity < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}")
                product.quantity -= item.quantity

    if update.status == "cancelled" and old_status in ["confirmed", "shipped"]:
        for item in order.items:
            product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity

    order.status = update.status
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return {"message": f"Order status updated to {update.status}", "order": order}


@router.delete("/sales-orders/{order_id}", response_model=MessageResponse)
def delete_sales_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(database_models.SalesOrder).filter(database_models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in ["draft", "cancelled"]:
        raise HTTPException(status_code=400, detail="Can only delete draft or cancelled orders")
    db.delete(order)
    db.commit()
    return {"message": "Order deleted"}


# ==================== INVOICES ====================

@router.post("/sales-orders/{order_id}/invoice", response_model=InvoiceResponse)
def create_invoice(order_id: int, db: Session = Depends(get_db)):
    order = db.query(database_models.SalesOrder).filter(database_models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "draft":
        raise HTTPException(status_code=400, detail="Confirm the order before creating an invoice")

    existing = db.query(database_models.Invoice).filter(database_models.Invoice.order_id == order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Invoice already exists for this order")

    invoice = database_models.Invoice(
        order_id=order.id,
        customer_name=order.customer_name,
        total=order.total,
        status="unpaid",
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/invoices/", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(database_models.Invoice).order_by(database_models.Invoice.id.desc()).all()


@router.put("/invoices/{invoice_id}/pay", response_model=MessageResponse)
def mark_invoice_paid(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(database_models.Invoice).filter(database_models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = "paid"
    invoice.paid_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Invoice marked as paid"}
