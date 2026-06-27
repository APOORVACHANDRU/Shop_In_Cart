import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import ConfirmModal from "../components/ConfirmModal";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface SalesOrder {
  id: number;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface FormItem {
  product_id: string;
  quantity: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-50 text-blue-700",
  shipped: "bg-yellow-50 text-yellow-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-500",
};

const SalesOrders = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [formItems, setFormItems] = useState<FormItem[]>([{ product_id: "", quantity: "1" }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SalesOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 5000); return () => clearTimeout(t); } }, [message]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(""), 5000); return () => clearTimeout(t); } }, [error]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sales-orders/");
      setOrders(res.data);
    } catch { setError("Failed to fetch orders"); }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/", { params: { limit: 100 } });
      setProducts(res.data.products || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchOrders(); fetchProducts(); }, []);

  const addItem = () => setFormItems([...formItems, { product_id: "", quantity: "1" }]);
  const removeItem = (index: number) => setFormItems(formItems.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof FormItem, value: string) => {
    const updated = [...formItems];
    updated[index][field] = value;
    setFormItems(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");
    const items = formItems
      .filter((i) => i.product_id && Number(i.quantity) > 0)
      .map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) }));

    if (!customerName.trim() || items.length === 0) {
      setError("Customer name and at least one item required");
      return;
    }

    setLoading(true);
    try {
      await api.post("/sales-orders/", { customer_name: customerName, items });
      setMessage("Sales order created");
      setCustomerName("");
      setFormItems([{ product_id: "", quantity: "1" }]);
      setShowForm(false);
      fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create order");
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/sales-orders/${orderId}/status`, { status });
      setMessage(`Order #${orderId} updated to ${status}`);
      fetchOrders();
      fetchProducts(); // Stock may have changed
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update status");
    }
  };

  const createInvoice = async (orderId: number) => {
    try {
      await api.post(`/sales-orders/${orderId}/invoice`);
      setMessage(`Invoice created for order #${orderId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create invoice");
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await api.delete(`/sales-orders/${id}`);
      setMessage("Order deleted");
      fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete order");
    }
    setLoading(false);
    setDeleteTarget(null);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Create orders, track status, and convert to invoices</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-pink-brand text-white text-sm font-bold rounded-lg hover:bg-pink-hover transition"
        >
          {showForm ? "Cancel" : "+ New Order"}
        </button>
      </div>

      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">{message}</div>}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {/* Create Order Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-4">New Sales Order</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none"
            />
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-gray-500">Order Items</label>
              {formItems.map((item, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <select
                    value={item.product_id}
                    onChange={(e) => updateItem(i, "product_id", e.target.value)}
                    required
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-pink-brand"
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price} — {p.quantity} in stock)</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", e.target.value)}
                    required
                    className="w-20 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-pink-brand"
                  />
                  {formItems.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-sm text-pink-brand font-semibold hover:underline">
                + Add item
              </button>
            </div>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-pink-brand text-white text-sm font-bold rounded-lg hover:bg-pink-hover disabled:opacity-50 transition">
              Create Order
            </button>
          </form>
        </div>
      )}

      {/* Orders List */}
      {loading && !showForm ? (
        <div className="text-center text-pink-brand font-semibold py-8">Loading...</div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-sm">No sales orders yet. Create your first order.</p>
            </div>
          )}
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">Order #{order.id}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>
                    {order.status}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span>👤 {order.customer_name}</span>
                <span>📅 {formatDate(order.created_at)}</span>
                <span>📦 {order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
              </div>

              {/* Item details (collapsible) */}
              {selectedOrder?.id === order.id && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="text-left py-1">Product</th>
                        <th className="text-left py-1">Qty</th>
                        <th className="text-left py-1">Price</th>
                        <th className="text-left py-1">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-200">
                          <td className="py-2 text-gray-700">{item.product_name}</td>
                          <td className="py-2 text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-gray-600">${item.unit_price.toFixed(2)}</td>
                          <td className="py-2 font-semibold text-gray-800">${item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition"
                >
                  {selectedOrder?.id === order.id ? "Hide Details" : "View Details"}
                </button>

                {order.status === "draft" && (
                  <button onClick={() => updateStatus(order.id, "confirmed")} className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition">
                    Confirm
                  </button>
                )}
                {order.status === "confirmed" && (
                  <button onClick={() => updateStatus(order.id, "shipped")} className="px-3 py-1.5 text-xs font-semibold text-yellow-700 border border-yellow-200 rounded-md hover:bg-yellow-50 transition">
                    Mark Shipped
                  </button>
                )}
                {order.status === "shipped" && (
                  <button onClick={() => updateStatus(order.id, "delivered")} className="px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 rounded-md hover:bg-green-50 transition">
                    Mark Delivered
                  </button>
                )}
                {order.status !== "draft" && order.status !== "cancelled" && (
                  <button onClick={() => createInvoice(order.id)} className="px-3 py-1.5 text-xs font-semibold text-purple-600 border border-purple-200 rounded-md hover:bg-purple-50 transition">
                    Create Invoice
                  </button>
                )}
                {(order.status === "draft" || order.status === "cancelled") && (
                  <button onClick={() => setDeleteTarget(order)} className="px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition">
                    Delete
                  </button>
                )}
                {order.status !== "cancelled" && order.status !== "delivered" && (
                  <button onClick={() => updateStatus(order.id, "cancelled")} className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-100 rounded-md hover:bg-red-50 transition">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Order"
        message={`Are you sure you want to delete Order #${deleteTarget?.id}? This cannot be undone.`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={loading}
      />
    </div>
  );
};

export default SalesOrders;
