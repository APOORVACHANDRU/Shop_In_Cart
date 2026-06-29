/**
 * Centralized API client and service functions.
 * All backend communication goes through this module.
 */

import axios, { AxiosError } from "axios";

// Configured axios instance — single source of truth for base URL
export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// --- Error handling ---

export interface ApiError {
  message: string;
  status?: number;
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ detail?: string }>;
    return axiosErr.response?.data?.detail || axiosErr.message || "Request failed";
  }
  return "An unexpected error occurred";
}

// --- Product types & services ---

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
}

export interface ProductListResponse {
  products: Product[];
  next_cursor: number | null;
  has_next: boolean;
}

export interface ProductPayload {
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
}

export const productService = {
  list: (params: { limit?: number; cursor?: number | null }) =>
    apiClient.get<ProductListResponse>("/products/", { params }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Product>(`/products/${id}`).then((r) => r.data),

  create: (data: ProductPayload) =>
    apiClient.post<{ message: string; product: Product }>("/products/", data).then((r) => r.data),

  update: (id: number, data: ProductPayload) =>
    apiClient.put<{ message: string; product: Product }>(`/products/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/products/${id}`).then((r) => r.data),
};

// --- Sales Order types & services ---

export interface SalesOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SalesOrder {
  id: number;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: SalesOrderItem[];
}

export interface SalesOrderPayload {
  customer_name: string;
  items: { product_id: number; quantity: number }[];
}

export const salesService = {
  list: () =>
    apiClient.get<SalesOrder[]>("/sales-orders/").then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<SalesOrder>(`/sales-orders/${id}`).then((r) => r.data),

  create: (data: SalesOrderPayload) =>
    apiClient.post<SalesOrder>("/sales-orders/", data).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    apiClient.put<{ message: string; order: SalesOrder }>(`/sales-orders/${id}/status`, { status }).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/sales-orders/${id}`).then((r) => r.data),

  createInvoice: (orderId: number) =>
    apiClient.post<Invoice>(`/sales-orders/${orderId}/invoice`).then((r) => r.data),
};

// --- Invoice types & services ---

export interface Invoice {
  id: number;
  order_id: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export const invoiceService = {
  list: () =>
    apiClient.get<Invoice[]>("/invoices/").then((r) => r.data),

  markPaid: (id: number) =>
    apiClient.put<{ message: string }>(`/invoices/${id}/pay`).then((r) => r.data),
};

// --- Purchase Order types & services ---

export interface PurchaseOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: number;
  vendor_name: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderPayload {
  vendor_name: string;
  items: {
    product_id: number;
    quantity: number;
    unit_cost: number;
    new_product_name?: string;
    new_product_description?: string;
  }[];
}

export const purchaseService = {
  list: () =>
    apiClient.get<PurchaseOrder[]>("/purchase-orders/").then((r) => r.data),

  create: (data: PurchaseOrderPayload) =>
    apiClient.post<PurchaseOrder>("/purchase-orders/", data).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    apiClient.put<{ message: string; order: PurchaseOrder }>(`/purchase-orders/${id}/status`, { status }).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/purchase-orders/${id}`).then((r) => r.data),
};

// --- Expense types & services ---

export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  vendor_name: string | null;
  date: string | null;
  created_at: string;
}

export interface ExpensePayload {
  description: string;
  category: string;
  amount: number;
  vendor_name?: string;
  date?: string;
}

export const expenseService = {
  list: () =>
    apiClient.get<Expense[]>("/expenses/").then((r) => r.data),

  create: (data: ExpensePayload) =>
    apiClient.post<Expense>("/expenses/", data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/expenses/${id}`).then((r) => r.data),
};

// --- AI Chat ---

export interface ChatResponse {
  answer: string;
}

export const aiService = {
  chat: (question: string) =>
    apiClient.post<ChatResponse>("/ai/chat", { question }).then((r) => r.data),
};
