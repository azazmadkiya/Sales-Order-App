import React from 'react';
import { 
  FileText, 
  PlusCircle, 
  Truck, 
  Users, 
  Package, 
  CheckCircle2
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewOrder: () => void;
  onOpenProfile: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOrder,
}) => {
  const { orders } = useApp();
  const { permissions, user } = useAuth();
  const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1 flex items-center justify-around shadow-2xl safe-area-bottom"
    >
      {/* 1. Orders Tab */}
      <button
        onClick={() => setActiveTab('orders_list')}
        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
          activeTab === 'orders_list'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <FileText className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-600 text-white font-mono text-[9px] font-bold px-1 rounded-full">
              {pendingCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Orders</span>
      </button>

      {/* 2. Shipments / Dispatch Tab */}
      <button
        onClick={() => setActiveTab('shipments')}
        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
          activeTab === 'shipments'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Truck className="w-5 h-5" />
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Dispatch</span>
      </button>

      {/* 3. Central Action Button */}
      {permissions.canCreateOrder ? (
        <button
          onClick={onOpenNewOrder}
          className={`flex flex-col items-center justify-center -mt-5 mx-1 px-3 py-2 rounded-2xl shadow-lg transition-transform active:scale-95 ${
            activeTab === 'new_order'
              ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
              : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-900/40'
          }`}
        >
          <PlusCircle className="w-6 h-6" />
          <span className="text-[10px] font-extrabold mt-0.5 whitespace-nowrap leading-none">New Bill</span>
        </button>
      ) : permissions.canDispatch ? (
        <button
          onClick={() => setActiveTab('shipments')}
          className={`flex flex-col items-center justify-center -mt-5 mx-1 px-3 py-2 rounded-2xl shadow-lg transition-transform active:scale-95 ${
            activeTab === 'shipments'
              ? 'bg-amber-500 text-white ring-4 ring-amber-500/20'
              : 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-amber-900/40'
          }`}
        >
          <Truck className="w-6 h-6" />
          <span className="text-[10px] font-extrabold mt-0.5 whitespace-nowrap leading-none">Dispatch</span>
        </button>
      ) : null}

      {/* 4. Parties Master */}
      <button
        onClick={() => setActiveTab('parties')}
        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
          activeTab === 'parties'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Parties</span>
      </button>

      {/* 5. Products Master */}
      <button
        onClick={() => setActiveTab('products')}
        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
          activeTab === 'products'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Package className="w-5 h-5" />
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Items</span>
      </button>
    </nav>
  );
};
