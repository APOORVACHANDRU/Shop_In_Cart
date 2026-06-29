import { useEffect, useState, FormEvent } from "react";
import { purchaseService, productService, extractErrorMessage, PurchaseOrder, Product } from "../services/api";
import { useNotification } from "../hooks/useNotification";
import ConfirmModal from "../components/ConfirmModal";

interface FormItem {
  product_id: string;
  quantity: string;
  unit_cost: string;
  is_new: boolean;
  new_name: string;
  new_description: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-50 text-blue-700",
  received: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-500",
};

const PurchaseOrders = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [formItems, setFormItems] = useState<FormItem[]>([{ product_id: "", quantity: "1", unit_cost: "", is_new: false, new_name: "", new_description: "" }]);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const { notification, success, error: showError } = useNotification();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await purchaseService.list();
      setOrders(data);
    } catch (err) { showError(extractErrorMessage(err)); }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const data = await productService.list({ limit: 100 });
      setProducts(data.products || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchOrders(); fetchProducts(); }, []);

  const addItem = () => setFormItems([...formItems, { product_id: "", quantity: "1", unit_cost: "", is_new: false, new_name: "", new_description: "" }]);
  const removeItem = (index: number) => setFormItems(formItems.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof FormItem, value: string | boolean) => {
    const updated = [...formItems];
    (updated[index] as any)[field] = value;
    if (field === "product_id" && value === "__new__") {
      updated[index].is_new = true;
      updated[index].product_id = "";
      updated[index].unit_cost = "";
    } else if (field === "product_id" && value && value !== "__new__") {
      updated[index].is_new = false;
      updated[index].new_name = "";
      updated[index].new_description = "";
      const product = products.find((p) => p.id === Number(value));
      if (product && !updated[index].unit_cost) {
        updated[index].unit_cost = product.price.toString();
      }
    }
    setFormItems(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const items = formItems
      .filter((i) => (i.product_id || i.is_new) && Number(i.quantity) > 0 && Number(i.unit_cost) > 0)
      .map((i) => {
        if (i.is_new) {
          return { product_id: 0, quantity: Number(i.quantity), unit_cost: Number(i.unit_cost), new_product_name: i.new_name, new_product_description: i.new_description || "Added via purchase order" };
        }
        return { product_id: Number(i.product_id), quantity: Number(i.quantity), unit_cost: Number(i.unit_cost) };
      });

    if (!vendorName.trim() || items.length === 0) {
      showError("Vendor name and at least one item with quantity and unit cost required");
      return;
    }

    for (const i of formItems.filter(fi => fi.is_new)) {
      if (!i.new_name.trim()) {
        showError("New items must have a product name");
        return;
      }
    }

    setLoading(true);
    try {
      await purchaseService.create({ vendor_name: vendorName, items });
      success("Purchase order created");
      setVendorName("");
      setFormItems([{ product_id: "", quantity: "1", unit_cost: "", is_new: false, new_name: "", new_description: "" }]);
      setShowForm(false);
      fetchOrders();
      fetchProducts();
    } catch (err) {
      showError(extractErrorMessage(err));
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await purchaseService.updateStatus(orderId, status);
      success(`Purchase Order #${orderId} updated to ${status}`);
      fetchOrders();
      fetchProducts();
    } catch (err) {
      showError(extractErrorMessage(err));
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await purchaseService.delete(id);
      success("Purchase order deleted");
      fetchOrders();
    } catch (err) {
      showError(extractErrorMessage(err));
    }
    setLoading(false);
    setDeleteTarget(null);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage vendor purchase orders</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-pink-brand text-white text-sm font-bold rounded-lg hover:bg-pink-hover transition"
        >
          {showForm ? "Cancel" : "+ New Purchase Order"}
        </button>
      </div>

      {notification && notification.type === "success" && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">{notification.message}</div>}
      {notification && notification.type === "error" && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{notification.message}</div>}

      {/* Create Purchase Order Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-4">New Purchase Order</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Vendor Name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none"
            />
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-gray-500">Order Items</label>
              {formItems.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex gap-3 items-center">
                    {!item.is_new ? (
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(i, "product_id", e.target.value)}
                        required={!item.is_new}
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-pink-brand"
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} [{p.category}] ({p.quantity} in stock)</option>
                        ))}
                        <option value="__new__">➕ Add New Item</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="New product name"
                          value={item.new_name}
                          onChange={(e) => updateItem(i, "new_name", e.target.value)}
                          required
                          className="flex-1 px-3 py-2.5 border border-green-300 rounded-lg text-sm outline-none focus:border-pink-brand bg-green-50"
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.new_description}
                          onChange={(e) => updateItem(i, "new_description", e.target.value)}
                          className="flex-1 px-3 py-2.5 border border-green-300 rounded-lg text-sm outline-none focus:border-pink-brand bg-green-50"
                        />
                        <button type="button" onClick={() => { updateItem(i, "is_new", false as any); updateItem(i, "product_id", ""); }} className="text-xs text-gray-500 hover:text-gray-800 whitespace-nowrap">
                          ← Existing
                        </button>
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", e.target.value)}
                      required
                      className="w-20 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-pink-brand"
                    />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={item.unit_cost}
                      onChange={(e) => updateItem(i, "unit_cost", e.target.value)}
                      required
                      className="w-28 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-pink-brand"
                    />
                    {formItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-sm text-pink-brand font-semibold hover:underline">
                + Add item
              </button>
            </div>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-pink-brand text-white text-sm font-bold rounded-lg hover:bg-pink-hover disabled:opacity-50 transition">
              Create Purchase Order
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
              <p className="text-gray-400 text-sm">No purchase orders yet. Create your first order.</p>
            </div>
          )}
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">PO #{order.id}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>
                    {order.status}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span>🏢 {order.vendor_name}</span>
                <span>📅 {formatDate(order.created_at)}</span>
                <span>📦 {order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
              </div>

              {selectedOrder?.id === order.id && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="text-left py-1">Product</th>
                        <th className="text-left py-1">Qty</th>
                        <th className="text-left py-1">Unit Cost</th>
                        <th className="text-left py-1">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-200">
                          <td className="py-2 text-gray-700">{item.product_name}</td>
                          <td className="py-2 text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-gray-600">${item.unit_cost.toFixed(2)}</td>
                          <td className="py-2 font-semibold text-gray-800">${item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

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
                  <button onClick={() => updateStatus(order.id, "received")} className="px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 rounded-md hover:bg-green-50 transition">
                    Mark Received
                  </button>
                )}
                {(order.status === "draft" || order.status === "cancelled") && (
                  <button onClick={() => setDeleteTarget(order)} className="px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition">
                    Delete
                  </button>
                )}
                {order.status !== "cancelled" && order.status !== "received" && (
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
        title="Delete Purchase Order"
        message={`Are you sure you want to delete PO #${deleteTarget?.id}? This cannot be undone.`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={loading}
      />
    </div>
  );
};

export default PurchaseOrders;
