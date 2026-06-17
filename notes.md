# FastAPI Learning Notes

## 1. Setting Up FastAPI

- Install FastAPI: `pip install fastapi`
- Install Uvicorn (ASGI server): `pip install uvicorn`
- Run the server: `uvicorn main:app --reload`
  - `main` = filename (main.py)
  - `app` = the FastAPI instance
  - `--reload` = auto-restart on code changes

## 2. Creating the App Instance

```python
from fastapi import FastAPI

app = FastAPI()
```

## 3. Pydantic Models (Data Validation)

- Used to define the structure/schema of data
- Provides automatic validation and type checking
- Must use **keyword arguments** (not positional)

```python
from pydantic import BaseModel

class Product(BaseModel):
    id: int
    name: str
    description: str
    price: float
    quantity: int
```

**Important:** Pydantic BaseModel does NOT accept positional arguments.
```python
# WRONG - will throw TypeError
Product(1, "Phone", "A smartphone", 699.99, 50)

# CORRECT - use keyword arguments
Product(id=1, name="Phone", description="A smartphone", price=699.99, quantity=50)
```

## 4. HTTP Methods / API Endpoints

### GET - Retrieve data

```python
# Root endpoint
@app.get("/")
def greet():
    return "welcome"

# Get all products
@app.get("/products")
def get_all_products():
    return products

# Get single product by ID (path parameter)
@app.get("/product/{id}")
def get_product_by_id(id: int):
    for product in products:
        if product.id == id:
            return product
    return "product not found"
```

### POST - Create new data

```python
@app.post("/product")
def add_product(product: Product):
    products.append(product)
    return product
```

- The request body is automatically parsed and validated using the Pydantic model
- FastAPI reads the JSON body and converts it into a `Product` object

### PUT - Update existing data

```python
@app.put("/product/{id}")
def update_product_by_id(id: int, updated_product: Product):
    for i, product in enumerate(products):
        if product.id == id:
            products[i] = updated_product
            return updated_product
    return "product not found"
```

### DELETE - Remove data

```python
@app.delete("/product/{id}")
def delete_product_by_id(id: int):
    for i, product in enumerate(products):
        if product.id == id:
            products.pop(i)
            return "product deleted"
    return "product not found"
```

## 5. Path Parameters

- Defined in the URL path with `{parameter_name}`
- Type hints provide automatic validation (e.g., `id: int`)

```python
@app.get("/product/{id}")
def get_product_by_id(id: int):
    ...
```

## 6. Request Body

- When a Pydantic model is used as a function parameter (not in path), FastAPI reads it from the request body
- Client sends JSON, FastAPI validates and converts it

## 7. Testing the API

- FastAPI auto-generates interactive docs at: `http://localhost:8000/docs` (Swagger UI)
- Alternative docs at: `http://localhost:8000/redoc`
- Use these to test all endpoints without a separate tool

## 8. Product Data Structure

| id | name   | description      | price  | quantity |
|----|--------|------------------|--------|----------|
| 1  | Phone  | A smartphone     | 699.99 | 50       |
| 2  | Laptop | A useful laptop  | 999.99 | 30       |
| 3  | Pen    | A blue ink pen   | 1.99   | 100      |
| 4  | Table  | A brown table    | 199.99 | 20       |

## Key Takeaways

- FastAPI uses decorators (`@app.get`, `@app.post`, etc.) to define routes
- Pydantic handles data validation automatically
- Path parameters go in the URL, request body is parsed from JSON
- Type hints are essential — they drive validation and documentation
- The `/docs` endpoint is your best friend for testing
