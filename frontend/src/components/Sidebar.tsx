import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";

const Sidebar = () => {
  const location = useLocation();
  const [salesOpen, setSalesOpen] = useState(location.pathname.startsWith("/sales"));
  const [purchasesOpen, setPurchasesOpen] = useState(location.pathname.startsWith("/purchases"));

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-pink-brand text-white"
        : "text-slate-400 hover:bg-white/10 hover:text-white"
    }`;

  const subLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-lg text-sm transition-all ${
      isActive
        ? "text-pink-brand font-semibold bg-white/5"
        : "text-slate-500 hover:text-white hover:bg-white/5"
    }`;

  const menuBtnClass = (isOpen: boolean, isActive: boolean) =>
    `flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-white/10 text-white"
        : "text-slate-400 hover:bg-white/10 hover:text-white"
    }`;

  const isSalesActive = location.pathname.startsWith("/sales");
  const isPurchasesActive = location.pathname.startsWith("/purchases");

  return (
    <aside className="w-60 min-h-screen bg-dark text-white flex flex-col py-6 fixed left-0 top-0 z-50">
      <div className="flex items-center gap-3 px-6 pb-6 border-b border-white/10">
        <span className="text-2xl">📦</span>
        <h2 className="text-xl font-bold tracking-tight">Aarion</h2>
      </div>
      <nav className="flex flex-col gap-1 px-3 mt-4">
        <NavLink to="/" className={linkClass}>
          <span className="text-lg">📊</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/products" className={linkClass}>
          <span className="text-lg">🛒</span>
          <span>Products</span>
        </NavLink>

        {/* Sales with sub-menu */}
        <div>
          <button
            onClick={() => setSalesOpen(!salesOpen)}
            className={menuBtnClass(salesOpen, isSalesActive)}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">💸</span>
              <span>Sales</span>
            </div>
            <span className={`text-xs transition-transform ${salesOpen ? "rotate-180" : ""}`}>▼</span>
          </button>
          {salesOpen && (
            <div className="mt-1 flex flex-col gap-0.5">
              <NavLink to="/sales/orders" className={subLinkClass}>
                Sales Orders
              </NavLink>
              <NavLink to="/sales/invoices" className={subLinkClass}>
                Invoices & Payments
              </NavLink>
            </div>
          )}
        </div>

        {/* Purchases with sub-menu */}
        <div>
          <button
            onClick={() => setPurchasesOpen(!purchasesOpen)}
            className={menuBtnClass(purchasesOpen, isPurchasesActive)}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📥</span>
              <span>Purchases</span>
            </div>
            <span className={`text-xs transition-transform ${purchasesOpen ? "rotate-180" : ""}`}>▼</span>
          </button>
          {purchasesOpen && (
            <div className="mt-1 flex flex-col gap-0.5">
              <NavLink to="/purchases/orders" className={subLinkClass}>
                Purchase Orders
              </NavLink>
              <NavLink to="/purchases/expenses" className={subLinkClass}>
                Expenses
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
