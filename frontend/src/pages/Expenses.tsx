import { useEffect, useState, FormEvent } from "react";
import { expenseService, extractErrorMessage, Expense } from "../services/api";
import { useNotification } from "../hooks/useNotification";
import ConfirmModal from "../components/ConfirmModal";

const CATEGORIES = ["Supplies", "Shipping", "Marketing", "Utilities", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  Supplies: "bg-blue-50 text-blue-700",
  Shipping: "bg-yellow-50 text-yellow-700",
  Marketing: "bg-purple-50 text-purple-700",
  Utilities: "bg-green-50 text-green-700",
  Other: "bg-gray-100 text-gray-700",
};

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Supplies");
  const [amount, setAmount] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const { notification, success, error: showError } = useNotification();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await expenseService.list();
      setExpenses(data);
    } catch (err) { showError(extractErrorMessage(err)); }
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount || Number(amount) <= 0) {
      showError("Description and a valid amount are required");
      return;
    }

    setLoading(true);
    try {
      await expenseService.create({
        description,
        category,
        amount: Number(amount),
        vendor_name: vendorName || undefined,
        date: date || undefined,
      });
      success("Expense recorded");
      setDescription("");
      setCategory("Supplies");
      setAmount("");
      setVendorName("");
      setDate(new Date().toISOString().split("T")[0]);
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      showError(extractErrorMessage(err));
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await expenseService.delete(id);
      success("Expense deleted");
      fetchExpenses();
    } catch (err) {
      showError(extractErrorMessage(err));
    }
    setLoading(false);
    setDeleteTarget(null);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Summary calculations
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const now = new Date();
  const thisMonthExpenses = expenses
    .filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date + "T00:00:00");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Track and categorize business expenses</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-pink-brand text-white text-sm font-bold rounded-lg hover:bg-pink-hover transition"
        >
          {showForm ? "Cancel" : "+ Add Expense"}
        </button>
      </div>

      {notification && notification.type === "success" && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">{notification.message}</div>}
      {notification && notification.type === "error" && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{notification.message}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{expenses.length} record{expenses.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500 mb-1">This Month</p>
          <p className="text-2xl font-bold text-gray-900">${thisMonthExpenses.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500 mb-1">Top Category</p>
          <p className="text-2xl font-bold text-gray-900">{topCategory ? topCategory[0] : "—"}</p>
          <p className="text-xs text-gray-400 mt-1">{topCategory ? `$${topCategory[1].toFixed(2)}` : "No data"}</p>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-4">New Expense</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-pink-brand outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none"
              />
              <input
                type="text"
                placeholder="Vendor Name (optional)"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-pink-brand focus:ring-2 focus:ring-pink-brand/10 outline-none"
              />
            </div>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-pink-brand text-white text-sm font-bold rounded-lg hover:bg-pink-hover disabled:opacity-50 transition">
              Add Expense
            </button>
          </form>
        </div>
      )}

      {/* Expenses Table */}
      {loading && !showForm ? (
        <div className="text-center text-pink-brand font-semibold py-8">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">No expenses recorded yet. Add your first expense.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Vendor</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-bold uppercase text-gray-500">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-bold uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-gray-800 font-medium">{expense.description}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[expense.category] || "bg-gray-100 text-gray-700"}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{expense.vendor_name || "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(expense.date)}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">${expense.amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(expense)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Expense"
        message={`Are you sure you want to delete "${deleteTarget?.description}"? This cannot be undone.`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={loading}
      />
    </div>
  );
};

export default Expenses;
