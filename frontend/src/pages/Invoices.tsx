import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

interface Invoice {
  id: number;
  order_id: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  overdue: "bg-red-50 text-red-600 border-red-200",
};

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 5000); return () => clearTimeout(t); } }, [message]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(""), 5000); return () => clearTimeout(t); } }, [error]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/invoices/");
      setInvoices(res.data);
    } catch { setError("Failed to fetch invoices"); }
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const markPaid = async (invoiceId: number) => {
    try {
      await api.put(`/invoices/${invoiceId}/pay`);
      setMessage(`Invoice #${invoiceId} marked as paid`);
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update invoice");
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const totalUnpaid = invoices.filter(i => i.status === "unpaid").reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices & Payments</h1>
        <p className="text-sm text-gray-500 mt-1">Track invoices and payment status</p>
      </div>

      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">{message}</div>}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <span className="text-xs font-bold uppercase text-gray-500">Total Invoices</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <span className="text-xs font-bold uppercase text-gray-500">Unpaid</span>
          <p className="text-2xl font-bold text-yellow-600 mt-1">${totalUnpaid.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <span className="text-xs font-bold uppercase text-gray-500">Paid</span>
          <p className="text-2xl font-bold text-green-600 mt-1">${totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-pink-brand font-semibold py-8">Loading...</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <span className="text-4xl block mb-3">🧾</span>
          <p className="text-gray-400 text-sm">No invoices yet. Create invoices from confirmed sales orders.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Invoice</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Order</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">INV-{String(inv.id).padStart(4, "0")}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{inv.customer_name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">#{inv.order_id}</td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-900">${inv.total.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[inv.status] || ""}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{formatDate(inv.created_at)}</td>
                  <td className="px-5 py-4">
                    {inv.status === "unpaid" && (
                      <button
                        onClick={() => markPaid(inv.id)}
                        className="px-3 py-1.5 text-xs font-bold text-green-700 border border-green-200 rounded-md hover:bg-green-50 transition"
                      >
                        Mark Paid
                      </button>
                    )}
                    {inv.status === "paid" && inv.paid_at && (
                      <span className="text-xs text-gray-400">Paid {formatDate(inv.paid_at)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Invoices;
