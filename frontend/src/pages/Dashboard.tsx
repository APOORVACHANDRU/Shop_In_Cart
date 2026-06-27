import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Product } from "../types";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

const COLORS = ["#ff3f6c", "#ff905a", "#7c3aed", "#3b82f6", "#16a34a", "#eab308"];

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get("/products/", { params: { limit: 100 } });
        setProducts(res.data.products || []);
      } catch {
        setProducts([]);
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

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockItems = products.filter((p) => p.quantity < 25);

  const stockData = products.map((p) => ({ name: p.name, quantity: p.quantity }));
  const priceData = products.map((p) => ({ name: p.name, price: p.price }));
  const valueData = products.map((p) => ({
    name: p.name,
    value: Math.round(p.price * p.quantity * 100) / 100,
  }));

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Inventory overview and analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <SummaryCard icon="📦" label="Total Products" value={String(totalProducts)} color="bg-blue-50" />
        <SummaryCard icon="💰" label="Inventory Value" value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="bg-green-50" />
        <SummaryCard icon="📊" label="Total Stock" value={`${totalStock} units`} color="bg-purple-50" />
        <SummaryCard icon="⚠️" label="Low Stock Items" value={String(lowStockItems.length)} color="bg-red-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Stock Levels by Product</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#ff3f6c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Inventory Value Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={valueData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                labelLine={false}
                fontSize={11}
              >
                {valueData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Price Line Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Price Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
              <Line type="monotone" dataKey="price" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed" }} />
            </LineChart>
          </ResponsiveContainer>
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
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
      {icon}
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-xl font-bold text-gray-900">{value}</span>
    </div>
  </div>
);

export default Dashboard;
