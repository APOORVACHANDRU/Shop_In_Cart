# Aarion — Inventory & Order Management System

A full-stack inventory management application with sales/purchase order workflows, expense tracking, AI-powered insights, and a real-time dashboard. Built with **FastAPI** (Python) and **React + TypeScript**, deployed on Vercel with Neon PostgreSQL.

## Live Demo

- **Frontend:** [shop-in-cart.vercel.app](https://shop-in-cart.vercel.app)
- **API Docs (Swagger):** `/docs` endpoint on backend

## Features

### Backend
- RESTful API with cursor-based pagination
- Typed response models on every endpoint (consistent API contracts via Pydantic)
- Sales order lifecycle: Draft → Confirmed → Shipped → Delivered (with automatic stock deduction)
- Purchase orders with inventory replenishment on receipt
- Invoice generation from confirmed orders
- Expense tracking with automatic categorization
- AI chatbot powered by OpenAI (GPT-4o-mini) for inventory insights
- Pydantic v2 schemas with `ConfigDict` for request/response validation
- SQLAlchemy 2.0 ORM with `DeclarativeBase` and relationship mapping
- Comprehensive test suite (pytest) with isolated in-memory SQLite fixtures

### Frontend
- Centralized API service layer (`services/api.ts`) — single source of truth for all backend communication
- Custom hooks (`useApi`, `useFetch`, `useNotification`) for consistent async state management
- Dashboard with real-time charts (revenue, stock levels, expenses, order status)
- Product management with CRUD, sorting, filtering, and cursor-based pagination
- Sales order creation with multi-item support and status workflow
- Purchase order management with new product creation flow
- Invoice tracking and payment status
- AI chatbot widget for natural-language inventory queries
- Responsive layout with Tailwind CSS
- Full TypeScript coverage — zero `any` types in service layer

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Tailwind)                    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│  │ Dashboard │ │ Products  │ │  Orders   │ │ AI Chat   │  │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  │
│        └──────────────┼─────────────┼─────────────┘         │
│                  ┌────▼────┐   ┌────▼──────┐                │
│                  │ Hooks   │   │ Services  │                │
│                  │ useApi  │   │ api.ts    │                │
│                  └─────────┘   └───────────┘                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST (JSON)
┌──────────────────────────▼──────────────────────────────────┐
│  Backend (FastAPI + Python)                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │Products  │ │Sales     │ │Purchases │ │AI Router      │  │
│  │Router    │ │Router    │ │Router    │ │(OpenAI)       │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │Pydantic Schemas     │  │SQLAlchemy ORM Models        │  │
│  │(response_model on   │  │(DeclarativeBase)            │  │
│  │ every endpoint)     │  │                             │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQLAlchemy ORM
┌──────────────────────────▼──────────────────────────────────┐
│  PostgreSQL (Neon Cloud)                                     │
│  Tables: products, sales_orders, sales_order_items,          │
│          purchase_orders, purchase_order_items,               │
│          invoices, expenses                                   │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer        | Technology                              |
|--------------|----------------------------------------|
| Frontend     | React 18, TypeScript, Tailwind CSS      |
| Charts       | Recharts                               |
| HTTP Client  | Axios (centralized service layer)       |
| Routing      | React Router v7                        |
| Backend      | FastAPI, Python 3.12, Uvicorn          |
| Database     | PostgreSQL (Neon serverless)            |
| ORM          | SQLAlchemy 2.0                         |
| Validation   | Pydantic v2                            |
| AI           | OpenAI GPT-4o-mini                     |
| Testing      | Pytest (backend), TypeScript strict mode|
| Deployment   | Vercel (frontend + backend)            |

## Project Structure

```
fastapi-demo/
├── main.py                  # FastAPI app entry point, middleware, router registration
├── config.py                # Environment variables and app configuration
├── database.py              # SQLAlchemy engine, session factory, dependency
├── database_models.py       # ORM models (Product, SalesOrder, Invoice, etc.)
├── seed.py                  # Database seeding with sample data
├── requirements.txt         # Python dependencies (pinned versions)
├── vercel.json              # Vercel deployment config
├── .env.example             # Environment variable template
│
├── routers/
│   ├── products.py          # Product CRUD with cursor-based pagination
│   ├── sales.py             # Sales orders, status workflow, invoices
│   ├── purchases.py         # Purchase orders, expenses
│   └── ai.py               # AI chatbot endpoint (OpenAI integration)
│
├── schemas/
│   ├── products.py          # Product request/response schemas (ProductCreate, ProductResponse, etc.)
│   ├── sales.py             # Sales order & invoice schemas
│   └── purchases.py         # Purchase order & expense schemas
│
├── tests/
│   ├── conftest.py          # Pytest fixtures (in-memory SQLite, test client)
│   ├── test_products.py     # Product CRUD + pagination tests
│   └── test_sales.py        # Sales order workflow + business logic tests
│
└── frontend/
    ├── src/
    │   ├── App.tsx              # Root component with routing
    │   ├── services/
    │   │   └── api.ts           # Centralized API client, typed service functions, error handling
    │   ├── hooks/
    │   │   ├── useApi.ts        # Custom hook for async API calls (mutations + fetching)
    │   │   └── useNotification.ts # Toast/notification state with auto-dismiss
    │   ├── components/
    │   │   ├── Sidebar.tsx      # Navigation with collapsible menus
    │   │   ├── Chatbot.tsx      # AI chat widget
    │   │   └── ConfirmModal.tsx # Reusable confirmation dialog
    │   └── pages/
    │       ├── Dashboard.tsx    # Analytics charts & KPIs
    │       ├── Products.tsx     # Product management table
    │       ├── SalesOrders.tsx  # Order lifecycle management
    │       ├── Invoices.tsx     # Invoice & payment tracking
    │       ├── PurchaseOrders.tsx
    │       └── Expenses.tsx
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

## API Endpoints

All endpoints have explicit `response_model` declarations for consistent, documented response shapes.

### Products
| Method | Endpoint           | Response Model       | Description                        |
|--------|--------------------|----------------------|------------------------------------|
| GET    | `/products/`       | `ProductListResponse`| List products (cursor pagination)  |
| GET    | `/products/{id}`   | `ProductResponse`    | Get single product                 |
| POST   | `/products/`       | `ProductMessageResponse` | Create product               |
| PUT    | `/products/{id}`   | `ProductMessageResponse` | Update product               |
| DELETE | `/products/{id}`   | `DeleteResponse`     | Delete product                     |

### Sales Orders
| Method | Endpoint                          | Response Model              | Description                    |
|--------|-----------------------------------|-----------------------------|--------------------------------|
| POST   | `/sales-orders/`                  | `SalesOrderResponse`        | Create order with line items   |
| GET    | `/sales-orders/`                  | `List[SalesOrderResponse]`  | List all orders                |
| GET    | `/sales-orders/{id}`              | `SalesOrderResponse`        | Get order with items           |
| PUT    | `/sales-orders/{id}/status`       | `SalesOrderStatusResponse`  | Update status (state machine)  |
| DELETE | `/sales-orders/{id}`              | `MessageResponse`           | Delete draft/cancelled orders  |
| POST   | `/sales-orders/{id}/invoice`      | `InvoiceResponse`           | Generate invoice from order    |

### Invoices
| Method | Endpoint                   | Response Model       | Description           |
|--------|----------------------------|----------------------|-----------------------|
| GET    | `/invoices/`               | `List[InvoiceResponse]` | List all invoices  |
| PUT    | `/invoices/{id}/pay`       | `MessageResponse`    | Mark invoice as paid  |

### Purchase Orders
| Method | Endpoint                           | Response Model                  | Description                     |
|--------|------------------------------------|---------------------------------|---------------------------------|
| POST   | `/purchase-orders/`                | `PurchaseOrderResponse`         | Create with items               |
| GET    | `/purchase-orders/`                | `List[PurchaseOrderResponse]`   | List all                        |
| PUT    | `/purchase-orders/{id}/status`     | `PurchaseOrderStatusResponse`   | Update status (auto-restocks)   |
| DELETE | `/purchase-orders/{id}`            | `MessageResponse`               | Delete draft/cancelled          |

### Expenses
| Method | Endpoint            | Response Model       | Description        |
|--------|---------------------|----------------------|--------------------|
| POST   | `/expenses/`        | `ExpenseResponse`    | Record expense     |
| GET    | `/expenses/`        | `List[ExpenseResponse]` | List all expenses |
| DELETE | `/expenses/{id}`    | `MessageResponse`    | Delete expense     |

### AI
| Method | Endpoint    | Response Model  | Description                          |
|--------|-------------|-----------------|--------------------------------------|
| POST   | `/ai/chat`  | `ChatResponse`  | Natural-language inventory assistant |

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (local or [Neon](https://neon.tech) cloud)

### Backend

```bash
cd fastapi-demo
python -m venv myenv
myenv\Scripts\activate      # Windows
# source myenv/bin/activate  # macOS/Linux

pip install -r requirements.txt
cp .env.example .env        # Fill in your values
uvicorn main:app --reload
```

API: http://localhost:8000 | Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # Set REACT_APP_API_URL
npm start
```

App: http://localhost:3000

### Running Tests

```bash
pip install pytest httpx
pytest tests/ -v
```

All 21 tests pass with an isolated in-memory SQLite database (no external DB needed).

## Design Decisions

- **Cursor-based pagination** over offset-based: more performant for large datasets, avoids skipped/duplicate items on concurrent writes.
- **Order state machine** with inventory side effects: confirming an order deducts stock, cancelling restores it — keeps inventory consistent without external job queues.
- **Separated schemas from ORM models**: Pydantic handles API contracts (request validation + response serialization) while SQLAlchemy handles persistence, keeping concerns clean.
- **`response_model` on every endpoint**: Guarantees consistent API response shapes, auto-generates accurate OpenAPI docs, and prevents accidental data leaks.
- **Centralized frontend API layer** (`services/api.ts`): Single source of truth for base URL, error extraction, and typed service functions. Components never import axios directly.
- **Custom hooks** (`useApi`, `useFetch`, `useNotification`): Eliminates duplicated loading/error/success state management across pages. Consistent UX patterns with auto-dismissing notifications.
- **AI context injection**: The chatbot receives live inventory data in its system prompt, enabling accurate answers without fine-tuning or RAG infrastructure.
- **In-memory test database**: Tests run in ~0.5s with zero external dependencies — fast CI feedback loop.

## Environment Variables

See `.env.example` for the full list of required configuration.

## License

MIT
