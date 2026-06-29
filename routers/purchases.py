"""Purchase order and expense endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date, timezone

import database_models
from database import get_db
from schemas.purchases import (
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse,
    PurchaseOrderStatusResponse, ExpenseCreate, ExpenseResponse, MessageResponse
)

router = APIRouter(tags=["Purchases"])


# ==================== PURCHASE ORDERS ====================

@router.post("/purchase-orders/", response_model=PurchaseOrderResponse)
def create_purchase_order(order: PurchaseOrderCreate, db: Session = Depends(get_db)):
    order_items = []
    total = 0.0

    for item in order.items:
        if item.product_id == 0 and item.new_product_name:
            new_product = database_models.Product(
                name=item.new_product_name,
                description=item.new_product_description or "Added via purchase order",
                price=item.unit_cost,
                quantity=0,
            )
            db.add(new_product)
            db.flush()
            product = new_product
        else:
            product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        subtotal = item.unit_cost * item.quantity
        total += subtotal
        order_items.append(database_models.PurchaseOrderItem(
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            subtotal=subtotal,
        ))

    db_order = database_models.PurchaseOrder(
        vendor_name=order.vendor_name,
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


@router.get("/purchase-orders/", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(db: Session = Depends(get_db)):
    return db.query(database_models.PurchaseOrder).order_by(database_models.PurchaseOrder.id.desc()).all()


@router.put("/purchase-orders/{order_id}/status", response_model=PurchaseOrderStatusResponse)
def update_purchase_order_status(order_id: int, update: PurchaseOrderUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["draft", "confirmed", "received", "cancelled"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    order = db.query(database_models.PurchaseOrder).filter(database_models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    old_status = order.status

    if update.status == "received" and old_status == "confirmed":
        for item in order.items:
            product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
            else:
                new_product = database_models.Product(
                    id=item.product_id,
                    name=item.product_name,
                    description=f"Added via Purchase Order #{order.id}",
                    price=item.unit_cost,
                    quantity=item.quantity,
                )
                db.add(new_product)

        # Record as expense
        expense = database_models.Expense(
            description=f"Purchase Order #{order.id} - {order.vendor_name}",
            category="Supplies",
            amount=order.total,
            vendor_name=order.vendor_name,
            date=date.today(),
        )
        db.add(expense)

    if update.status == "cancelled" and old_status == "received":
        for item in order.items:
            product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
            if product:
                product.quantity -= item.quantity

    order.status = update.status
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return {"message": f"Purchase order status updated to {update.status}", "order": order}


@router.delete("/purchase-orders/{order_id}", response_model=MessageResponse)
def delete_purchase_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(database_models.PurchaseOrder).filter(database_models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if order.status not in ["draft", "cancelled"]:
        raise HTTPException(status_code=400, detail="Can only delete draft or cancelled purchase orders")
    db.delete(order)
    db.commit()
    return {"message": "Purchase order deleted"}


# ==================== EXPENSES ====================

@router.post("/expenses/", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    expense_date = date.fromisoformat(expense.date) if expense.date else date.today()
    db_expense = database_models.Expense(
        description=expense.description,
        category=expense.category,
        amount=expense.amount,
        vendor_name=expense.vendor_name,
        date=expense_date,
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@router.get("/expenses/", response_model=List[ExpenseResponse])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(database_models.Expense).order_by(database_models.Expense.id.desc()).all()


@router.delete("/expenses/{expense_id}", response_model=MessageResponse)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(database_models.Expense).filter(database_models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}
