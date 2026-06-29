import { useEffect, useState } from "react";
import {
  productService, salesService, invoiceService, expenseService,
  Product, SalesOrder, Invoice, Expense,
} from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#ff3f6c", "#ff905a", "#7c3aed", "#3b82f6", "#16a34a", "#eab308"];

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, salesRes, invRes, expRes] = await Promise.all([
          productService.list({ limit: 100 }),
          salesService.list(),
          invoiceService.list(),
          expenseService.list(),
        ]);
        setProducts(prodRes.products || []);
        setSalesOrders(salesRes || []);
        setInvoices(invRes || []);
        setExpenses(expRes || []);
      } catch {
        // partial load is fine
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  // Product stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const lowStockItems = products.filter((p) => p.quantity < 25);

  // Sales stats
  const totalSalesRevenue = salesOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const confirmedOrders = salesOrders.filter((o) => ["confirmed", "shipped", "delivered"].includes(o.status)).length;
  const unpaidInvoices = invoices.filter((i) => i.status === "unpaid").reduce((sum, i) => sum + i.total, 0);
  const paidInvoices = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total, 0);

  // Expense stats
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expensesByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  // Profit
  const netProfit = paidInvoices - totalExpenses;

  // Chart data
  const stockData = products.slice(0, 8).map((p) => ({ name: p.name, quantity: p.quantity }));

  const salesByStatus = [
    { name: "Draft", value: salesOrders.filter((o) => o.status === "draft").length },
    { name: "Confirmed", value: salesOrders.filter((o) => o.status === "confirmed").length },
    { name: "Shipped", value: salesOrders.filter((o) => o.status === "shipped").length },
    { name: "Delivered", value: salesOrders.filter((o) => o.status === "delivered").length },
    { name: "Cancelled", value: salesOrders.filter((o) => o.status === "cancelled").length },
  ].filter((s) => s.value > 0);

  const expenseCategoryData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

  const revenueVsExpense = [
    { name: "Revenue", amount: paidInvoices },
    { name: "Expenses", amount: totalExpenses },
    { name: "Profit", amount: netProfit > 0 ? netProfit : 0 },
  ];

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Business overview — products, sales, and expenses</p>
      </div>

      {/* Summary Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <SummaryCard icon="📦" label="Products" value={String(totalProducts)} sub={`${totalStock} units in stock`} color="bg-blue-50" />
        <SummaryCard icon="💰" label="Inventory Value" value={`$${inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub={`${lowStockItems.length} low stock`} color="bg-purple-50" />
        <SummaryCard icon="💸" label="Sales Revenue" value={`$${totalSalesRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub={`${confirmedOrders} active orders`} color="bg-green-50" />
        <SummaryCard icon="📊" label="Total Expenses" value={`$${totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub={`${expenses.length} records`} color="bg-red-50" />
      </div>

      {/* Summary Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <SummaryCard icon="🧾" label="Unpaid Invoices" value={`$${unpaidInvoices.toFixed(2)}`} sub={`${invoices.filter(i => i.status === "unpaid").length} pending`} color="bg-yellow-50" />
        <SummaryCard icon="✅" label="Collected" value={`$${paidInvoices.toFixed(2)}`} sub={`${invoices.filter(i => i.status === "paid").length} paid`} color="bg-green-50" />
        <SummaryCard icon="📈" label="Net Profit" value={`$${netProfit.toFixed(2)}`} sub={netProfit >= 0 ? "Profitable" : "Loss"} color={netProfit >= 0 ? "bg-green-50" : "bg-red-50"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueVsExpense}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                <Cell fill="#16a34a" />
                <Cell fill="#ef4444" />
                <Cell fill="#3b82f6" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Sales Orders by Status</h3>
          {salesByStatus.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No sales orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={salesByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                  fontSize={11}
                >
                  {salesByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stock Levels */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Stock Levels</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#ff3f6c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          {expenseCategoryData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No expenses yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                  fontSize={11}
                >
                  {expenseCategoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Low Stock Alerts (&lt;25 units)</h3>
          {lowStockItems.length === 0 ? (
            <p className="text-green-600 text-sm text-center py-8">✅ All items are well-stocked</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-bold uppercase text-gray-500 py-2 px-3">Product</th>
                  <th className="text-left text-xs font-bold uppercase text-gray-500 py-2 px-3">Stock</th>
                  <th className="text-left text-xs font-bold uppercase text-gray-500 py-2 px-3">Price</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-3 px-3 text-sm text-gray-700">{p.name}</td>
                    <td className="py-3 px-3 text-sm font-bold text-red-600">{p.quantity}</td>
                    <td className="py-3 px-3 text-sm text-gray-700">${p.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Sales Orders</h3>
          {salesOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales orders yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-bold uppercase text-gray-500 py-2 px-3">Order</th>
                  <th className="text-left text-xs font-bold uppercase text-gray-500 py-2 px-3">Customer</th>
                  <th className="text-left text-xs font-bold uppercase text-gray-500 py-2 px-3">Status</th>
                  <th className="text-right text-xs font-bold uppercase text-gray-500 py-2 px-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-b border-gray-50">
                    <td className="py-3 px-3 text-sm font-semibold text-gray-800">#{o.id}</td>
                    <td className="py-3 px-3 text-sm text-gray-600">{o.customer_name}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        o.status === "delivered" ? "bg-green-50 text-green-700" :
                        o.status === "cancelled" ? "bg-red-50 text-red-500" :
                        "bg-blue-50 text-blue-700"
                      }`}>{o.status}</span>
                    </td>
                    <td className="py-3 px-3 text-sm font-bold text-gray-900 text-right">${o.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
      {icon}
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-400">{sub}</span>
    </div>
  </div>
);

export default Dashboard;
