import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Chatbot from "./components/Chatbot";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import SalesOrders from "./pages/SalesOrders";
import Invoices from "./pages/Invoices";
import PurchaseOrders from "./pages/PurchaseOrders";
import Expenses from "./pages/Expenses";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-60 flex-1 bg-gray-50 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales/orders" element={<SalesOrders />} />
            <Route path="/sales/invoices" element={<Invoices />} />
            <Route path="/purchases/orders" element={<PurchaseOrders />} />
            <Route path="/purchases/expenses" element={<Expenses />} />
          </Routes>
        </main>
        <Chatbot />
      </div>
    </BrowserRouter>
  );
}

export default App;
