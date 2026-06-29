import { useEffect, useState, useMemo, useCallback, ChangeEvent, FormEvent } from "react";
import { productService, extractErrorMessage, Product, ProductListResponse } from "../services/api";
import { useNotification } from "../hooks/useNotification";
import ConfirmModal from "../components/ConfirmModal";

const PAGE_SIZE = 5;

interface ProductForm {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  quantity: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cursors, setCursors] = useState<(number | null)[]>([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [form, setForm] = useState<ProductForm>({ id: "", name: "", description: "", category: "General", price: "", quantity: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState<keyof Product>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { notification, success, error: showError } = useNotification();

  const fetchProducts = useCallback(async (cursor: number | null = null) => {
    setLoading(true);
    try {
      const data = await productService.list({ limit: PAGE_SIZE, cursor });
      setProducts(data.products);
      setHasNext(data.has_next);
    } catch (err) { showError(extractErrorMessage(err)); }
    setLoading(false);
  }, [showError]);

  useEffect(() => { fetchProducts(null); }, [fetchProducts]);

  const handleNextPage = () => {
    if (hasNext && products.length > 0) {
      const lastId = products[products.length - 1].id;
      const newCursors = [...cursors];
      newCursors[currentPage + 1] = lastId;
      setCursors(newCursors);
      setCurrentPage(currentPage + 1);
      fetchProducts(lastId);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchProducts(cursors[prevPage]);
    }
  };

  const handleSort = (field: keyof Product) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  const filteredProducts = useMemo((): Product[] => {
    if (!Array.isArray(products)) return [];
    let filtered = [...products];
    const q = filter.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((p) =>
        String(p.id).includes(q) || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      if (sortField === "id" || sortField === "price" || sortField === "quantity") { aVal = Number(aVal); bVal = Number(bVal); }
      else { aVal = String(aVal).toLowerCase(); bVal = String(bVal).toLowerCase(); }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, filter, sortField, sortDirection]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const resetForm = () => { setForm({ id: "", name: "", description: "", category: "General", price: "", quantity: "" }); setEditId(null); };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name: form.name, description: form.description, category: form.category, price: Number(form.price), quantity: Number(form.quantity) };
      if (editId) {
        await productService.update(editId, payload);
        success("Product updated successfully");
      } else {
        await productService.create(payload);
        success("Product created successfully");
      }
      resetForm(); setCursors([null]); setCurrentPage(0); fetchProducts(null);
    } catch (err: unknown) {
      showError(extractErrorMessage(err));
    }
    setLoading(false);
  };

  const handleEdit = (product: Product) => {
    setForm({ id: String(product.id), name: product.name, description: product.description, category: product.category, price: String(product.price), quantity: String(product.quantity) });
    setEditId(product.id);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await productService.delete(id);
      success("Product deleted");
      setCursors([null]); setCurrentPage(0); fetchProducts(null);
    } catch (err) { showError(extractErrorMessage(err)); }
    setLoading(false);
    setDeleteTarget(null);
  };

  const currency = (n: number) => n.toFixed(2);

  const sortIcon = (field: keyof Product) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => { setCursors([null]); setCurrentPage(0); fetchProducts(null); }}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-pink-brand border border-pink-brand rounded-lg hover:bg-pink-50 disabled:opacity-50 transition"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <span className="bg-white border border-gray-200 text-gray-800 text-sm font-semibold px-4 py-2 rounded-full">
          Total: {products.length}
        </span>
        <input
          type="text"
          placeholder="Search by id, name or description..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-80 max-w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-4">
            {editId ? "Edit Product" : "Add Product"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {editId && (
              <input type="number" name="id" placeholder="ID" value={form.id} onChange={handleChange} disabled
                className="px-3.5 py-3 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-400 outline-none" />
            )}
            <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required
              className="px-3.5 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none" />
            <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleChange} required
              className="px-3.5 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none" />
            <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3.5 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-pink-brand outline-none">
              <option value="General">General</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Furniture">Furniture</option>
              <option value="Stationery">Stationery</option>
              <option value="Health & Beauty">Health & Beauty</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>
            <input type="number" name="price" placeholder="Price" value={form.price} onChange={handleChange} required step="0.01"
              className="px-3.5 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none" />
            <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} required
              className="px-3.5 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none" />
            <div className="flex gap-3 mt-1">
              <button type="submit" disabled={loading}
                className="px-5 py-3 bg-pink-brand text-white text-sm font-bold uppercase tracking-wide rounded-lg hover:bg-pink-hover disabled:opacity-50 transition">
                {editId ? "Update" : "Add"}
              </button>
              {editId && (
                <button type="button" onClick={() => { resetForm(); }}
                  className="px-5 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
              )}
            </div>
          </form>
          {notification && notification.type === "success" && <div className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">{notification.message}</div>}
          {notification && notification.type === "error" && <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{notification.message}</div>}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-4">Product List</h2>
          {loading ? (
            <div className="text-center text-pink-brand font-semibold py-8">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th onClick={() => handleSort("id")} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-pink-brand select-none">ID{sortIcon("id")}</th>
                      <th onClick={() => handleSort("name")} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-pink-brand select-none">Name{sortIcon("name")}</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Description</th>
                      <th onClick={() => handleSort("price")} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-pink-brand select-none">Price{sortIcon("price")}</th>
                      <th onClick={() => handleSort("quantity")} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-pink-brand select-none">Qty{sortIcon("quantity")}</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3.5 text-sm text-gray-600">{p.id}</td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{p.name}</td>
                        <td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{p.category}</span></td>
                        <td className="px-4 py-3.5 text-sm text-gray-400 max-w-[200px] truncate" title={p.description}>{p.description}</td>
                        <td className="px-4 py-3.5 text-sm font-bold text-gray-900">${currency(p.price)}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center justify-center min-w-[36px] h-6 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold">
                            {p.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(p)} className="px-3 py-1.5 text-xs font-bold text-pink-brand border border-pink-brand rounded-md hover:bg-pink-50 transition">Edit</button>
                            <button onClick={() => setDeleteTarget(p)} className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-gray-400 py-10 text-sm">No products found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-gray-100">
                <button onClick={handlePrevPage} disabled={currentPage === 0 || loading}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">
                  ← Previous
                </button>
                <span className="text-sm font-semibold text-gray-500">Page {currentPage + 1}</span>
                <button onClick={handleNextPage} disabled={!hasNext || loading}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={loading}
      />
    </div>
  );
};

export default Products;
