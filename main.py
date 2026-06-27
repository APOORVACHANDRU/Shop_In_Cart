import os
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from openai import OpenAI
from datetime import datetime, date
from dotenv import load_dotenv
import database_models
from database import SessionLocal, engine

load_dotenv()  # Loads .env file
from models import (
    Product, SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse,
    InvoiceResponse, PurchaseOrderCreate, PurchaseOrderUpdate,
    PurchaseOrderResponse, ExpenseCreate, ExpenseResponse
)

database_models.Base.metadata.create_all(bind=engine)

# OpenAI client
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

app = FastAPI()

# CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://shop-in-cart.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# list of products with 4 products like phones, laptops, pens, tables
products = [
    Product(id=1, name="Phone", description="A smartphone", price=699.99, quantity=50),
    Product(id=2, name="Laptop", description="A powerful laptop", price=999.99, quantity=30),
    Product(id=3, name="Pen", description="A blue ink pen", price=1.99, quantity=100),
    Product(id=4, name="Table", description="A wooden table", price=199.99, quantity=20),
]

product = Product(id=5, name="Chair", description="A comfortable chair", price=89.99, quantity=15)




def init_db():
    db = SessionLocal()

    existing_count = db.query(database_models.Product).count()

    if existing_count == 0:
        for product in products:
            db.add(database_models.Product(**product.model_dump()))
        db.commit()
        print("Database initialized with sample products.")

    # Fix sequence to avoid duplicate key errors when adding new products
    from sqlalchemy import text
    db.execute(text("SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products))"))
    db.commit()
    db.close()

init_db()    

@app.get("/products/")
def get_all_products(
    cursor: Optional[int] = Query(None, description="ID of the last item from previous page"),
    limit: int = Query(5, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db)
):
    query = db.query(database_models.Product).order_by(database_models.Product.id)
    
    if cursor is not None:
        query = query.filter(database_models.Product.id > cursor)
    
    # Fetch one extra to determine if there's a next page
    items = query.limit(limit + 1).all()
    
    has_next = len(items) > limit
    products = items[:limit]
    
    next_cursor = products[-1].id if has_next and products else None
    
    return {
        "products": products,
        "next_cursor": next_cursor,
        "has_next": has_next,
    }


@app.get("/products/{product_id}")
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(database_models.Product).filter(database_models.Product.id == product_id).first()
    if product:
        return product
    return {"error": "Product not found"}

@app.post("/products/")
def create_product(product: Product, db: Session = Depends(get_db)):
    data = product.model_dump(exclude_none=True)
    db_product = database_models.Product(**data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return {"message": "Product created successfully", "product": db_product}

@app.put("/products/{product_id}")
def update_product(product_id: int, product: Product, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db_product.name = product.name
    db_product.description = product.description
    db_product.price = product.price
    db_product.quantity = product.quantity
    db.commit()
    db.refresh(db_product)
    return {"message": "Product updated successfully", "product": db_product}


@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}


# ==================== SALES ORDERS ====================

@app.post("/sales-orders/", response_model=SalesOrderResponse)
def create_sales_order(order: SalesOrderCreate, db: Session = Depends(get_db)):
    # Validate products and calculate totals
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

    # Create order
    db_order = database_models.SalesOrder(
        customer_name=order.customer_name,
        status="draft",
        total=round(total, 2),
    )
    db.add(db_order)
    db.flush()  # Get the order ID

    for oi in order_items:
        oi.order_id = db_order.id
        db.add(oi)

    db.commit()
    db.refresh(db_order)
    return db_order


@app.get("/sales-orders/", response_model=List[SalesOrderResponse])
def get_sales_orders(db: Session = Depends(get_db)):
    orders = db.query(database_models.SalesOrder).order_by(database_models.SalesOrder.id.desc()).all()
    return orders


@app.get("/sales-orders/{order_id}", response_model=SalesOrderResponse)
def get_sales_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(database_models.SalesOrder).filter(database_models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.put("/sales-orders/{order_id}/status")
def update_order_status(order_id: int, update: SalesOrderUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["draft", "confirmed", "shipped", "delivered", "cancelled"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    order = db.query(database_models.SalesOrder).filter(database_models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status

    # When confirming, deduct stock
    if update.status == "confirmed" and old_status == "draft":
        for item in order.items:
            product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
            if product:
                if product.quantity < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}")
                product.quantity -= item.quantity

    # When cancelling a confirmed order, restore stock
    if update.status == "cancelled" and old_status in ["confirmed", "shipped"]:
        for item in order.items:
            product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity

    order.status = update.status
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return {"message": f"Order status updated to {update.status}", "order": order}


@app.delete("/sales-orders/{order_id}")
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

@app.post("/sales-orders/{order_id}/invoice", response_model=InvoiceResponse)
def create_invoice(order_id: int, db: Session = Depends(get_db)):
    order = db.query(database_models.SalesOrder).filter(database_models.SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "draft":
        raise HTTPException(status_code=400, detail="Confirm the order before creating an invoice")

    # Check if invoice already exists
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


@app.get("/invoices/", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(database_models.Invoice).order_by(database_models.Invoice.id.desc()).all()


@app.put("/invoices/{invoice_id}/pay")
def mark_invoice_paid(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(database_models.Invoice).filter(database_models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = "paid"
    invoice.paid_at = datetime.utcnow()
    db.commit()
    return {"message": "Invoice marked as paid"}


# ==================== PURCHASE ORDERS ====================

@app.post("/purchase-orders/", response_model=PurchaseOrderResponse)
def create_purchase_order(order: PurchaseOrderCreate, db: Session = Depends(get_db)):
    order_items = []
    total = 0.0

    for item in order.items:
        if item.product_id == 0 and item.new_product_name:
            # New product — create it with 0 stock (will be added on receive)
            new_product = database_models.Product(
                name=item.new_product_name,
                description=item.new_product_description or "Added via purchase order",
                price=item.unit_cost,
                quantity=0,
            )
            db.add(new_product)
            db.flush()  # Get the new product ID
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


@app.get("/purchase-orders/", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(db: Session = Depends(get_db)):
    orders = db.query(database_models.PurchaseOrder).order_by(database_models.PurchaseOrder.id.desc()).all()
    return orders


@app.put("/purchase-orders/{order_id}/status")
def update_purchase_order_status(order_id: int, update: PurchaseOrderUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["draft", "confirmed", "received", "cancelled"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    order = db.query(database_models.PurchaseOrder).filter(database_models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    old_status = order.status

    # When received, add stock to products
    if update.status == "received" and old_status == "confirmed":
        for item in order.items:
            product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
            else:
                # Product doesn't exist yet — add it to inventory
                new_product = database_models.Product(
                    id=item.product_id,
                    name=item.product_name,
                    description=f"Added via Purchase Order #{order.id}",
                    price=item.unit_cost,
                    quantity=item.quantity,
                )
                db.add(new_product)

    # When cancelling a received order, deduct stock back
    if update.status == "cancelled" and old_status == "received":
        for item in order.items:
            product = db.query(database_models.Product).filter(database_models.Product.id == item.product_id).first()
            if product:
                product.quantity -= item.quantity

    order.status = update.status
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return {"message": f"Purchase order status updated to {update.status}", "order": order}


@app.delete("/purchase-orders/{order_id}")
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

@app.post("/expenses/", response_model=ExpenseResponse)
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


@app.get("/expenses/", response_model=List[ExpenseResponse])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(database_models.Expense).order_by(database_models.Expense.id.desc()).all()


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(database_models.Expense).filter(database_models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}


# AI Chatbot
class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str

@app.post("/ai/chat", response_model=ChatResponse)
def ai_chat(req: ChatRequest, db: Session = Depends(get_db)):
    # Get current inventory data
    products = db.query(database_models.Product).all()
    inventory_summary = "\n".join(
        [f"- {p.name} (ID:{p.id}): ${p.price}, {p.quantity} in stock" for p in products]
    )
    
    total_value = sum(p.price * p.quantity for p in products)
    total_items = len(products)
    total_stock = sum(p.quantity for p in products)
    
    system_prompt = f"""You are an AI inventory assistant for Aarion Inventory Management System.
You help users understand their inventory data, answer questions about products, and provide insights.

Current Inventory ({total_items} products, {total_stock} total units, ${total_value:.2f} total value):
{inventory_summary}

Rules:
- Be concise and helpful
- Answer based on the actual inventory data above
- If asked to perform actions (add/delete/update), explain that you can only provide information, not modify data
- Provide insights like low stock alerts, most expensive items, etc. when relevant
"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.question},
            ],
            max_tokens=500,
            temperature=0.7,
        )
        answer = response.choices[0].message.content or "I couldn't generate a response."
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
